"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { DEFAULT_BENCHMARK } from "@/lib/benchmarks/benchmarkProfile";
import { calculateFinancialScore } from "@/lib/scoring/scoreCalculator";
import type { Transaction } from "@/lib/scoring/scoreTypes";

type Totals = {
  rent: number; // cents
  groceries: number;
  food: number;
  shopping: number;
  entertainment: number;
  other: number;
};

function moneyToCents(amountStr: string) {
  const normalized = amountStr.replace(/,/g, "");
  const n = Number(normalized);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Enforces ONLY 6 categories:
 * rent, groceries, food, shopping, entertainment, other
 *
 * Notes:
 * - groceries is for grocery stores / supermarket type items
 * - food is for restaurants/dining/coffee/fast food
 * - rent includes "rent", "lease", "apartment", "mortgage"
 */
function categorizeLine(line: string): { category: keyof Totals; cents: number } | null {
  const lower = line.toLowerCase();

  // extract first money-looking value like 12.34 or 1,234.56 (optionally with $)
  const amtMatch = line.match(
    /\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/
  );
  if (!amtMatch) return null;

  const cents = moneyToCents(amtMatch[1]);

  // Default category
  let category: keyof Totals = "other";

  // Order matters: rent & groceries before general food/shopping keywords.
  if (
    lower.includes("rent") ||
    lower.includes("lease") ||
    lower.includes("apartment") ||
    lower.includes("mortgage")
  ) {
    category = "rent";
  } else if (
    lower.includes("grocery") ||
    lower.includes("groceries") ||
    lower.includes("supermarket") ||
    lower.includes("whole foods") ||
    lower.includes("trader joe") ||
    lower.includes("safeway") ||
    lower.includes("kroger") ||
    lower.includes("costco")
  ) {
    category = "groceries";
  } else if (
    lower.includes("restaurant") ||
    lower.includes("dining") ||
    lower.includes("cafe") ||
    lower.includes("coffee") ||
    lower.includes("doordash") ||
    lower.includes("uber eats") ||
    lower.includes("grubhub") ||
    lower.includes("fast food") ||
    lower.includes("food")
  ) {
    category = "food";
  } else if (
    lower.includes("shopping") ||
    lower.includes("amazon") ||
    lower.includes("target") ||
    lower.includes("walmart") ||
    lower.includes("store") ||
    lower.includes("mall")
  ) {
    category = "shopping";
  } else if (
    lower.includes("entertainment") ||
    lower.includes("movie") ||
    lower.includes("cinema") ||
    lower.includes("netflix") ||
    lower.includes("spotify") ||
    lower.includes("hulu") ||
    lower.includes("game") ||
    lower.includes("concert")
  ) {
    category = "entertainment";
  } else if (lower.includes("other")) {
    category = "other";
  }

  return { category, cents };
}

async function extractPdfTextLines(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/build/pdf");

  (pdfjs as any).GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const pdf = await (pdfjs as any).getDocument({ data: buf }).promise;

  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const pageText = (content.items as any[])
      .map((it: any) => (it.str ? String(it.str).trim() : ""))
      .filter(Boolean)
      .join("\n");

    pageText
      .split(/\r?\n/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => lines.push(s));
  }

  return lines;
}

export default function Page() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError(null);
  }

  async function handleAnalyze() {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Analysis timed out (worker/text extraction stuck)")),
          20000
        )
      );

      const lines = await Promise.race([extractPdfTextLines(file), timeout]);

      // Totals for pie chart (in cents)
      const totals: Totals = {
        rent: 0,
        groceries: 0,
        food: 0,
        shopping: 0,
        entertainment: 0,
        other: 0,
      };

      // Transactions for financial score (in dollars)
      const userId = "demo-user";
      const txns: Transaction[] = [];

      for (const line of lines) {
        const parsed = categorizeLine(line);
        if (!parsed) continue;

        totals[parsed.category] += parsed.cents;

        txns.push({
          userId,
          type: "DEBIT",
          category: parsed.category,   // rent/groceries/food/shopping/entertainment/other
          amount: parsed.cents / 100,  // dollars
          description: line.slice(0, 80),
        });
      }

      sessionStorage.setItem("categoryTotals", JSON.stringify(totals));

      const scoreResult = calculateFinancialScore(txns, DEFAULT_BENCHMARK, {
        penaltyFactor: 80,
        minScore: 0,
        maxScore: 100,
      });

      sessionStorage.setItem("financialScoreResult", JSON.stringify(scoreResult));

      router.push("/analysis");
    } catch (e: any) {
      setError(e?.message ?? "Failed to analyze PDF.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#d4e9d7",
        padding: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFile}
        style={{ display: "none" }}
        aria-hidden
      />

      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: 560,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            fontWeight: 700,
            color: "#1a3d1e",
            margin: 0,
            marginBottom: 24,
          }}
        >
          Financial Health Analysis tool
        </h1>

        <button
          type="button"
          onClick={openFilePicker}
          style={{
            padding: "14px 24px",
            fontSize: 16,
            fontWeight: 600,
            background: "#1a3d1e",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Upload PDF
        </button>

        <p
          style={{
            marginTop: 20,
            fontSize: 16,
            color: "#2d5a32",
            lineHeight: 1.5,
          }}
        >
          Upload a bank statement here to view and evaluate your financial health
        </p>
      </section>

      {file && (
        <section
          style={{
            width: "100%",
            maxWidth: 720,
            marginTop: 32,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <p style={{ margin: 0, color: "#1a3d1e" }}>
              <strong>File:</strong> {file.name}
            </p>
            <p style={{ margin: "4px 0 0", color: "#1a3d1e" }}>
              <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>

          {previewUrl && (
            <iframe
              src={previewUrl}
              width="100%"
              height="400px"
              style={{ marginBottom: 20, borderRadius: 8 }}
              title="PDF preview"
            />
          )}

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              padding: "12px 20px",
              fontSize: 16,
              background: "#1a3d1e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: analyzing ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>

          {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
        </section>
      )}
    </main>
  );
}