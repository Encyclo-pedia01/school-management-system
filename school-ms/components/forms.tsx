"use client";

import React from "react";
import { IconX } from "./Icons";

export function Field({
  label,
  children,
  full,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
  hint?: string;
}) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 10.5, color: "var(--muted-2)", fontWeight: 700 }}>{hint}</span>}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={"input " + (props.className ?? "")} />;
}

export function Select({
  value,
  onChange,
  options,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  style?: React.CSSProperties;
}) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} style={style}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ChipEditor({
  items,
  onAdd,
  onRemove,
  placeholder,
  onEdit,
}: {
  items: { id: string; label: string }[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  placeholder: string;
  onEdit?: (id: string, name: string) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: items.length ? 10 : 0 }}>
        {items.map((it) => (
          <span
            key={it.id}
            className="badge badge-orange"
            style={{ paddingRight: 6, gap: 6, fontSize: 11.5 }}
            title={onEdit ? "Click the × to remove" : undefined}
          >
            {onEdit ? (
              <input
                value={it.label}
                onChange={(e) => onEdit(it.id, e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  font: "inherit",
                  color: "inherit",
                  width: Math.max(70, it.label.length * 7.9 + 6),
                }}
              />
            ) : (
              it.label
            )}
            <button
              onClick={() => onRemove(it.id)}
              style={{ border: "none", background: "rgba(0,0,0,0.08)", borderRadius: 99, width: 16, height: 16, display: "grid", placeItems: "center", color: "inherit", padding: 0 }}
              aria-label={`Remove ${it.label}`}
            >
              <IconX size={9} />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>Nothing here yet.</span>
        )}
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        <input
          className="input"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button className="btn btn-ghost btn-sm" onClick={add} type="button">
          Add
        </button>
      </div>
    </div>
  );
}
