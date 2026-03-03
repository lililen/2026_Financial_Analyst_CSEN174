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

const TEXT_COLOR = "#1a3d1e";
const CATEGORY_COLORS = {
  shopping: "#1a3d1e",   // dark green
  entertainment: "#2d5a32",
  food: "#3d7a42",
  others: "#5a9e5e",    // lighter green
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
        datasets: [{ data: [1], backgroundColor: ["#a8c9ab"] }],
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

  if (!loaded) {
    return (
      <main style={mainStyle}>
        <h1 style={{ color: TEXT_COLOR }}>Analysis</h1>
        <p style={{ color: TEXT_COLOR }}>Loading...</p>
      </main>
    );
  }

  if (!totals) {
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
    <main style={{ ...mainStyle, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: TEXT_COLOR, marginBottom: 24 }}>
        Spending by Category
      </h1>

      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: "0.95rem", color: TEXT_COLOR, opacity: 0.9 }}>
          Total spending this Month
        </p>
        <p style={{ margin: "4px 0 0", fontSize: "2.5rem", fontWeight: 700, color: TEXT_COLOR }}>
          ${sumDollars.toFixed(2)}
        </p>
      </div>

      <div style={{ marginTop: 8, lineHeight: 2, color: TEXT_COLOR }}>
        <div><span style={{ color: CATEGORY_COLORS.shopping }}>●</span> <strong>Shopping:</strong> ${centsToDollars(totals.shopping)}</div>
        <div><span style={{ color: CATEGORY_COLORS.entertainment }}>●</span> <strong>Entertainment:</strong> ${centsToDollars(totals.entertainment)}</div>
        <div><span style={{ color: CATEGORY_COLORS.food }}>●</span> <strong>Food:</strong> ${centsToDollars(totals.food)}</div>
        <div><span style={{ color: CATEGORY_COLORS.others }}>●</span> <strong>Others:</strong> ${centsToDollars(totals.others)}</div>
      </div>

      <div style={{ marginTop: 32, maxWidth: 400 }}>
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

      <div style={{ marginTop: 32 }}>
        <button style={buttonStyle} onClick={() => router.push("/dashboard")}>
          Analyze another PDF
        </button>
      </div>
    </main>
  );
}