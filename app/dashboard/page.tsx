"use client";

import { useState } from "react";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
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
    </main>
  );
}