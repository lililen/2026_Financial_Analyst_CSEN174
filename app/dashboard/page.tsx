"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Totals = {
  shopping: number; // cents
  entertainment: number;
  food: number;
  others: number;
};

function moneyToCents(amountStr: string) {
  const normalized = amountStr.replace(/,/g, "");
  const n = Number(normalized);
  if (Number.isNaN(n)) return 0;
  return Math.round(n * 100);
}

function categorizeLine(line: string): { category: keyof Totals; cents: number } | null {
  const lower = line.toLowerCase();

  const amtMatch = line.match(
    /\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+(?:\.[0-9]{2}))/
  );
  if (!amtMatch) return null;

  const cents = moneyToCents(amtMatch[1]);

  let category: keyof Totals = "others";
  if (lower.includes("shopping")) category = "shopping";
  else if (lower.includes("entertainment")) category = "entertainment";
  else if (lower.includes("food")) category = "food";
  else if (lower.includes("other")) category = "others";

  return { category, cents };
}

async function extractPdfTextLines(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/build/pdf");


  (pdfjs as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

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
          8000
        )
      );

      const lines = await Promise.race([extractPdfTextLines(file), timeout]);

      const totals: Totals = { shopping: 0, entertainment: 0, food: 0, others: 0 };

      for (const line of lines) {
        const parsed = categorizeLine(line);
        if (!parsed) continue;
        totals[parsed.category] += parsed.cents;
      }

      sessionStorage.setItem("categoryTotals", JSON.stringify(totals));
      router.push("/analysis");
    } catch (e: any) {
      setError(e?.message ?? "Failed to analyze PDF.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <main style={{ padding: 40 }}>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFile}
        style={{ display: "none" }}
        aria-hidden
      />

      <button
        type="button"
        onClick={openFilePicker}
        style={{
          padding: "14px 24px",
          fontSize: 16,
          fontWeight: 600,
          background: "#000",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 16,
        }}
      >
        Upload pdf
      </button>

      {file && (
        <div style={{ marginTop: 20 }}>
          <p>
            <strong>File:</strong> {file.name}
          </p>
          <p>
            <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {previewUrl && (
        <iframe src={previewUrl} width="100%" height="600px" style={{ marginTop: 20 }} />
      )}

      {file && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              padding: "12px 20px",
              fontSize: 16,
              background: "#000",
              color: "#fff",
              borderRadius: 8,
              cursor: analyzing ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      )}

      {error && <p style={{ color: "crimson", marginTop: 12 }}>{error}</p>}
    </main>
  );
}