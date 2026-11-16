"use client";

import React from "react";

/* ---------------- area / line trend ---------------- */
export function TrendChart({
  data,
  height = 190,
  color = "#f97316",
  color2,
  formatter = (v: number) => `${v}`,
  showArea = true,
  zeroBased = true,
}: {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  color?: string;
  color2?: string;
  formatter?: (v: number) => string;
  showArea?: boolean;
  /** set false for tightly clustered values (e.g. attendance rates) */
  zeroBased?: boolean;
}) {
  const W = 620;
  const H = height;
  const padL = 62;
  const padR = 22;
  const padT = 16;
  const padB = 24;
  const all = data.flatMap((d) => [d.value, d.value2 ?? d.value]);
  const lo = zeroBased ? 0 : Math.min(...all) * 0.97;
  const hi = Math.max(...all) * 1.06;
  const max = hi;
  const x = (i: number) => padL + (i / Math.max(1, data.length - 1)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - (v - lo) / Math.max(1e-6, max - lo)) * (H - padT - padB);

  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(data.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const path2 = color2
    ? data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.value2 ?? 0).toFixed(1)}`).join(" ")
    : null;
  const ticks = [0, 0.5, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }} role="img">
      {ticks.map((t) => {
        const v = lo + (max - lo) * t;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#f4ebdf" strokeWidth="1" />
            <text x={padL - 7} y={y(v) + 4} textAnchor="end" fontSize="12" fontWeight="700" fill="#b6ada1">
              {formatter(Math.round(v))}
            </text>
          </g>
        );
      })}
      {showArea && (
        <>
          <defs>
            <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.26" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#grad-${color.replace("#", "")})`} />
        </>
      )}
      {path2 && <path d={path2} fill="none" stroke={color2} strokeWidth="2.2" strokeDasharray="5 4" strokeLinecap="round" />}
      <path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r="3.4" fill="#fff" stroke={color} strokeWidth="2.2" />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#948d84">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ---------------- donut ---------------- */
export function Donut({
  segments,
  size = 172,
  thickness = 18,
  center,
  centerLabel,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  thickness?: number;
  center: string;
  centerLabel?: string;
}) {
  const sum = segments.reduce((a, s) => a + s.value, 0);
  const total = sum || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f8f1e7" strokeWidth={thickness} />
        {segments.map((s, i) => {
          if (!sum || s.value <= 0) return null;
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${Math.max(0, len - 3)} ${c}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 25, fontWeight: 900, letterSpacing: "-0.03em" }}>{center}</div>
          {centerLabel && <div style={{ fontSize: 10.5, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{centerLabel}</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- horizontal bars ---------------- */
export function HBars({
  data,
  color = "#2563eb",
  max: maxOverride,
  suffix = "",
}: {
  data: { label: string; value: number; color?: string }[];
  color?: string;
  max?: number;
  suffix?: string;
}) {
  const max = maxOverride ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((d) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0;
        return (
          <div className="bar-row" key={d.label}>
            <div className="bar-label">
              {d.label}
              {d.value <= 0 && <span style={{ color: "var(--muted-2)", fontWeight: 700 }}> · 0{suffix}</span>}
            </div>
            <div className="bar-track">
              {d.value > 0 && (
                <div
                  className="bar-fill"
                  style={{ width: `${Math.max(14, pct)}%`, background: d.color ?? color }}
                >
                  {pct >= 14 ? `${d.value}${suffix}` : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- vertical columns ---------------- */
export function Columns({
  data,
  height = 150,
  color = "#2563eb",
  highlightColor = "#f97316",
  highlightIndex,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  highlightColor?: string;
  highlightIndex?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%" }}>
          <div style={{ fontSize: 10.5, fontWeight: 900, color: i === highlightIndex ? highlightColor : "var(--ink-2)" }}>{d.value}</div>
          <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end" }}>
            <div
              title={`${d.label}: ${d.value}`}
              style={{
                width: "100%",
                height: `${(d.value / max) * 100}%`,
                minHeight: 5,
                borderRadius: 7,
                background: i === highlightIndex ? highlightColor : color,
                opacity: i === highlightIndex ? 1 : 0.82,
              }}
            />
          </div>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "var(--muted-2)", whiteSpace: "nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}
