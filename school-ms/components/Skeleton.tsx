"use client";

import React from "react";

/* --------------------------------------------------------------------------
   Skeleton frames — used instead of a spinner while a screen loads.
   The shimmer is pure CSS (see .sk in globals.css) so it costs nothing.
   -------------------------------------------------------------------------- */

export function Sk({ w, h = 12, r = 8, style }: { w?: number | string; h?: number | string; r?: number; style?: React.CSSProperties }) {
  return <span className="sk" style={{ width: w ?? "100%", height: h, borderRadius: r, ...style }} />;
}

export function SkText({ lines = 3, w = ["100%", "94%", "62%"] }: { lines?: number; w?: string[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Sk key={i} w={w[i % w.length]} h={10} />
      ))}
    </div>
  );
}

/** Headline numbers: matches the 2-up phone grid and 4-up desktop grid. */
export function SkStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid g-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card kpi">
          <div className="kpi-top">
            <span className="sk" style={{ width: 34, height: 34, borderRadius: 11, flex: "none" }} />
            <Sk w="60%" h={10} />
          </div>
          <div style={{ marginTop: 14 }}>
            <Sk w="55%" h={24} r={8} />
          </div>
          <div style={{ marginTop: 10 }}>
            <Sk w="40%" h={9} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A block of table rows. */
export function SkRows({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 4px", borderBottom: "1px solid #f7efe4" }}
        >
          {avatar && <span className="sk" style={{ width: 32, height: 32, borderRadius: 999, flex: "none" }} />}
          <div style={{ flex: 1, display: "grid", gap: 7 }}>
            <Sk w={`${58 + ((i * 13) % 30)}%`} h={11} />
            <Sk w={`${32 + ((i * 9) % 22)}%`} h={9} />
          </div>
          <Sk w={54} h={18} r={999} />
        </div>
      ))}
    </div>
  );
}

/** Generic card with a title and a few lines. */
export function SkCard({ lines = 3, height }: { lines?: number; height?: number }) {
  return (
    <div className="card card-pad">
      <Sk w="42%" h={14} />
      <div style={{ marginTop: 6 }}>
        <Sk w="62%" h={9} />
      </div>
      <div style={{ marginTop: 16 }}>
        <SkText lines={lines} />
      </div>
      {height ? <div style={{ height }} /> : null}
    </div>
  );
}

/** Whole dashboard-shaped page. */
export function SkDashboard() {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <Sk w={120} h={9} />
        <div style={{ marginTop: 10 }}>
          <Sk w="52%" h={26} r={10} />
        </div>
        <div style={{ marginTop: 8 }}>
          <Sk w="34%" h={10} />
        </div>
      </div>
      <SkStats />
      <div style={{ height: 16 }} />
      <SkCard lines={2} />
      <div style={{ height: 16 }} />
      <div className="grid g-2">
        <SkCard lines={4} />
        <SkCard lines={4} />
      </div>
    </div>
  );
}

/** Table-shaped page (students, fees, exams…). */
export function SkTablePage({ cards = 4 }: { cards?: number }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <Sk w="38%" h={24} r={10} />
        <div style={{ marginTop: 9 }}>
          <Sk w="26%" h={10} />
        </div>
      </div>
      <SkStats count={cards} />
      <div style={{ height: 16 }} />
      <div className="card card-pad">
        <SkRows rows={7} />
      </div>
    </div>
  );
}
