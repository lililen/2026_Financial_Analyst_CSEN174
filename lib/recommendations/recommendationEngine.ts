import type { CategoryComparison, RiskLevel, ScoreResult } from "@/lib/scoring/scoreTypes";

export type RecommendationKind = "IMPROVEMENT" | "INFO" | "DATA_NEEDED";

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  message: string;
  /**
   * Higher number = higher priority. Used for sorting.
   */
  priority: number;
  /**
   * Optional category this recommendation is about (e.g. "Shopping").
   */
  category?: string;
}

const OVERSHOOT_DELTA_THRESHOLD = 0.05; // 5 percentage points above benchmark
const MIN_USER_SHARE_FOR_TARGETED = 0.15; // only flag categories that are a meaningful share of budget

function isLowScore(riskLevel: RiskLevel): boolean {
  return riskLevel === "POOR" || riskLevel === "FAIR";
}

function isHighScore(riskLevel: RiskLevel): boolean {
  return riskLevel === "GOOD" || riskLevel === "EXCELLENT";
}

function buildNeedMoreDataRecommendation(result: ScoreResult): Recommendation[] {
  return [
    {
      id: "need-more-data",
      kind: "DATA_NEEDED",
      message:
        "We need more spending data before we can give reliable recommendations. Try uploading a recent bank statement.",
      priority: 100,
    },
  ];
}

function buildGlobalRecommendations(result: ScoreResult): Recommendation[] {
  const recs: Recommendation[] = [];

  if (isLowScore(result.riskLevel)) {
    recs.push({
      id: "overall-improvement",
      kind: "IMPROVEMENT",
      message:
        "Your overall financial health score is low. Focus on reducing discretionary spending and increasing savings where possible.",
      priority: 90,
    });
  } else if (isHighScore(result.riskLevel)) {
    recs.push({
      id: "overall-good",
      kind: "INFO",
      message:
        "Your financial health score looks solid. Continue your current spending habits and review them monthly to stay on track.",
      priority: 70,
    });
  }

  return recs;
}

function buildCategoryMessage(category: string): string {
  const key = category.toLowerCase();

  if (key.includes("shopping") || key.includes("personal")) {
    return "Spending on shopping and personal items is above your benchmark. Set a monthly limit and track these purchases more closely.";
  }
  if (key.includes("food") || key.includes("dining") || key.includes("grocer") || key.includes("restaurant")) {
    return "Food-related spending is above your benchmark. Plan meals ahead and reduce takeout or restaurant visits to save more.";
  }
  if (key.includes("entertainment")) {
    return "Entertainment spending is high relative to your benchmark. Consider lower-cost activities and cap what you spend each month.";
  }
  if (key.includes("rent") || key.includes("housing")) {
    return "Housing costs are higher than your benchmark. Review options like renegotiating your lease or reducing utility usage where possible.";
  }
  if (key.includes("transport")) {
    return "Transport spending is above typical levels. Look for opportunities to carpool, use public transit, or combine trips.";
  }

  return `Spending in ${category} is above your benchmark. Look for specific ways to reduce costs in this area.`;
}

function buildTargetedRecommendations(comparisons: CategoryComparison[]): Recommendation[] {
  const targeted: Recommendation[] = [];

  for (const cmp of comparisons) {
    if (cmp.delta <= 0) continue;
    if (cmp.delta < OVERSHOOT_DELTA_THRESHOLD) continue;
    if (cmp.userPercent < MIN_USER_SHARE_FOR_TARGETED) continue;

    const priorityFromDelta = Math.round(cmp.absDelta * 100); // e.g. 0.20 → 20

    targeted.push({
      id: `overspend-${cmp.category.toLowerCase().replace(/\s+/g, "-")}`,
      kind: "IMPROVEMENT",
      message: buildCategoryMessage(cmp.category),
      priority: 80 + priorityFromDelta,
      category: cmp.category,
    });
  }

  return targeted;
}

/**
 * Builds a sorted, limited list of recommendations for a given score result.
 *
 * Rules:
 * - Low score → improvement recommendations.
 * - High score → standard/encouraging recommendation.
 * - Specific overspending categories → targeted recommendations.
 * - NEED_MORE_DATA or empty/insufficient data → single "need more data" recommendation.
 * - Recommendations are sorted by priority (descending) and limited by `limit`.
 */
export function buildRecommendations(result: ScoreResult, limit = 3): Recommendation[] {
  if (result.riskLevel === "NEED_MORE_DATA" || result.totalSpent <= 0) {
    return buildNeedMoreDataRecommendation(result);
  }

  const all: Recommendation[] = [];

  all.push(...buildGlobalRecommendations(result));

  const targeted = buildTargetedRecommendations(result.comparisons);
  all.push(...targeted);

  if (all.length === 0) {
    return [
      {
        id: "generic-no-issues",
        kind: "INFO",
        message: "Your spending is close to the benchmarks. Keep monitoring it regularly to maintain good financial health.",
        priority: 50,
      },
    ];
  }

  const sorted = [...all].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  const limited = sorted.slice(0, Math.max(1, limit));

  return limited;
}

