// lib/scoring/categoryBreakdown.ts
import type { CategoryBreakdown, Transaction } from "./scoreTypes";

/**
 * Computes total DEBIT spending and category breakdowns.
 * - Only DEBIT transactions count toward "spent" totals.
 * - Categories are treated as case-sensitive labels (prototype).
 * - If totalSpent is 0, percentByCategory will be {}.
 */
export function computeCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown {
  const spentByCategory: Record<string, number> = {};
  let totalSpent = 0;

  for (const txn of transactions) {
    // Only spending
    if (txn.type !== "DEBIT") continue;

    const amt = txn.amount;

    // Guard against weird/invalid data in prototype
    if (!Number.isFinite(amt) || amt <= 0) continue;

    totalSpent += amt;

    const cat = txn.category?.trim() || "Uncategorized";
    spentByCategory[cat] = (spentByCategory[cat] ?? 0) + amt;
  }

  const percentByCategory: Record<string, number> = {};
  if (totalSpent > 0) {
    for (const [cat, catSpent] of Object.entries(spentByCategory)) {
      percentByCategory[cat] = catSpent / totalSpent;
    }
  }

  return { totalSpent, spentByCategory, percentByCategory };
}