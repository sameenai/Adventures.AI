"use client";

import { useEffect } from "react";

// global-error replaces the root layout when it catches, so it must
// include its own <html> and <body> tags and cannot use Tailwind classes
// (the stylesheet is loaded by the layout which is bypassed).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#0c0a09",
          color: "#e7e5e4",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          textAlign: "center",
          margin: 0,
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "#dc2626",
            marginBottom: "1rem",
          }}
        >
          Critical Error
        </p>
        <h1
          style={{
            fontSize: "2.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "1.5rem",
            fontWeight: 600,
          }}
        >
          Basecamper is unavailable
        </h1>
        <p
          style={{
            color: "#78716c",
            marginBottom: "2rem",
            maxWidth: "28rem",
            lineHeight: 1.6,
            fontSize: "0.875rem",
          }}
        >
          A critical error occurred. Please refresh the page or contact support if the problem
          persists.
          {error.digest && (
            <span style={{ display: "block", marginTop: "0.5rem", fontSize: "0.75rem" }}>
              Reference: {error.digest}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            border: "1px solid #f59e0b",
            backgroundColor: "#f59e0b",
            padding: "0.75rem 2rem",
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#0c0a09",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try Again
        </button>
      </body>
    </html>
  );
}
