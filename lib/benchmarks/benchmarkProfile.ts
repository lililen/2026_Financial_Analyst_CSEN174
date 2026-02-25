// lib/benchmarks/benchmarkProfile.ts
import type { BenchmarkProfile } from "../scoring/scoreTypes";

/**
 * Prototype benchmark targets.
 * Percentages should sum to 1.0 (100% of spending).
 *
 * Adjust categories to match whatever categories your app uses.
 */
export const DEFAULT_BENCHMARK: BenchmarkProfile = {
  Housing: 0.30,
  Food: 0.15,
  Transport: 0.10,
  Utilities: 0.10,
  Personal: 0.10,
  Savings: 0.10,
  Other: 0.15,
};

/**
 * Optional: validate benchmark sums ~ 1.0
 */
export function benchmarkTotal(profile: BenchmarkProfile): number {
  return Object.values(profile).reduce((a, b) => a + b, 0);
}