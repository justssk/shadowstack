export type SignalCategory =
  | "framework"
  | "rendering"
  | "infrastructure"
  | "performance"
  | "security"
  | "api";

export type SignalSource = "html" | "headers" | "network" | "performance";

export type SignalValue = string | number | boolean;

export type Signal = {
  id: string;
  category: SignalCategory;
  key: string;
  value: SignalValue;
  confidence?: number;
  source: SignalSource;
  evidence?: string;
  metadata?: Record<string, SignalValue>;
};

export type Inference = {
  id: string;
  category: SignalCategory;
  key: string;
  value: string;
  confidence: number;
  evidence: string[];
};

export type Score = {
  value: number;
  reasons: string[];
};

export type ScanScores = {
  architecture: Score;
  performance: Score;
  security: Score;
  delivery: Score;
  overall: number;
};

export type ScanResult = {
  domain: string;
  scannedAt: string;
  durationMs: number;
  architecture: Signal[];
  inferences: Inference[];
  scores: ScanScores;
  warnings: string[];
};
