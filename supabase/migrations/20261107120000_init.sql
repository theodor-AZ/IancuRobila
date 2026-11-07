-- ClaimGuard X: initial database schema (Supabase / Postgres)
--
-- Flow: a campaign (ad text + image + landing URL + product documents)
--       -> one or more scans -> each scan runs steps (technical checks + AI)
--       -> each step produces findings (the shared Finding type, rule 3 in the brief).
--
-- Ownership: every row has owner_id = auth.uid(). RLS lets users see only their own rows,
-- plus demo campaigns (is_demo = true), which are readable by everyone (jury, logged-out demo).
-- The scan pipeline runs server-side with the service role key, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Enums (values match src/types.ts)
-- ---------------------------------------------------------------------------
create type public.finding_category as enum ('legal', 'truth', 'conversion', 'accessibility', 'trust');
create type public.finding_severity as enum ('critical', 'high', 'medium', 'low');
create type public.product_category as enum ('cosmetics', 'general');
create type public.document_kind    as enum ('technical_sheet', 'certification', 'study', 'other');
create type public.scan_status      as enum ('queued', 'running', 'completed', 'failed');
create type public.step_status      as enum ('pending', 'running', 'completed', 'failed', 'skipped');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- campaigns: what the user uploads in NewScanScreen
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references auth.users (id) on delete cascade default auth.uid(),
  name             text not null check (length(trim(name)) > 0),
  brand            text,
  product_category public.product_category not null default 'general',
  ad_text          text not null default '',
  -- path inside the "ad-images" bucket: <owner_id>/<campaign_id>/<file>
  ad_image_path    text,
  landing_url      text check (landing_url is null or landing_url ~* '^https?://'),
  is_demo          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index campaigns_owner_idx on public.campaigns (owner_id, created_at desc);
create trigger campaigns_updated_at before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- campaign_documents: product evidence (technical sheet, certifications, studies)
-- ---------------------------------------------------------------------------
create table public.campaign_documents (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  owner_id       uuid references auth.users (id) on delete cascade default auth.uid(),
  kind           public.document_kind not null default 'other',
  file_name      text not null,
  -- path inside the "product-documents" bucket: <owner_id>/<campaign_id>/<file>
  storage_path   text not null,
  mime_type      text,
  size_bytes     bigint check (size_bytes is null or size_bytes >= 0),
  -- text extracted from the PDF, sent to the model as evidence context
  extracted_text text,
  created_at     timestamptz not null default now()
);
create index campaign_documents_campaign_idx on public.campaign_documents (campaign_id);

-- ---------------------------------------------------------------------------
-- scans: one run of the Red Team pipeline on a campaign (ScanReport, ScanHistoryScreen)
-- ---------------------------------------------------------------------------
create table public.scans (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  owner_id     uuid references auth.users (id) on delete cascade default auth.uid(),
  status       public.scan_status not null default 'queued',
  -- overall campaign score 0-100 (see public.compute_scan_score)
  score        smallint check (score between 0 and 100),
  -- snapshot of what was scanned (the campaign can change later)
  landing_url  text,
  ad_text      text,
  -- structured page data used by the Truth & Consistency comparison (extractOffer result)
  offer        jsonb,
  -- paths in the "screenshots" bucket: {"desktop": "...", "mobile": "...", "desktopFold": "...", "mobileFold": "..."}
  screenshots  jsonb not null default '{}'::jsonb,
  error        text,
  total_ms     integer check (total_ms is null or total_ms >= 0),
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  check (status <> 'completed' or completed_at is not null)
);
create index scans_campaign_idx on public.scans (campaign_id, created_at desc);
create index scans_owner_idx    on public.scans (owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- scan_steps: progress of each check (ScanProgress screen, via Realtime)
-- name = module name: capturePage, checkLinks, checkPerformance, checkAccessibility,
--        extractOffer, lighthouse, plus the AI steps the base adds (e.g. extractClaims).
-- ---------------------------------------------------------------------------
create table public.scan_steps (
  id             uuid primary key default gen_random_uuid(),
  scan_id        uuid not null references public.scans (id) on delete cascade,
  name           text not null,
  label          text,            -- UI text, e.g. 'Checking landing page…'
  position       smallint not null default 0,
  status         public.step_status not null default 'pending',
  findings_count integer not null default 0 check (findings_count >= 0),
  duration_ms    integer check (duration_ms is null or duration_ms >= 0),
  error          text,
  data           jsonb,           -- raw module output if needed (CheckResult.data)
  started_at     timestamptz,
  finished_at    timestamptz,
  unique (scan_id, name)
);
create index scan_steps_scan_idx on public.scan_steps (scan_id, position);

-- ---------------------------------------------------------------------------
-- findings: one vulnerability = one Finding object
-- ---------------------------------------------------------------------------
create table public.findings (
  id          uuid primary key default gen_random_uuid(),
  scan_id     uuid not null references public.scans (id) on delete cascade,
  -- Finding.id as produced by the module (e.g. "links-1doe2jm"), unique per scan
  finding_key text not null,
  source      text,               -- which step produced it (scan_steps.name)
  category    public.finding_category not null,
  severity    public.finding_severity not null,
  title       text not null,
  claim       text not null default '',
  evidence    jsonb not null default '{}'::jsonb,  -- Evidence: url, screenshot, snippet, selector, details
  rule        text,               -- e.g. "WCAG 2.x SC 4.1.2" or a rules.json id
  risk        text not null default '',
  fix         text not null default '',
  confidence  numeric(3, 2) not null check (confidence between 0 and 1),
  created_at  timestamptz not null default now(),
  unique (scan_id, finding_key),
  check (jsonb_typeof(evidence) = 'object')
);
create index findings_scan_idx on public.findings (scan_id, severity, category);

-- ---------------------------------------------------------------------------
-- Score: 100 minus a weight per finding (critical 15, high 7, medium 3, low 1), floored at 0.
-- Proposal only: the base may compute it differently and just write scans.score.
-- ---------------------------------------------------------------------------
create function public.compute_scan_score(p_scan_id uuid) returns smallint
language sql stable as $$
  select greatest(0, 100 - coalesce(sum(case severity
           when 'critical' then 15 when 'high' then 7 when 'medium' then 3 else 1 end), 0))::smallint
  from public.findings where scan_id = p_scan_id
$$;

-- ---------------------------------------------------------------------------
-- scan_overview: one row per scan with counts (ScanHistoryScreen + ScanReport header)
-- security_invoker = the caller's RLS applies.
-- ---------------------------------------------------------------------------
create view public.scan_overview with (security_invoker = true) as
select
  s.id            as scan_id,
  s.campaign_id,
  c.name          as campaign_name,
  c.brand,
  c.is_demo,
  s.owner_id,
  s.status,
  s.score,
  s.created_at,
  s.completed_at,
  count(f.id)::int                                              as findings_total,
  count(f.id) filter (where f.severity = 'critical')::int       as critical_count,
  count(f.id) filter (where f.severity = 'high')::int           as high_count,
  count(f.id) filter (where f.severity = 'medium')::int         as medium_count,
  count(f.id) filter (where f.severity = 'low')::int            as low_count,
  count(f.id) filter (where f.category = 'legal')::int          as legal_count,
  count(f.id) filter (where f.category = 'truth')::int          as truth_count,
  count(f.id) filter (where f.category = 'conversion')::int     as conversion_count,
  count(f.id) filter (where f.category = 'accessibility')::int  as accessibility_count,
  count(f.id) filter (where f.category = 'trust')::int          as trust_count
from public.scans s
join public.campaigns c on c.id = s.campaign_id
left join public.findings f on f.scan_id = s.id
group by s.id, c.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.campaigns          enable row level security;
alter table public.campaign_documents enable row level security;
alter table public.scans              enable row level security;
alter table public.scan_steps         enable row level security;
alter table public.findings           enable row level security;

-- Can the current user read this campaign? (own, or a demo)
create function public.can_read_campaign(p_campaign_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campaigns
    where id = p_campaign_id and (is_demo or owner_id = auth.uid())
  )
$$;

-- Can the current user read this scan?
create function public.can_read_scan(p_scan_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.scans s join public.campaigns c on c.id = s.campaign_id
    where s.id = p_scan_id and (c.is_demo or s.owner_id = auth.uid())
  )
$$;

-- campaigns
create policy "campaigns: read own or demo" on public.campaigns
  for select using (is_demo or owner_id = auth.uid());
create policy "campaigns: insert own" on public.campaigns
  for insert to authenticated with check (owner_id = auth.uid() and not is_demo);
create policy "campaigns: update own" on public.campaigns
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and not is_demo);
create policy "campaigns: delete own" on public.campaigns
  for delete to authenticated using (owner_id = auth.uid());

-- campaign_documents
create policy "documents: read" on public.campaign_documents
  for select using (public.can_read_campaign(campaign_id));
create policy "documents: insert own" on public.campaign_documents
  for insert to authenticated with check (
    owner_id = auth.uid()
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid())
  );
create policy "documents: delete own" on public.campaign_documents
  for delete to authenticated using (owner_id = auth.uid());

-- scans: users create scans (status queued); the pipeline (service role) fills in results
-- (checks the row's own columns, not can_read_scan(id): a just-inserted row is not yet
--  visible to that lookup, which would break insert(...).select() from the client)
create policy "scans: read" on public.scans
  for select using (owner_id = auth.uid() or public.can_read_campaign(campaign_id));
create policy "scans: insert own" on public.scans
  for insert to authenticated with check (
    owner_id = auth.uid()
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.owner_id = auth.uid())
  );
create policy "scans: delete own" on public.scans
  for delete to authenticated using (owner_id = auth.uid());

-- scan_steps and findings: read-only for users, written by the pipeline
create policy "scan_steps: read" on public.scan_steps
  for select using (public.can_read_scan(scan_id));
create policy "findings: read" on public.findings
  for select using (public.can_read_scan(scan_id));

-- ---------------------------------------------------------------------------
-- Storage buckets (private). Path convention: <owner_id>/<campaign_id>/<file>
-- Demo files go under demo/<campaign_id>/<file> and are readable by everyone.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('ad-images',         'ad-images',         false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('product-documents', 'product-documents', false, 20971520, array['application/pdf', 'text/plain']),
  ('screenshots',       'screenshots',       false, 10485760, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

create policy "files: read own or demo" on storage.objects
  for select using (
    bucket_id in ('ad-images', 'product-documents', 'screenshots')
    and ((storage.foldername(name))[1] = 'demo' or (storage.foldername(name))[1] = auth.uid()::text)
  );
-- users upload ad images and documents; screenshots are written by the pipeline only
create policy "files: upload own" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('ad-images', 'product-documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "files: delete own" on storage.objects
  for delete to authenticated using (
    bucket_id in ('ad-images', 'product-documents')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Realtime: ScanProgress subscribes to scan_steps and scans changes
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.scans, public.scan_steps;
