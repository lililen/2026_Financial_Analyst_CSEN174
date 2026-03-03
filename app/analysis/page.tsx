"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Totals = {
  rent: number; // cents
  groceries: number;
  food: number;
  shopping: number;
  entertainment: number;
  other: number;
};

type ScoreResult = {
  score: number;
  riskLevel: string;
  totalSpent: number;
  percentByCategory: Record<string, number>;
  benchmark: Record<string, number>;
  comparisons: {
    category: string;
    userPercent: number;
    benchmarkPercent: number;
    delta: number;
    absDelta: number;
  }[];
};

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

const TEXT_COLOR = "#1a3d1e";
const CATEGORY_COLORS = {
  rent: "#0f2f18",
  groceries: "#1a3d1e",
  food: "#2d5a32",
  shopping: "#3d7a42",
  entertainment: "#5a9e5e",
  other: "#7fbf86",
};

export default function AnalysisPage() {
  const router = useRouter();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const rawTotals = sessionStorage.getItem("categoryTotals");
    if (rawTotals) setTotals(JSON.parse(rawTotals));

    const rawScore = sessionStorage.getItem("financialScoreResult");
    if (rawScore) setScoreResult(JSON.parse(rawScore));

    setLoaded(true);
  }, []);

  const sumDollars = useMemo(() => {
    if (!totals) return 0;
    return (
      (totals.rent +
        totals.groceries +
        totals.food +
        totals.shopping +
        totals.entertainment +
        totals.other) / 100
    );
  }, [totals]);

  const chartData: ChartData<"pie"> | null = useMemo(() => {
    if (!totals) return null;

    const allZero =
      totals.rent === 0 &&
      totals.groceries === 0 &&
      totals.food === 0 &&
      totals.shopping === 0 &&
      totals.entertainment === 0 &&
      totals.other === 0;

    if (allZero) {
      return {
        labels: ["No spending found"],
        datasets: [{ data: [1], backgroundColor: ["#a8c9ab"] }],
      };
    }

    return {
      labels: ["Rent", "Groceries", "Food", "Shopping", "Entertainment", "Other"],
      datasets: [
        {
          data: [
            totals.rent / 100,
            totals.groceries / 100,
            totals.food / 100,
            totals.shopping / 100,
            totals.entertainment / 100,
            totals.other / 100,
          ],
          backgroundColor: [
            CATEGORY_COLORS.rent,
            CATEGORY_COLORS.groceries,
            CATEGORY_COLORS.food,
            CATEGORY_COLORS.shopping,
            CATEGORY_COLORS.entertainment,
            CATEGORY_COLORS.other,
          ],
        },
      ],
    };
  }, [totals]);

  const mainStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#d4e9d7",
    padding: 40,
    color: TEXT_COLOR,
  };

  const buttonStyle: React.CSSProperties = {
    padding: "12px 20px",
    fontSize: 16,
    background: TEXT_COLOR,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  };

  const cardStyle: React.CSSProperties = {
    background: "#eef7ef",
    border: "1px solid rgba(26,61,30,0.15)",
    borderRadius: 12,
    padding: 18,
  };

  if (!loaded) {
    return (
      <main style={mainStyle}>
        <h1 style={{ color: TEXT_COLOR }}>Analysis</h1>
        <p style={{ color: TEXT_COLOR }}>Loading...</p>
      </main>
    );
  }

  if (!totals || !scoreResult) {
    return (
      <main style={mainStyle}>
        <h1 style={{ color: TEXT_COLOR }}>Analysis</h1>
        <p style={{ color: TEXT_COLOR }}>No analysis data found. Upload a PDF first.</p>
        <button style={buttonStyle} onClick={() => router.push("/dashboard")}>
          Go back
        </button>
      </main>
    );
  }

  return (
    <main style={{ ...mainStyle, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: TEXT_COLOR, marginBottom: 18 }}>
        Analysis
      </h1>

      <h2 style={{ marginTop: 0 }}>Spending by Category</h2>

      <div style={{ marginBottom: 18 }}>
        <p style={{ margin: 0, fontSize: "0.95rem", opacity: 0.9 }}>
          Total spending this month
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "2.5rem", fontWeight: 800 }}>
          ${sumDollars.toFixed(2)}
        </p>
      </div>

      <div style={{ marginTop: 8, lineHeight: 2 }}>
        <div><span style={{ color: CATEGORY_COLORS.rent }}>●</span> <strong>Rent:</strong> ${centsToDollars(totals.rent)}</div>
        <div><span style={{ color: CATEGORY_COLORS.groceries }}>●</span> <strong>Groceries:</strong> ${centsToDollars(totals.groceries)}</div>
        <div><span style={{ color: CATEGORY_COLORS.food }}>●</span> <strong>Food:</strong> ${centsToDollars(totals.food)}</div>
        <div><span style={{ color: CATEGORY_COLORS.shopping }}>●</span> <strong>Shopping:</strong> ${centsToDollars(totals.shopping)}</div>
        <div><span style={{ color: CATEGORY_COLORS.entertainment }}>●</span> <strong>Entertainment:</strong> ${centsToDollars(totals.entertainment)}</div>
        <div><span style={{ color: CATEGORY_COLORS.other }}>●</span> <strong>Other:</strong> ${centsToDollars(totals.other)}</div>
      </div>

      <div style={{ marginTop: 22, maxWidth: 520 }}>
        <Pie
          data={chartData!}
          options={{
            plugins: {
              legend: { labels: { color: TEXT_COLOR } },
              tooltip: { titleColor: TEXT_COLOR, bodyColor: TEXT_COLOR },
            },
          }}
        />
      </div>

      <hr style={{ margin: "34px 0", borderColor: "rgba(26,61,30,0.2)" }} />

      <h2 style={{ marginBottom: 10 }}>Financial Score</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 44, fontWeight: 900 }}>{scoreResult.score}</div>
          <div style={{ marginTop: 6 }}>
            <strong>Risk Level:</strong> {scoreResult.riskLevel}
          </div>
          <div style={{ marginTop: 6 }}>
            <strong>Total Spent (from transactions):</strong> ${scoreResult.totalSpent.toFixed(2)}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Your category percentages</div>
          <div style={{ lineHeight: 1.9 }}>
            <div><strong>Rent:</strong> {((scoreResult.percentByCategory.rent ?? 0) * 100).toFixed(1)}%</div>
            <div><strong>Groceries:</strong> {((scoreResult.percentByCategory.groceries ?? 0) * 100).toFixed(1)}%</div>
            <div><strong>Food:</strong> {((scoreResult.percentByCategory.food ?? 0) * 100).toFixed(1)}%</div>
            <div><strong>Shopping:</strong> {((scoreResult.percentByCategory.shopping ?? 0) * 100).toFixed(1)}%</div>
            <div><strong>Entertainment:</strong> {((scoreResult.percentByCategory.entertainment ?? 0) * 100).toFixed(1)}%</div>
            <div><strong>Other:</strong> {((scoreResult.percentByCategory.other ?? 0) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, ...cardStyle }}>
        <h3 style={{ marginTop: 0 }}>Benchmark Comparison</h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid rgba(26,61,30,0.2)", padding: 8 }}>Category</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid rgba(26,61,30,0.2)", padding: 8 }}>You</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid rgba(26,61,30,0.2)", padding: 8 }}>Benchmark</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid rgba(26,61,30,0.2)", padding: 8 }}>Diff</th>
            </tr>
          </thead>
          <tbody>
            {scoreResult.comparisons.map((c) => (
              <tr key={c.category}>
                <td style={{ padding: 8, borderBottom: "1px solid rgba(26,61,30,0.08)" }}>{c.category}</td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(26,61,30,0.08)" }}>
                  {(c.userPercent * 100).toFixed(1)}%
                </td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(26,61,30,0.08)" }}>
                  {(c.benchmarkPercent * 100).toFixed(1)}%
                </td>
                <td style={{ padding: 8, textAlign: "right", borderBottom: "1px solid rgba(26,61,30,0.08)" }}>
                  {(c.delta * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 28 }}>
        <button style={buttonStyle} onClick={() => router.push("/dashboard")}>
          Analyze another PDF
        </button>
      </div>
    </main>
  );
}