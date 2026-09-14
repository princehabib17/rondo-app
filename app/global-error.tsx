"use client";

import { useEffect } from "react";

// Replaces the root layout when it throws, so it cannot rely on globals.css,
// fonts, or the theme provider. Everything is inline and mirrors the dark tokens.
const page: React.CSSProperties = {
  margin: 0,
  minHeight: "100dvh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "3rem 1.5rem",
  textAlign: "center",
  background: "oklch(11% 0.008 102)",
  color: "oklch(97% 0 0)",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const button: React.CSSProperties = {
  marginTop: "2rem",
  minHeight: "3rem",
  padding: "0 2rem",
  borderRadius: "999px",
  border: "none",
  background: "oklch(86% 0.115 96)",
  color: "oklch(20% 0.02 96)",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
};

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={page}>
        <title>Rondo — something went wrong</title>
        <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "oklch(58% 0.01 102)" }}>
          Rondo
        </p>
        <h1 style={{ margin: "0.75rem 0 0", fontSize: "1.5rem", lineHeight: 1.15 }}>
          Rondo hit a wall
        </h1>
        <p style={{ margin: "0.75rem 0 0", maxWidth: "24rem", color: "oklch(78% 0.008 102)", lineHeight: 1.5 }}>
          The app could not load. Try again; if it keeps happening, reload the page.
        </p>
        {error.digest ? (
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: "oklch(58% 0.01 102)" }}>
            Reference {error.digest}
          </p>
        ) : null}
        <button type="button" onClick={() => retry()} style={button}>
          Try again
        </button>
      </body>
    </html>
  );
}
