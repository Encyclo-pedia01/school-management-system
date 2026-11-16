"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { avatarColor, initials } from "@/lib/derive";
import { IconX } from "./Icons";

export function Avatar({
  name,
  size = 36,
  square = false,
  color,
}: {
  name: string;
  size?: number;
  square?: boolean;
  color?: string;
}) {
  return (
    <span
      className={"avatar" + (square ? " avatar-sq" : "")}
      style={{
        width: size,
        height: size,
        background: color ?? avatarColor(name),
        fontSize: Math.round(size * 0.38),
      }}
    >
      {initials(name)}
    </span>
  );
}

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`badge ${tone}`}>
      <span className="dot" />
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={"card " + className} style={style}>
      {children}
    </div>
  );
}

export function SectionCard({
  title,
  sub,
  right,
  children,
  bodyPad = true,
}: {
  title: string;
  sub?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  bodyPad?: boolean;
}) {
  return (
    <Card>
      <div className="card-head">
        <div>
          <h3>{title}</h3>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {right && <div className="right">{right}</div>}
      </div>
      <div style={{ padding: bodyPad ? "14px 20px 18px" : "10px 0 0" }}>{children}</div>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  icon,
  tone = "#f97316",
  soft = "#fff1e6",
  trend,
  trendLabel,
  spark,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ReactNode;
  tone?: string;
  soft?: string;
  trend?: "up" | "down";
  trendLabel?: string;
  spark?: number[];
}) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <span className="kpi-ico" style={{ background: soft, color: tone }}>
          {icon}
        </span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">
        {value}
        {suffix && <small>{suffix}</small>}
      </div>
      <div className="kpi-foot">
        {trend && (
          <span className={`trend ${trend}`}>
            {trend === "up" ? "▲" : "▼"} {trendLabel}
          </span>
        )}
        {!trend && <span>{trendLabel}</span>}
      </div>
      {spark && <Sparkline data={spark} color={tone} />}
    </div>
  );
}

export function Sparkline({ data, color = "#f97316", w = 78, h = 34 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * (w - 4) + 2;
    const y = h - 3 - ((v - min) / Math.max(1, max - min)) * (h - 8);
    return `${x},${y}`;
  });
  return (
    <svg className="kpi-spark" width={w} height={h} aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </svg>
  );
}

export function Modal({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
  width = 620,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  sub?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  /* portal to <body>: page wrappers animate with a transform, which would
     otherwise capture position:fixed and push the dialog off-screen */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal fade-in" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3 style={{ fontSize: 18 }}>{title}</h3>
            {sub && <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 3, fontWeight: 600 }}>{sub}</div>}
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "#fff", border: "1px solid var(--line-2)", borderRadius: 999, width: 32, height: 32, display: "grid", placeItems: "center", color: "var(--muted)" }}
            aria-label="Close"
          >
            <IconX size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Progress({ pct, color = "var(--orange)", height = 8 }: { pct: number; color?: string; height?: number }) {
  return (
    <div className="progress" style={{ height }}>
      <span style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
    </div>
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="tabs">
      {tabs.map((t) => (
        <button key={t.id} className={"tab" + (active === t.id ? " on" : "")} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="empty">
      <h4>{title}</h4>
      {sub && <p>{sub}</p>}
    </div>
  );
}

export function Toasts({ toasts }: { toasts: { id: number; title: string; tone: string }[] }) {
  return (
    <div className="toast-stack" style={{ position: "fixed", bottom: 22, right: 22, display: "flex", flexDirection: "column", gap: 9, zIndex: 200 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fade-in"
          style={{
            background: "var(--ink)",
            color: "#fff",
            padding: "11px 16px",
            borderRadius: 14,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "var(--shadow-lg)",
            display: "flex",
            alignItems: "center",
            gap: 9,
            borderLeft: `4px solid ${t.tone === "warn" ? "#f59e0b" : t.tone === "info" ? "#2563eb" : "#22c55e"}`,
          }}
        >
          {t.title}
        </div>
      ))}
    </div>
  );
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
