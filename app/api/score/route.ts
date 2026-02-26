import { NextResponse } from "next/server";
import { DEFAULT_BENCHMARK } from "@/lib/benchmarks/benchmarkProfile";
import { calculateFinancialScore } from "@/lib/scoring/scoreCalculator";
import { parseCategoryAmountLines } from "@/lib/data/testFileParser";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") ?? "demo-user";

  // Toggle between mock data vs test file
  // Use: ?source=txt  OR  ?source=mock
  const source = url.searchParams.get("source") ?? "txt";

  try {
    let txns = [];

    if (source === "txt") {
      // Fetch test file from /public
      const testUrl = new URL("/test1.txt", url.origin);
      const res = await fetch(testUrl);

      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to load test1.txt (${res.status})` },
          { status: 500 }
        );
      }

      const text = await res.text();
      txns = parseCategoryAmountLines(text, userId);
    } else {
      // fallback to mock data
      const { getTransactionsForUser } = await import("@/lib/data/mockTransactions");
      txns = getTransactionsForUser(userId);
    }

    const result = calculateFinancialScore(txns, DEFAULT_BENCHMARK, {
      penaltyFactor: 100,
      minScore: 0,
      maxScore: 100,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Error generating score:", err);
    return NextResponse.json({ error: "Failed to generate score" }, { status: 500 });
  }
}