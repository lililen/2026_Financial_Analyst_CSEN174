// lib/data/mockTransactions.ts
import type { Transaction } from "@/lib/scoring/scoreTypes";

/**
 * Prototype dataset:
 * Replace this file later with a DB query.
 */
const MOCK_TRANSACTIONS: Transaction[] = [
  // Demo user spending
  { id: "t1", userId: "demo-user", amount: 1200, type: "DEBIT", category: "Housing", description: "Rent" },
  { id: "t2", userId: "demo-user", amount: 220, type: "DEBIT", category: "Food", description: "Groceries" },
  { id: "t3", userId: "demo-user", amount: 160, type: "DEBIT", category: "Food", description: "Dining" },
  { id: "t4", userId: "demo-user", amount: 120, type: "DEBIT", category: "Utilities", description: "Internet" },
  { id: "t5", userId: "demo-user", amount: 90, type: "DEBIT", category: "Transport", description: "Gas" },
  { id: "t6", userId: "demo-user", amount: 280, type: "DEBIT", category: "Personal", description: "Shopping" },
  { id: "t7", userId: "demo-user", amount: 140, type: "DEBIT", category: "Other", description: "Misc" },
  { id: "t8", userId: "demo-user", amount: 2500, type: "CREDIT", category: "Income", description: "Paycheck" },

  // Another user (to prove filtering works)
  { id: "u2-t1", userId: "user-2", amount: 900, type: "DEBIT", category: "Housing", description: "Rent" },
  { id: "u2-t2", userId: "user-2", amount: 600, type: "DEBIT", category: "Personal", description: "Shopping" },
  { id: "u2-t3", userId: "user-2", amount: 2000, type: "CREDIT", category: "Income", description: "Paycheck" },
];

export function getTransactionsForUser(userId: string): Transaction[] {
  return MOCK_TRANSACTIONS.filter((t) => t.userId === userId);
}