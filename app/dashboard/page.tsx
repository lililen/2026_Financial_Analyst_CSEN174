"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { DEFAULT_BENCHMARK } from "@/lib/benchmarks/benchmarkProfile";
import { calculateFinancialScore } from "@/lib/scoring/scoreCalculator";
import type { Transaction } from "@/lib/scoring/scoreTypes";
import { getCurrentUser, logoutUser } from "../../lib/auth";
import {
  getUserUploads,
  hasUploadForMonth,
  saveUserUpload,
  type UploadRecord,
} from "../../lib/uploads";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
  const currentUser = getCurrentUser();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [statementMonth, setStatementMonth] = useState<number | null>(null);
  const [statementYear, setStatementYear] = useState(() => new Date().getFullYear());
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [overwriteMonthLabel, setOverwriteMonthLabel] = useState("");
  const [showPreviousUploads, setShowPreviousUploads] = useState(false);
  const [previousUploads, setPreviousUploads] = useState<UploadRecord[]>([]);

  useEffect(() => {
    const activeUser = getCurrentUser();
    if (!activeUser) {
      router.replace("/login");
    }
  }, [router]);

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
    setStatementMonth(null);
    setShowMonthModal(true);
  }

  function openPreviousUploads() {
    if (currentUser) {
      setPreviousUploads(getUserUploads(currentUser));
      setShowPreviousUploads(true);
    }
  }

  function handleLogout() {
    logoutUser();
    router.push("/login");
  }

  function viewUpload(record: UploadRecord) {
    sessionStorage.setItem("categoryTotals", JSON.stringify(record.categoryTotals));
    sessionStorage.setItem("financialScoreResult", JSON.stringify(record.financialScoreResult));
    sessionStorage.setItem("viewingMonthLabel", record.monthLabel);
    setShowPreviousUploads(false);
    router.push("/analysis");
  }

  async function handleAnalyze() {
    if (!file || statementMonth === null || !currentUser) return;

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
          category: parsed.category,
          amount: parsed.cents / 100,
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

      const monthLabel = `${MONTH_NAMES[statementMonth - 1]} ${statementYear}`;
      saveUserUpload(
        currentUser,
        {
          month: statementMonth,
          year: statementYear,
          monthLabel,
          categoryTotals: totals,
          financialScoreResult: scoreResult,
        },
        { replaceExisting: true }
      );

      sessionStorage.setItem("viewingMonthLabel", monthLabel);
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
      <div
        style={{
          position: "absolute",
          top: 24,
          right: 24,
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            fontSize: 14,
            fontWeight: 500,
            background: "transparent",
            color: "#1a3d1e",
            border: "1px solid #1a3d1e",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>

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

        <button
          type="button"
          onClick={openPreviousUploads}
          style={{
            marginTop: 24,
            padding: "10px 18px",
            fontSize: 14,
            fontWeight: 500,
            background: "transparent",
            color: "#1a3d1e",
            border: "1px solid #1a3d1e",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          View previous uploads
        </button>
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
            disabled={analyzing || statementMonth === null}
            style={{
              padding: "12px 20px",
              fontSize: 16,
              background: statementMonth === null ? "#9eb59f" : "#1a3d1e",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: analyzing || statementMonth === null ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? "Analyzing..." : statementMonth === null ? "Select month first" : "Analyze"}
          </button>

          {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
        </section>
      )}

      {/* Month/Year modal */}
      {showMonthModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowMonthModal(false)}
        >
          <div
            style={{
              backgroundColor: "#f4fbf5",
              borderRadius: 12,
              padding: 28,
              maxWidth: 360,
              width: "90%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              color: "#1a3d1e",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem" }}>What month does this statement correspond to?</h3>
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Month</label>
                <select
                  value={statementMonth ?? ""}
                  onChange={(e) => setStatementMonth(e.target.value ? Number(e.target.value) : null)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #a0c6a3",
                    fontSize: 14,
                  }}
                >
                  <option value="">Select month</option>
                  {MONTH_NAMES.map((name, i) => (
                    <option key={name} value={i + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Year</label>
                <select
                  value={statementYear}
                  onChange={(e) => setStatementYear(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #a0c6a3",
                    fontSize: 14,
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (statementMonth === null) return;
                const monthLabel = `${MONTH_NAMES[statementMonth - 1]} ${statementYear}`;
                if (currentUser && hasUploadForMonth(currentUser, statementMonth, statementYear)) {
                  setShowOverwriteModal(true);
                  setOverwriteMonthLabel(monthLabel);
                } else {
                  setShowMonthModal(false);
                }
              }}
              disabled={statementMonth === null}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                background: statementMonth === null ? "#9eb59f" : "#1a3d1e",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: statementMonth === null ? "not-allowed" : "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Overwrite confirmation modal */}
      {showOverwriteModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
          }}
          onClick={() => {}}
        >
          <div
            style={{
              backgroundColor: "#f4fbf5",
              borderRadius: 12,
              padding: 28,
              maxWidth: 400,
              width: "90%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              color: "#1a3d1e",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 12px", fontSize: "1.1rem" }}>
              This month has already been analyzed
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5 }}>
              Would you like to overwrite the data for {overwriteMonthLabel} or choose another month?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  setShowOverwriteModal(false);
                  setShowMonthModal(false);
                  setOverwriteMonthLabel("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: 14,
                  background: "#1a3d1e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Overwrite
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOverwriteModal(false);
                  setOverwriteMonthLabel("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: 14,
                  background: "transparent",
                  color: "#1a3d1e",
                  border: "1px solid #1a3d1e",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Choose another month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous uploads modal */}
      {showPreviousUploads && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => setShowPreviousUploads(false)}
        >
          <div
            style={{
              backgroundColor: "#f4fbf5",
              borderRadius: 12,
              padding: 28,
              maxWidth: 420,
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
              color: "#1a3d1e",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 16px" }}>Your previous uploads</h3>
            {previousUploads.length === 0 ? (
              <p style={{ color: "#2d5a32", fontSize: 14 }}>No previous uploads yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {previousUploads.map((rec) => {
                  const total = (
                    rec.categoryTotals.rent +
                    rec.categoryTotals.groceries +
                    rec.categoryTotals.food +
                    rec.categoryTotals.shopping +
                    rec.categoryTotals.entertainment +
                    rec.categoryTotals.other
                  ) / 100;
                  return (
                    <li
                      key={rec.id}
                      onClick={() => viewUpload(rec)}
                      style={{
                        padding: "12px 16px",
                        marginBottom: 8,
                        borderRadius: 8,
                        border: "1px solid #a0c6a3",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{rec.monthLabel}</span>
                      <span style={{ fontSize: 14 }}>${total.toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setShowPreviousUploads(false)}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                fontSize: 14,
                background: "#1a3d1e",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}