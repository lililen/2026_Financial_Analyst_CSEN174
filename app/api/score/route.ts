// app/api/score/route.ts
import { NextResponse } from "next/server";
import { DEFAULT_BENCHMARK } from "@/lib/benchmarks/benchmarkProfile";
import { calculateFinancialScore } from "@/lib/scoring/scoreCalculator";
import type { Transaction } from "@/lib/scoring/scoreTypes";
import { getTransactionsForUser } from "@/lib/data/mockTransactions";

/**
 * GET /api/score?userId=...
 *
 * Prototype:
 * - reads userId from query param
 * - loads transactions from mock data (replace with DB later)
 * - calculates score using Steps 1-4 logic
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "demo-user";

  try {
    const txns: Transaction[] = getTransactionsForUser(userId);

    const result = calculateFinancialScore(txns, DEFAULT_BENCHMARK, {
      penaltyFactor: 200, // tweak if you want score harsher/softer
      minScore: 0,
      maxScore: 100,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Error generating score:", err);
    return NextResponse.json(
      { error: "Failed to generate score" },
      { status: 500 }
    );
  }
}