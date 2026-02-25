// components/CategoryBreakdown.tsx
import React from "react";

type Props = {
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

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function CategoryBreakdown({
  percentByCategory,
  benchmark,
  comparisons,
}: Props) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Category Breakdown vs Benchmark</h3>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #eee", padding: 8 }}>Category</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: 8 }}>You</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: 8 }}>Benchmark</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: 8 }}>Diff</th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((c) => (
            <tr key={c.category}>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{c.category}</td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3", textAlign: "right" }}>
                {pct(percentByCategory[c.category] ?? 0)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3", textAlign: "right" }}>
                {pct(benchmark[c.category] ?? 0)}
              </td>
              <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3", textAlign: "right" }}>
                {pct(c.delta)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ marginTop: 12, color: "#666" }}>
        Rows are sorted by largest deviation first (most impactful categories show at top).
      </p>
    </div>
  );
}