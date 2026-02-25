// lib/scoring/scoreTypes.ts

export type TxnType = "DEBIT" | "CREDIT";

/**
 * Minimal transaction shape needed to compute score.
 * This can map 1:1 to your DB model later.
 */
export interface Transaction {
  id?: string;
  userId: string;
  date?: string; // ISO string for prototype
  description?: string;
  amount: number; // positive numeric amount
  type: TxnType;
  category: string; // e.g., "Food", "Housing", "Personal"
}

/**
 * Benchmark profile: category -> suggested percentage (0.0 - 1.0)
 */
export type BenchmarkProfile = Record<string, number>;

export type RiskLevel = "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "NEED_MORE_DATA";

/**
 * Category breakdown derived from a user's transactions.
 */
export interface CategoryBreakdown {
  totalSpent: number; // sum of DEBIT amounts
  spentByCategory: Record<string, number>;
  percentByCategory: Record<string, number>; // values 0..1
}

/**
 * Comparison details for one category.
 */
export interface CategoryComparison {
  category: string;
  userPercent: number;
  benchmarkPercent: number;
  delta: number; // userPercent - benchmarkPercent
  absDelta: number; // |delta|
}

/**
 * Final computed score result returned by calculator.
 */
export interface ScoreResult {
  score: number; // 0..100
  riskLevel: RiskLevel;
  totalSpent: number;

  // Useful for UI display
  percentByCategory: Record<string, number>;
  benchmark: BenchmarkProfile;

  // Helpful to explain why score changed
  comparisons: CategoryComparison[];
}