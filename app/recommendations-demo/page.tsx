"use client";

import { useMemo, useState } from "react";
import type { ScoreResult, CategoryComparison, BenchmarkProfile, RiskLevel } from "@/lib/scoring/scoreTypes";
import { buildRecommendations } from "@/lib/recommendations/recommendationEngine";

type ScenarioKey = "low-score-shopping" | "high-score-balanced" | "need-more-data";

const demoBenchmark: BenchmarkProfile = {
  Shopping: 0.15,
  Food: 0.15,
  Entertainment: 0.10,
  Housing: 0.30,
  Transport: 0.10,
  Other: 0.20,
};

function makeScoreResult(
  riskLevel: RiskLevel,
  totalSpent: number,
  percentByCategory: Record<string, number>,
  comparisons: CategoryComparison[]
): ScoreResult {
  return {
    score: 0,
    riskLevel,
    totalSpent,
    percentByCategory,
    benchmark: demoBenchmark,
    comparisons,
  };
}

function useDemoScenario(key: ScenarioKey): ScoreResult {
  if (key === "need-more-data") {
    return makeScoreResult("NEED_MORE_DATA", 0, {}, []);
  }

  if (key === "high-score-balanced") {
    const percents: Record<string, number> = {
      Housing: 0.30,
      Food: 0.16,
      Shopping: 0.14,
      Entertainment: 0.08,
      Transport: 0.10,
      Other: 0.22,
    };

    const comparisons: CategoryComparison[] = Object.keys(percents).map((cat) => {
      const user = percents[cat] ?? 0;
      const bench = demoBenchmark[cat] ?? 0;
      const delta = user - bench;
      return {
        category: cat,
        userPercent: user,
        benchmarkPercent: bench,
        delta,
        absDelta: Math.abs(delta),
      };
    });

    return makeScoreResult("GOOD", 2500, percents, comparisons);
  }

  // low-score-shopping
  const percents: Record<string, number> = {
    Housing: 0.25,
    Food: 0.12,
    Shopping: 0.30,
    Entertainment: 0.18,
    Transport: 0.08,
    Other: 0.07,
  };

  const comparisons: CategoryComparison[] = Object.keys(percents).map((cat) => {
    const user = percents[cat] ?? 0;
    const bench = demoBenchmark[cat] ?? 0;
    const delta = user - bench;
    return {
      category: cat,
      userPercent: user,
      benchmarkPercent: bench,
      delta,
      absDelta: Math.abs(delta),
    };
  });

  return makeScoreResult("POOR", 2200, percents, comparisons);
}

export default function RecommendationsDemoPage() {
  const [scenario, setScenario] = useState<ScenarioKey>("low-score-shopping");

  const scoreResult = useDemoScenario(scenario);
  const recommendations = useMemo(() => buildRecommendations(scoreResult, 3), [scoreResult]);

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: 32,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <section style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: 8 }}>Recommendation Engine Demo</h1>
        <p style={{ marginBottom: 24, color: "#4b5563" }}>
          This page exists only on the <code>recommendation-engine</code> branch to help you test the recommendation
          logic without touching the main UI.
        </p>

        <label style={{ display: "block", marginBottom: 12, fontWeight: 600 }}>
          Scenario
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as ScenarioKey)}
            style={{
              display: "block",
              marginTop: 8,
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
            }}
          >
            <option value="low-score-shopping">Low score with shopping overspend</option>
            <option value="high-score-balanced">High score, balanced spending</option>
            <option value="need-more-data">Need more data</option>
          </select>
        </label>

        <section
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: 0, marginBottom: 12 }}>Score snapshot</h2>
          <p style={{ margin: 0, color: "#374151" }}>
            <strong>Risk level:</strong> {scoreResult.riskLevel}
          </p>
          <p style={{ margin: "4px 0 0", color: "#374151" }}>
            <strong>Total spent:</strong> ${scoreResult.totalSpent.toFixed(2)}
          </p>
        </section>

        <section
          style={{
            marginTop: 24,
            padding: 16,
            backgroundColor: "#ffffff",
            borderRadius: 8,
            border: "1px solid #e5e7eb",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: 0, marginBottom: 12 }}>Recommendations</h2>
          {recommendations.length === 0 ? (
            <p style={{ margin: 0, color: "#6b7280" }}>No recommendations generated for this scenario.</p>
          ) : (
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              {recommendations.map((rec) => (
                <li key={rec.id} style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 600 }}>{rec.message}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    <span>
                      Kind: {rec.kind} • Priority: {rec.priority}
                    </span>
                    {rec.category && <span> • Category: {rec.category}</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </section>
    </main>
  );
}

