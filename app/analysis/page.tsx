"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

type Totals = {
  shopping: number; // cents
  entertainment: number;
  food: number;
  others: number;
};

function centsToDollars(cents: number) {
  return (cents / 100).toFixed(2);
}

const CATEGORY_COLORS = {
  shopping: "#ef4444",      // red
  entertainment: "#22c55e", // green
  food: "#eab308",          // yellow
  others: "#3b82f6",        // blue
};

export default function AnalysisPage() {
  const router = useRouter();
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("categoryTotals");
    if (raw) setTotals(JSON.parse(raw));
    setLoaded(true);
  }, []);

  const sumDollars = useMemo(() => {
    if (!totals) return 0;
    return (totals.shopping + totals.entertainment + totals.food + totals.others) / 100;
  }, [totals]);

  const chartData: ChartData<"pie"> | null = useMemo(() => {
    if (!totals) return null;

    if (totals.shopping === 0 && totals.entertainment === 0 && totals.food === 0 && totals.others === 0) {
      return {
        labels: ["No spending found"],
        datasets: [{ data: [1], backgroundColor: ["#d1d5db"] }],
      };
    }

    return {
      labels: ["Shopping", "Entertainment", "Food", "Others"],
      datasets: [
        {
          data: [
            totals.shopping / 100,
            totals.entertainment / 100,
            totals.food / 100,
            totals.others / 100,
          ],
          backgroundColor: [
            CATEGORY_COLORS.shopping,
            CATEGORY_COLORS.entertainment,
            CATEGORY_COLORS.food,
            CATEGORY_COLORS.others,
          ],
        },
      ],
    };
  }, [totals]);

  if (!loaded) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Analysis</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (!totals) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Analysis</h1>
        <p>No analysis data found. Upload a PDF first.</p>
        <button onClick={() => router.push("/dashboard")}>Go back</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, maxWidth: 900 }}>
      <h1>Spending by Category</h1>

      <div style={{ marginTop: 8, color: "#555" }}>
        Total: <strong>${sumDollars.toFixed(2)}</strong>
      </div>

      <div style={{ marginTop: 16, lineHeight: 1.8 }}>
        <div><span style={{ color: CATEGORY_COLORS.shopping }}>●</span> <strong>Shopping:</strong> ${centsToDollars(totals.shopping)}</div>
        <div><span style={{ color: CATEGORY_COLORS.entertainment }}>●</span> <strong>Entertainment:</strong> ${centsToDollars(totals.entertainment)}</div>
        <div><span style={{ color: CATEGORY_COLORS.food }}>●</span> <strong>Food:</strong> ${centsToDollars(totals.food)}</div>
        <div><span style={{ color: CATEGORY_COLORS.others }}>●</span> <strong>Others:</strong> ${centsToDollars(totals.others)}</div>
      </div>

      <div style={{ marginTop: 30, maxWidth: 520 }}>
        <Pie data={chartData!} />
      </div>

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push("/dashboard")}>Analyze another PDF</button>
      </div>
    </main>
  );
}