export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export type FindingCategory =
  | 'price_discrepancy'
  | 'unsubstantiated_claim'
  | 'hidden_terms'
  | 'regulatory_risk'
  | 'dark_pattern'
  // Adăugate pentru verificările tehnice ale scannerului (link-uri, accesibilitate)
  | 'broken_conversion'
  | 'accessibility';

/** Chenar pe captura landing page-ului, în % din imagine (0–100). Vine de la scanner. */
export interface EvidenceFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface EvidencePair {
  adText: string;
  adSource: string;
  landingText: string;
  landingUrl: string;
  contextSnippet?: string;
  /** Unde apare problema pe captura landing page-ului (doar la scanările reale). */
  frames?: EvidenceFrame[];
}

export interface Finding {
  id: string;
  scanId: string;
  title: string;
  category: FindingCategory;
  severity: FindingSeverity;
  riskDescription: string;
  regulatoryReference?: string;
  evidence: EvidencePair;
  aiSuggestedFix: {
    originalClaim: string;
    suggestedClaim: string;
    rationale: string;
  };
  /** ID-ul regulii din biblioteca Colegului 4 (ex. ENV-GENERIC) sau tehnic (UX-LINK, WCAG-1.4.3). */
  ruleId?: string;
}

export interface Scan {
  id: string;
  adUrl: string;
  landingUrl: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  score: number; // 0 - 100 (100 = complet conform, 0 = vulnerabilități critice)
  createdAt: string;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  // Câmpuri opționale, completate doar pentru scanările reale (scanner + store)
  /** Numele campaniei / produsului. */
  campaign?: string;
  /** Captura landing page-ului pe care sunt desenate chenarele. */
  pageCapture?: string;
  /** Imaginea reclamei încărcată de utilizator. */
  adImage?: string;
  /** Documentele PDF de dovezi încărcate. */
  documents?: string[];
  /** Verificări care nu au putut rula (scanarea se termină oricum). */
  warnings?: string[];
  /** Motivul când status = failed. */
  error?: string;
  /** Pasul curent al scanării (0–4) cât timp rulează. */
  step?: number;
  /** true = date demonstrative din mock/, false = scanare reală. */
  isDemo?: boolean;
}
