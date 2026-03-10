 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthData, getUsers, saveUsers, setCurrentUser } from "../../lib/auth";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const users = getUsers();
    const user = users.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (!user) {
      setError("Incorrect email or password.");
      return;
    }

    setCurrentUser(user.email);
    router.push("/dashboard");
  }

  function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotMessage(null);
    setError(null);

    const users = getUsers();
    const idx = users.findIndex(
      (u) => u.email.trim().toLowerCase() === forgotEmail.trim().toLowerCase()
    );

    if (idx === -1) {
      setError("No account found for that email.");
      return;
    }

    if (!forgotPassword) {
      setError("Please enter a new password.");
      return;
    }

    const updated = [...users];
    updated[idx] = { ...updated[idx], password: forgotPassword };
    saveUsers(updated);
    setForgotMessage("Password updated. You can now log in with your new password.");
    setForgotPassword("");
  }

  function handleResetAll() {
    clearAuthData();
    setEmail("");
    setPassword("");
    setForgotEmail("");
    setForgotPassword("");
    setError(null);
    setForgotMessage("All login data has been reset. You can create a new account.");
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

  const linkButtonStyle = {
    border: "none",
    background: "none",
    padding: 0,
    marginTop: 10,
    marginBottom: 12,
    color: "#2d5a32",
    fontSize: 13,
    textDecoration: "underline",
    cursor: "pointer",
  } as const;

  const resetButtonStyle = {
    marginTop: 24,
    border: "none",
    background: "none",
    padding: 0,
    color: "#8b1e1e",
    fontSize: 13,
    textDecoration: "underline",
    cursor: "pointer",
  } as const;

  return (
    <main style={containerStyle}>
      <section style={cardStyle}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: 4 }}>Log in</h1>
        <p style={{ fontSize: 14, marginBottom: 20 }}>
          Enter your details to access your Financial Health Analysis dashboard.
        </p>

        {error && (
          <p style={{ color: "crimson", marginBottom: 12, fontSize: 13 }}>
            {error}
          </p>
        )}
        {forgotMessage && (
          <p style={{ color: "#2d5a32", marginBottom: 12, fontSize: 13 }}>
            {forgotMessage}
          </p>
        )}

        <form onSubmit={handleLoginSubmit}>
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
            placeholder="Enter your password"
          />

          <button type="submit" style={primaryButtonStyle}>
            Continue to dashboard
          </button>
        </form>

        <button
          type="button"
          style={secondaryButtonStyle}
          onClick={() => router.push("/signup")}
        >
          Create a new account
        </button>

        <div style={{ marginTop: 10, display: "flex", gap: "1.5em", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            style={{ ...linkButtonStyle, marginTop: 0, marginBottom: 0 }}
            onClick={() => setShowForgot((v) => !v)}
          >
            {showForgot ? "Hide forgot password" : "Forgot password?"}
          </button>
          <button type="button" style={{ ...resetButtonStyle, marginTop: 0 }} onClick={handleResetAll}>
            Reset all login data
          </button>
        </div>

        {showForgot && (
          <form
            onSubmit={handleForgotSubmit}
            style={{ marginTop: 14, borderTop: "1px solid #c5dec7", paddingTop: 14 }}
          >
            <label style={labelStyle} htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              style={inputStyle}
            />

            <label style={labelStyle} htmlFor="forgot-password">
              New password
            </label>
            <input
              id="forgot-password"
              type="password"
              required
              value={forgotPassword}
              onChange={(e) => setForgotPassword(e.target.value)}
              style={inputStyle}
            />

            <button type="submit" style={primaryButtonStyle}>
              Save new password
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

