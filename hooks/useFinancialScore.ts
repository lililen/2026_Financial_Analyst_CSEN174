// hooks/useFinancialScore.ts
"use client";

import { useEffect, useState } from "react";
import type { ScoreResult } from "@/lib/scoring/scoreTypes";

export function useFinancialScore(userId: string) {
  const [data, setData] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchScore() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/score?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const json = (await res.json()) as ScoreResult;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load score");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchScore();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading, error };
}