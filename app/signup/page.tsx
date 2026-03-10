 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUsers, saveUsers, setCurrentUser } from "../../lib/auth";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const users = getUsers();
    const existing = users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      setError("An account with this email already exists. Please log in instead.");
      return;
    }

    const updated = [...users, { email: email.trim(), password }];
    saveUsers(updated);
    setCurrentUser(email.trim());
    router.push("/dashboard");
  }

  const containerStyle = {
    minHeight: "100vh",
    backgroundColor: "#d4e9d7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  } as const;

  const cardStyle = {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f4fbf5",
    borderRadius: 12,
    padding: 32,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    color: "#1a3d1e",
  } as const;

  const labelStyle = {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 500,
  } as const;

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #a0c6a3",
    fontSize: 14,
    marginBottom: 14,
  } as const;

  const primaryButtonStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 999,
    border: "none",
    backgroundColor: "#1a3d1e",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 4,
  } as const;

  const secondaryButtonStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid #1a3d1e",
    backgroundColor: "transparent",
    color: "#1a3d1e",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    marginTop: 10,
  } as const;

  return (
    <main style={containerStyle}>
      <section style={cardStyle}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>Create an account</h1>
        <p style={{ fontSize: 14, marginBottom: 20 }}>
          Sign up to start uploading bank statements and exploring your financial health.
        </p>

        {error && (
          <p style={{ color: "crimson", marginBottom: 12, fontSize: 13 }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSignupSubmit}>
          <label style={labelStyle} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
          />

          <label style={labelStyle} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            placeholder="Create a password"
          />

          <label style={labelStyle} htmlFor="confirm-password">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            placeholder="Re-enter your password"
          />

          <button type="submit" style={primaryButtonStyle}>
            Create account
          </button>
        </form>

        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={() => router.push("/login")}
        >
          Already have an account? Log in
        </button>
      </section>
    </main>
  );
}

