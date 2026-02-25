// components/ScoreCard.tsx
import React from "react";
import type { RiskLevel } from "@/lib/scoring/scoreTypes";

type Props = {
  score: number;
  riskLevel: RiskLevel;
  totalSpent: number;
};

export default function ScoreCard({ score, riskLevel, totalSpent }: Props) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 16, borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Financial Health Score</h2>

      <div style={{ fontSize: 40, fontWeight: 700 }}>{score}</div>
      <div style={{ marginTop: 4 }}>
        <strong>Status:</strong> {riskLevel}
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Total Spent:</strong> ${totalSpent.toFixed(2)}
      </div>
    </div>
  );
}