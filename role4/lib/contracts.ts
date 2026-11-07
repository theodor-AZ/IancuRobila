export const categories = ['legal', 'truth', 'conversion', 'accessibility', 'trust'] as const;
export type Category = typeof categories[number];
export interface Finding {
  id: string; category: Category; severity: 'critical' | 'high' | 'medium' | 'low';
  title: string; claim: string; evidence: string; rule: string; risk: string; fix: string; confidence: number;
}
export interface Scan { campaignId: string; findings: Finding[] }
export interface ScannerOutput { campaigns: Scan[] }
export interface Criterion { anyOf: string[] }
