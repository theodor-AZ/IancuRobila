/**
 * Supabase database types for ClaimGuard X, matching supabase/migrations/20261107120000_init.sql.
 * Same shape as `supabase gen types typescript`. Once the project is linked, regenerate with:
 *   npx supabase gen types typescript --project-id <id> > src/db/database.types.ts
 * Usage: createClient<Database>(url, key)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type FindingCategory = 'legal' | 'truth' | 'conversion' | 'accessibility' | 'trust';
type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';
type ProductCategory = 'cosmetics' | 'general';
type DocumentKind = 'technical_sheet' | 'certification' | 'study' | 'other';
type ScanStatus = 'queued' | 'running' | 'completed' | 'failed';
type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface Database {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          brand: string | null;
          product_category: ProductCategory;
          ad_text: string;
          ad_image_path: string | null;
          landing_url: string | null;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          name: string;
          brand?: string | null;
          product_category?: ProductCategory;
          ad_text?: string;
          ad_image_path?: string | null;
          landing_url?: string | null;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
        Relationships: [];
      };
      campaign_documents: {
        Row: {
          id: string;
          campaign_id: string;
          owner_id: string | null;
          kind: DocumentKind;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          owner_id?: string | null;
          kind?: DocumentKind;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          extracted_text?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['campaign_documents']['Insert']>;
        Relationships: [
          { foreignKeyName: 'campaign_documents_campaign_id_fkey'; columns: ['campaign_id']; isOneToOne: false; referencedRelation: 'campaigns'; referencedColumns: ['id'] },
        ];
      };
      scans: {
        Row: {
          id: string;
          campaign_id: string;
          owner_id: string | null;
          status: ScanStatus;
          score: number | null;
          landing_url: string | null;
          ad_text: string | null;
          offer: Json | null;
          screenshots: Json;
          error: string | null;
          total_ms: number | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          owner_id?: string | null;
          status?: ScanStatus;
          score?: number | null;
          landing_url?: string | null;
          ad_text?: string | null;
          offer?: Json | null;
          screenshots?: Json;
          error?: string | null;
          total_ms?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['scans']['Insert']>;
        Relationships: [
          { foreignKeyName: 'scans_campaign_id_fkey'; columns: ['campaign_id']; isOneToOne: false; referencedRelation: 'campaigns'; referencedColumns: ['id'] },
        ];
      };
      scan_steps: {
        Row: {
          id: string;
          scan_id: string;
          name: string;
          label: string | null;
          position: number;
          status: StepStatus;
          findings_count: number;
          duration_ms: number | null;
          error: string | null;
          data: Json | null;
          started_at: string | null;
          finished_at: string | null;
        };
        Insert: {
          id?: string;
          scan_id: string;
          name: string;
          label?: string | null;
          position?: number;
          status?: StepStatus;
          findings_count?: number;
          duration_ms?: number | null;
          error?: string | null;
          data?: Json | null;
          started_at?: string | null;
          finished_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['scan_steps']['Insert']>;
        Relationships: [
          { foreignKeyName: 'scan_steps_scan_id_fkey'; columns: ['scan_id']; isOneToOne: false; referencedRelation: 'scans'; referencedColumns: ['id'] },
        ];
      };
      findings: {
        Row: {
          id: string;
          scan_id: string;
          finding_key: string;
          source: string | null;
          category: FindingCategory;
          severity: FindingSeverity;
          title: string;
          claim: string;
          evidence: Json;
          rule: string | null;
          risk: string;
          fix: string;
          confidence: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          scan_id: string;
          finding_key: string;
          source?: string | null;
          category: FindingCategory;
          severity: FindingSeverity;
          title: string;
          claim?: string;
          evidence?: Json;
          rule?: string | null;
          risk?: string;
          fix?: string;
          confidence: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['findings']['Insert']>;
        Relationships: [
          { foreignKeyName: 'findings_scan_id_fkey'; columns: ['scan_id']; isOneToOne: false; referencedRelation: 'scans'; referencedColumns: ['id'] },
        ];
      };
    };
    Views: {
      scan_overview: {
        Row: {
          scan_id: string;
          campaign_id: string;
          campaign_name: string;
          brand: string | null;
          is_demo: boolean;
          owner_id: string | null;
          status: ScanStatus;
          score: number | null;
          created_at: string;
          completed_at: string | null;
          findings_total: number;
          critical_count: number;
          high_count: number;
          medium_count: number;
          low_count: number;
          legal_count: number;
          truth_count: number;
          conversion_count: number;
          accessibility_count: number;
          trust_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      compute_scan_score: { Args: { p_scan_id: string }; Returns: number };
    };
    Enums: {
      finding_category: FindingCategory;
      finding_severity: FindingSeverity;
      product_category: ProductCategory;
      document_kind: DocumentKind;
      scan_status: ScanStatus;
      step_status: StepStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
