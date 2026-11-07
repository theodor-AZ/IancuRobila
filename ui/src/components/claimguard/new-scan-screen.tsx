"use client";

import { useId, useState, type FormEvent } from "react";
import { FileText, ImagePlus, ScanLine, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProductCategory } from "@/lib/types";

export interface NewScanInput {
  adText: string;
  adImage: File | null;
  landingUrl: string;
  documents: File[];
  productCategory: ProductCategory;
}

type Errors = Partial<Record<"adText" | "adImage" | "landingUrl" | "documents", string>>;

const DEMO_AD_TEXT =
  "GlowPure Hydra Cream. 48h hydration. Clinically proven. -50% this week only. 100% natural · eco-friendly packaging. Free delivery. Only today! Buy now";

/** Demo campaign: fictional brand, landing page served by this app (public/demo-site). */
async function loadDemo(): Promise<Pick<NewScanInput, "adText" | "landingUrl" | "adImage" | "productCategory">> {
  let adImage: File | null = null;
  try {
    const blob = await (await fetch("/demo/ad-glowpure.svg")).blob();
    adImage = new File([blob], "ad-glowpure.svg", { type: "image/svg+xml" });
  } catch {}
  return { adText: DEMO_AD_TEXT, landingUrl: `${window.location.origin}/demo-site/flawed-shop/index.html`, adImage, productCategory: "cosmetics" };
}

/** Colleague 4 demo campaigns (public/demo-campaigns, fictional brands). */
const ROLE4_CAMPAIGNS = [
  { id: "cosmetics", label: "Velunara (cosmetics)" },
  { id: "detergent", label: "Mossmorrow (detergent)" },
  { id: "store", label: "Nookstitch (online store)" },
  { id: "control", label: "Plainharbor (clean control)" },
] as const;

async function fileFrom(url: string, name: string, type: string): Promise<File | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return new File([await r.blob()], name, { type });
  } catch {
    return null;
  }
}

async function loadRole4(id: string): Promise<Partial<NewScanInput>> {
  const base = `/demo-campaigns/${id}`;
  const md = await (await fetch(`${base}/ad-copy.md`)).text();
  // Ad copy as plain text: drop Markdown markers, keep the words.
  const adText = md
    .replace(/^#+\s*/gm, "")
    .replace(/[*_`>]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  const [adImage, d1, d2] = await Promise.all([
    fileFrom(`${base}/artwork.svg`, `${id}-artwork.svg`, "image/svg+xml"),
    fileFrom(`${base}/evidence-1.pdf`, `${id}-evidence-1.pdf`, "application/pdf"),
    fileFrom(`${base}/evidence-2.pdf`, `${id}-evidence-2.pdf`, "application/pdf"),
  ]);
  return {
    adText,
    adImage,
    documents: [d1, d2].filter((d): d is File => !!d),
    landingUrl: `${window.location.origin}${base}/index.html`,
    productCategory: id === "cosmetics" ? "cosmetics" : "general",
  };
}

export function validateNewScan(v: NewScanInput): Errors {
  const e: Errors = {};
  if (v.adText.trim().length < 10) e.adText = "Paste the ad copy (at least 10 characters).";
  if (v.adImage && !/^image\/(png|jpeg|webp|svg\+xml)$/.test(v.adImage.type)) e.adImage = "Use a PNG, JPG, WebP or SVG image.";
  if (v.adImage && v.adImage.size > 10 * 1024 * 1024) e.adImage = "The image is larger than 10 MB.";
  try {
    const u = new URL(v.landingUrl.trim());
    if (!/^https?:$/.test(u.protocol)) throw new Error();
  } catch {
    e.landingUrl = "Enter the full landing page address, starting with https://";
  }
  if (v.documents.some((d) => d.type !== "application/pdf")) e.documents = "Product documents must be PDF files.";
  if (v.documents.length > 5) e.documents = "Upload at most 5 documents.";
  return e;
}

/** Campaign upload. UI and validation only; `onSubmit` receives the validated input. */
export function NewScanScreen({ onSubmit }: { onSubmit: (input: NewScanInput) => void | Promise<void> }) {
  const [v, setV] = useState<NewScanInput>({ adText: "", adImage: null, landingUrl: "", documents: [], productCategory: "general" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const ids = { text: useId(), img: useId(), url: useId(), docs: useId(), cat: useId() };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validateNewScan(v);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0] === "adText" ? ids.text : Object.keys(errs)[0] === "landingUrl" ? ids.url : ids.img)?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(v);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "The scan could not start. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-3xl gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">New scan</h1>
          <p className="mt-1 max-w-[60ch] text-sm text-muted-foreground">
            Give us the ad, its landing page and the product documents. We cross-check all three and report what could go wrong before you
            spend the budget.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={async () => {
            const demo = await loadDemo();
            setV((s) => ({ ...s, ...demo, documents: [] }));
            setErrors({});
          }}>
          <Sparkles aria-hidden className="size-3.5" />
          Fill with demo campaign
        </Button>
      </div>

      <div className="-mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Test campaigns with evidence PDFs:</span>
        {ROLE4_CAMPAIGNS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={async () => {
              const demo = await loadRole4(c.id);
              setV((s) => ({ ...s, ...demo }));
              setErrors({});
            }}
            className="rounded-sm border px-2 py-1 text-foreground transition-colors hover:border-border-strong hover:bg-muted/50"
          >
            {c.label}
          </button>
        ))}
      </div>

      <fieldset className="grid gap-5 rounded-lg border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">Ad</legend>

        <div className="grid gap-1.5">
          <Label htmlFor={ids.text}>Ad copy</Label>
          <Textarea
            id={ids.text}
            rows={4}
            value={v.adText}
            onChange={(e) => setV({ ...v, adText: e.target.value })}
            placeholder="Paste the headline, body text and call to action exactly as they appear in the ad"
            aria-invalid={!!errors.adText}
            aria-describedby={errors.adText ? `${ids.text}-err` : undefined}
          />
          {errors.adText && <p id={`${ids.text}-err`} className="text-xs text-sev-critical-fg">{errors.adText}</p>}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={ids.img}>Ad image <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <label
            htmlFor={ids.img}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-4 py-4 text-sm transition-colors hover:border-border-strong hover:bg-muted/40",
              errors.adImage && "border-sev-critical/60",
            )}
          >
            <ImagePlus aria-hidden className="size-5 text-muted-foreground" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate">
              {v.adImage ? v.adImage.name : <span className="text-muted-foreground">Choose the creative: PNG, JPG, WebP or SVG, up to 10 MB</span>}
            </span>
            {v.adImage && (
              <button
                type="button"
                aria-label="Remove image"
                className="rounded-xs p-1 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  setV({ ...v, adImage: null });
                }}
              >
                <X aria-hidden className="size-4" />
              </button>
            )}
          </label>
          <input
            id={ids.img}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            onChange={(e) => setV({ ...v, adImage: e.target.files?.[0] ?? null })}
          />
          {errors.adImage && <p className="text-xs text-sev-critical-fg">{errors.adImage}</p>}
        </div>
      </fieldset>

      <fieldset className="grid gap-5 rounded-lg border bg-card p-5">
        <legend className="px-1 text-sm font-semibold">Landing page and evidence</legend>

        <div className="grid gap-1.5">
          <Label htmlFor={ids.url}>Landing page URL</Label>
          <Input
            id={ids.url}
            type="url"
            inputMode="url"
            value={v.landingUrl}
            onChange={(e) => setV({ ...v, landingUrl: e.target.value })}
            placeholder="https://"
            className="num"
            aria-invalid={!!errors.landingUrl}
            aria-describedby={errors.landingUrl ? `${ids.url}-err` : `${ids.url}-hint`}
          />
          {errors.landingUrl ? (
            <p id={`${ids.url}-err`} className="text-xs text-sev-critical-fg">{errors.landingUrl}</p>
          ) : (
            <p id={`${ids.url}-hint`} className="text-xs text-muted-foreground">The page the ad links to. We open it on desktop and on a 390 px phone.</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor={ids.docs}>Product documents <span className="font-normal text-muted-foreground">(PDF, optional)</span></Label>
          <label
            htmlFor={ids.docs}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed px-4 py-4 text-sm transition-colors hover:border-border-strong hover:bg-muted/40"
          >
            <FileText aria-hidden className="size-5 text-muted-foreground" strokeWidth={1.75} />
            <span className="text-muted-foreground">Spec sheet, certifications, studies. They are the evidence your claims are checked against.</span>
          </label>
          <input
            id={ids.docs}
            type="file"
            accept="application/pdf"
            multiple
            className="sr-only"
            onChange={(e) => setV({ ...v, documents: [...v.documents, ...Array.from(e.target.files ?? [])] })}
          />
          {v.documents.length > 0 && (
            <ul className="grid gap-1">
              {v.documents.map((d, i) => (
                <li key={`${d.name}-${i}`} className="flex items-center gap-2 rounded-sm bg-muted/50 px-2.5 py-1.5 text-xs">
                  <FileText aria-hidden className="size-3.5 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{d.name}</span>
                  <span className="num text-muted-foreground">{Math.max(1, Math.round(d.size / 1024))} KB</span>
                  <button
                    type="button"
                    aria-label={`Remove ${d.name}`}
                    className="rounded-xs p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setV({ ...v, documents: v.documents.filter((_, j) => j !== i) })}
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.documents && <p className="text-xs text-sev-critical-fg">{errors.documents}</p>}
        </div>

        <div className="grid gap-1.5">
          <span id={ids.cat} className="text-sm font-medium">Product category</span>
          <div role="radiogroup" aria-labelledby={ids.cat} className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: "cosmetics", title: "Cosmetics", hint: "Adds the cosmetic claim rules (Regulation 655/2013)" },
                { value: "general", title: "General product", hint: "Consumer protection and green claim rules" },
              ] as const
            ).map((o) => (
              <label
                key={o.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 transition-colors",
                  v.productCategory === o.value ? "border-beam bg-accent" : "hover:border-border-strong",
                )}
              >
                <input
                  type="radio"
                  name="productCategory"
                  value={o.value}
                  checked={v.productCategory === o.value}
                  onChange={() => setV({ ...v, productCategory: o.value })}
                  className="mt-1 accent-(--beam)"
                />
                <span>
                  <span className="block text-sm font-medium">{o.title}</span>
                  <span className="block text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {submitError && <ErrorState title="The scan could not start" description={submitError} />}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <p className="mr-auto text-xs text-muted-foreground">A scan takes about 40 seconds.</p>
        <Button type="submit" size="lg" disabled={submitting}>
          <ScanLine aria-hidden className="size-4" />
          {submitting ? "Starting scan…" : "Run Red Team scan"}
        </Button>
      </div>
    </form>
  );
}
