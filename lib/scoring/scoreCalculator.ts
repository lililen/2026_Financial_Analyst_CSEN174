// lib/scoring/scoreCalculator.ts
import type {
  BenchmarkProfile,
  CategoryComparison,
  RiskLevel,
  ScoreResult,
  Transaction,
} from "./scoreTypes";
import { computeCategoryBreakdown } from "./categoryBreakdown";

/**
 * Helpers
 */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "EXCELLENT";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "FAIR";
  return "POOR";
}

/**
 * Builds a list of comparisons for every benchmark category,
 * plus any extra user categories not in benchmark (treated as benchmark 0).
 */
function buildComparisons(
  userPercents: Record<string, number>,
  benchmark: BenchmarkProfile
): CategoryComparison[] {
  const categories = new Set<string>([
    ...Object.keys(benchmark),
    ...Object.keys(userPercents),
  ]);

  const comparisons: CategoryComparison[] = [];
  for (const category of categories) {
    const userPercent = userPercents[category] ?? 0;
    const benchmarkPercent = benchmark[category] ?? 0;
    const delta = userPercent - benchmarkPercent;
    const absDelta = Math.abs(delta);

    comparisons.push({
      category,
      userPercent,
      benchmarkPercent,
      delta,
      absDelta,
    });
  }

  // Sort by biggest deviation first (useful for UI + later recommendations)
  comparisons.sort((a, b) => b.absDelta - a.absDelta);
  return comparisons;
}

/**
 * Prototype scoring model:
 * - Start at 100
 * - Penalize deviation from benchmark using absolute deltas
 *
 * penaltyPoints = sum(absDelta * penaltyFactor)
 *
 * penaltyFactor is tunable:
 * - If you want deviations to hurt more, increase it.
 * - If you want score to be more forgiving, decrease it.
 *
 * Example: penaltyFactor = 200
 * - A 5% (0.05) deviation costs ~10 points.
 */
export interface ScoreOptions {
  penaltyFactor?: number; // default 200
  minScore?: number; // default 0
  maxScore?: number; // default 100
}

export function calculateFinancialScore(
  transactions: Transaction[],
  benchmark: BenchmarkProfile,
  options: ScoreOptions = {}
): ScoreResult {
  const { penaltyFactor = 200, minScore = 0, maxScore = 100 } = options;

  const breakdown = computeCategoryBreakdown(transactions);

  // If no spending data, we can't compute meaningful percentages
  if (breakdown.totalSpent <= 0) {
    return {
      score: 0,
      riskLevel: "NEED_MORE_DATA",
      totalSpent: 0,
      percentByCategory: {},
      benchmark,
      comparisons: [],
    };
  }

  const comparisons = buildComparisons(breakdown.percentByCategory, benchmark);

  // Compute total penalty from deviations
  const totalAbsDelta = comparisons.reduce((sum, c) => sum + c.absDelta, 0);
  const penaltyPoints = totalAbsDelta * penaltyFactor;

  const rawScore = maxScore - penaltyPoints;
  const score = Math.round(clamp(rawScore, minScore, maxScore));

  return {
    score,
    riskLevel: riskLevelFromScore(score),
    totalSpent: breakdown.totalSpent,
    percentByCategory: breakdown.percentByCategory,
    benchmark,
    comparisons,
  };
}