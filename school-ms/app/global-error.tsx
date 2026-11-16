"use client";

import { useEffect } from "react";

const KEY = "school-ms-state-v1";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fffbf6",
          color: "#14161a",
          fontFamily: 'Nunito, ui-rounded, "SF Pro Rounded", system-ui, sans-serif',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 520, width: "100%" }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: "#fff1e6",
              color: "#ea580c",
              display: "grid",
              placeItems: "center",
              fontSize: 22,
              marginBottom: 18,
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 24, letterSpacing: "-0.03em", margin: 0, fontWeight: 900 }}>Something went wrong</h1>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "#6f6a63", lineHeight: 1.6, marginTop: 10 }}>
            The page hit an unexpected error — usually leftover data from an older version of this app. Reload first;
            if it keeps happening, reset this browser&apos;s saved data (your school records are only in this browser, so
            export anything you need from School setup later).
          </p>
          <pre
            style={{
              background: "#fdf5ec",
              border: "1px solid #f1e6d8",
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 11.5,
              overflowX: "auto",
              marginTop: 14,
            }}
          >
            {error.message}
          </pre>
          <div style={{ display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 800,
                color: "#fff",
                background: "#f97316",
                cursor: "pointer",
              }}
            >
              Reload the app
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem(KEY);
                } catch {}
                window.location.href = "/setup";
              }}
              style={{
                borderRadius: 999,
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: 800,
                background: "#fff",
                color: "#14161a",
                border: "1px solid #e8dccd",
                cursor: "pointer",
              }}
            >
              Reset saved data
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
