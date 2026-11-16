"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconPlus, IconSparkle, IconX } from "@/components/Icons";
import { SectionCard } from "@/components/ui";
import { GRADE_PRESETS, bandRange, gradeBadge, normaliseBands } from "@/lib/grading";
import { useApp } from "@/lib/store";
import type { GradeBand, GradeTone } from "@/lib/types";

const TONES: { value: GradeTone; label: string }[] = [
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
  { value: "amber", label: "Amber" },
  { value: "red", label: "Red" },
];

const TONE_DOT: Record<GradeTone, string> = {
  green: "#16a34a",
  blue: "#2563eb",
  amber: "#d97706",
  red: "#dc2626",
};

/** Editable grading scale — used by score entry, report cards and rankings. */
export default function GradeScaleEditor() {
  const { state, setGrading, toast } = useApp();
  const [draft, setDraft] = useState<GradeBand[]>(state.grading);

  useEffect(() => {
    setDraft(state.grading);
  }, [state.grading]);

  const sorted = useMemo(() => normaliseBands(draft), [draft]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(state.grading);
  const coversZero = draft.some((b) => Number(b.min) === 0);
  const duplicateMins = new Set(draft.map((b) => Number(b.min))).size !== draft.length;

  const patch = (id: string, next: Partial<GradeBand>) =>
    setDraft((d) => d.map((b) => (b.id === id ? { ...b, ...next } : b)));

  return (
    <SectionCard
      title="Grading scale"
      sub="Score bands used by score entry, rankings and report cards"
      right={
        dirty ? (
          <span className="badge badge-amber">Unsaved changes</span>
        ) : (
          <span className="badge badge-grey">{draft.length} bands</span>
        )
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.35fr) minmax(240px, 1fr)", gap: 26, alignItems: "start" }} className="grade-scale-cols">
        {/* ---------------- editor ---------------- */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="eyebrow gs-head">
              <span>Grade</span>
              <span>From</span>
              <span>Remark</span>
              <span>Colour</span>
              <span />
            </div>
            {draft.map((b) => (
              <div key={b.id} className="gs-row">
                <input
                  value={b.label}
                  maxLength={6}
                  onChange={(e) => patch(b.id, { label: e.target.value })}
                  style={{ padding: "6px 8px", fontWeight: 900, textAlign: "center" }}
                  className="input gs-label"
                  aria-label="Grade label"
                />
                <input
                  className="input mono gs-min"
                  type="number"
                  min={0}
                  max={100}
                  value={String(b.min)}
                  onChange={(e) => patch(b.id, { min: Number(e.target.value) })}
                  style={{ padding: "6px 8px" }}
                  aria-label={`Lowest score for grade ${b.label}`}
                />
                <input
                  className="input gs-remark"
                  value={b.remark}
                  onChange={(e) => patch(b.id, { remark: e.target.value })}
                  placeholder="Remark"
                  style={{ padding: "6px 8px" }}
                  aria-label="Remark"
                />
                <select
                  className="select gs-tone"
                  value={b.tone}
                  onChange={(e) => patch(b.id, { tone: e.target.value as GradeTone })}
                  style={{ padding: "6px 22px 6px 8px", fontSize: 12 }}
                  aria-label="Colour"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-ghost btn-sm gs-del"
                  style={{ color: "var(--red)", borderColor: "#f7d4d1", padding: 0, height: 30, width: 30 }}
                  onClick={() => setDraft((d) => d.filter((x) => x.id !== b.id))}
                  disabled={draft.length <= 1}
                  aria-label={`Remove grade ${b.label}`}
                >
                  <IconX size={13} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setDraft((d) => [
                  ...d,
                  { id: `g-new-${Date.now()}`, label: "", min: 0, remark: "", tone: "amber" },
                ])
              }
            >
              <IconPlus size={14} /> Add band
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setGrading(draft);
                toast("Grading scale saved");
              }}
              disabled={!dirty}
            >
              <IconCheck size={14} /> Save scale
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setDraft(state.grading)} disabled={!dirty}>
              Reset
            </button>
          </div>

          {duplicateMins && (
            <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, color: "var(--red)" }}>
              Two bands share the same cut-off — the lower one is ignored when saving.
            </div>
          )}
          {!coversZero && (
            <div style={{ marginTop: 10, fontSize: 11.5, fontWeight: 700, color: "var(--orange-dk)" }}>
              No band starts at 0 — scores below {Math.min(...draft.map((b) => Number(b.min) || 0))} will take your
              lowest grade. Add a band at 0 to be explicit.
            </div>
          )}
        </div>

        {/* ---------------- preview + presets ---------------- */}
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Preview</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
            {sorted.map((b, i) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span className={`badge ${gradeBadge(b.tone)}`} style={{ minWidth: 28, justifyContent: "center" }}>
                  {b.label || "—"}
                </span>
                <span className="mono" style={{ color: "var(--muted)" }}>{bandRange(sorted, i)}</span>
                <span style={{ marginLeft: "auto", color: "var(--muted)" }}>{b.remark || "—"}</span>
              </div>
            ))}
          </div>

          <div className="divider" />
          <div className="eyebrow" style={{ marginBottom: 8 }}>Start from a preset</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {GRADE_PRESETS.map((p) => (
              <button
                key={p.id}
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setDraft(p.bands.map((b) => ({ ...b })));
                  toast(`${p.name} loaded — save to apply`, "info");
                }}
              >
                <IconSparkle size={13} /> {p.name}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700, marginTop: 10, lineHeight: 1.5 }}>
            Only the <b>order</b> of bands drives the aggregate — the top band counts as 1, the next as 2, and so on.
            Rankings and report cards use the mean score, so label them however your school grades.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>
            {(Object.keys(TONE_DOT) as GradeTone[]).map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 8 }}>
                <i style={{ width: 8, height: 8, borderRadius: 3, background: TONE_DOT[t], display: "inline-block" }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
