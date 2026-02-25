"use client";

import { useState } from "react";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
  }

  async function handleAnalyze() {
    if (!file) return;

    setAnalyzing(true);
    setResult(null);

    await new Promise((res) => setTimeout(res, 1500));

    setAnalyzing(false);
    setResult("PDF analyzed successfully (demo result)");
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Upload a PDF</h1>

      <input type="file" accept="application/pdf" onChange={handleFile} />

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
        <iframe
          src={previewUrl}
          width="100%"
          height="600px"
          style={{ marginTop: 20 }}
        />
      )}

      {/* ANALYZE BUTTON */}
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
              cursor: "pointer",
            }}
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      )}

      {/* RESULT */}
      {result && (
        <div style={{ marginTop: 20 }}>
          <strong>Result:</strong> {result}
        </div>
      )}
    </main>
  );
}