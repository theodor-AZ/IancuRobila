export type Category = 'legal' | 'truth' | 'conversion' | 'accessibility' | 'trust';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  claim: string;
  evidence: {
    source: string; // URL, screenshot reference, or document snippet
    snippet: string;
    location?: string;
  };
  rule?: string;
  risk: string;
  fix: string;
  confidence: number; // 0 - 1
}

export interface ScanSummary {
  id: string;
  campaignName: string;
  brand: string;
  productCategory: 'cosmetics' | 'general';
  landingPageUrl: string;
  adText: string;
  adImageUrl: string;
  documents: string[];
  createdAt: string;
  score: number;
  findings: Finding[];
}