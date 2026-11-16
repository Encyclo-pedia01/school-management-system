"use client";

import Link from "next/link";
import { useEffect } from "react";

const KEY = "school-ms-state-v1";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="fade-in" style={{ maxWidth: 560, margin: "40px auto" }}>
      <div className="card card-pad">
        <div
          style={{
            width: 44, height: 44, borderRadius: 14, background: "var(--orange-soft)", color: "var(--orange-dk)",
            display: "grid", placeItems: "center", fontWeight: 900, fontSize: 18, marginBottom: 14,
          }}
        >
          !
        </div>
        <h1 style={{ fontSize: 21 }}>That page hit a snag</h1>
        <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.6, marginTop: 8 }}>
          Nothing was lost — your records are still in this browser. Try the page again, and if it keeps failing go back
          to the dashboard.
        </p>
        <pre
          style={{
            background: "var(--cream-2)", border: "1px solid var(--line)", borderRadius: 12,
            padding: "9px 11px", fontSize: 11.5, overflowX: "auto", marginTop: 12,
          }}
        >
          {error.message}
        </pre>
        <div style={{ display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link href="/dashboard" className="btn btn-ghost">
            Back to dashboard
          </Link>
          <button
            className="btn btn-ghost"
            style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
            onClick={() => {
              try {
                localStorage.removeItem(KEY);
              } catch {}
              window.location.href = "/setup";
            }}
          >
            Reset saved data
          </button>
        </div>
      </div>
    </div>
  );
}
