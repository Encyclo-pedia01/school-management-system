"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconCheckSquare, IconClock, IconX } from "@/components/Icons";
import { Avatar, Badge, Card, Empty, SectionCard, StatCard } from "@/components/ui";
import { attendanceForDate, attendancePct, classById, dayMonth, fullName, shortDate, studentsOf, todayISO } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { AttStatus } from "@/lib/types";

export default function AttendancePage() {
  const { state, persona } = useApp();
  if (persona.role === "parent") return <AttendanceReadOnly />;
  if (!state.classes.length)
    return (
      <div className="fade-in">
        <div className="page-head">
          <div>
            <h1 className="page-title">Attendance register</h1>
            <div className="page-sub">No classes yet</div>
          </div>
        </div>
        <SectionCard title="Create a class first" sub="Registers are taken per class">
          <Link href="/classes" className="btn btn-primary btn-sm">Go to classes</Link>
        </SectionCard>
      </div>
    );
  return <Register />;
}

function Register() {
  const { state, persona, saveAttendance, toast } = useApp();
  const myClasses = state.classes.filter((c) => (persona.role === "teacher" ? persona.classIds.includes(c.id) : true));
  const [classId, setClassId] = useState("");
  const firstClassId = myClasses[0]?.id ?? "";
  // pick a default class once records are hydrated from storage
  useEffect(() => {
    if (!classId && firstClassId) setClassId(firstClassId);
  }, [classId, firstClassId]);
  const [date, setDate] = useState(todayISO());
  const [draft, setDraft] = useState<Record<string, AttStatus>>({});
  const [dirty, setDirty] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const pupils = useMemo(() => studentsOf(state, classId), [state, classId]);

  useEffect(() => {
    const existing = state.attendance[date] ?? {};
    const next: Record<string, AttStatus> = {};
    pupils.forEach((p) => {
      next[p.id] = existing[p.id] ?? "present";
    });
    setDraft(next);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, pupils.length]);

  /* Optimistic: the row answers the tap instantly and the register is written
     straight away — the flash + header chip are just confirmation. */
  const set = (id: string, status: AttStatus) => {
    const next = { ...draft, [id]: status };
    setDraft(next);
    setDirty(false);
    saveAttendance(date, next);
    setSavedAt(Date.now());
    setFlash(id);
    window.setTimeout(() => setFlash((cur) => (cur === id ? null : cur)), 700);
  };

  const markAllPresent = () => {
    const next: Record<string, AttStatus> = {};
    pupils.forEach((p) => (next[p.id] = "present"));
    setDraft(next);
    setDirty(false);
    saveAttendance(date, next);
    setSavedAt(Date.now());
    toast(`Everyone in ${classById(state, classId)?.name ?? "this class"} marked present`);
  };

  const counts = {
    present: Object.values(draft).filter((v) => v === "present").length,
    late: Object.values(draft).filter((v) => v === "late").length,
    absent: Object.values(draft).filter((v) => v === "absent").length,
  };
  const total = pupils.length;
  const rate = total ? Math.round(((counts.present + counts.late) / total) * 100) : 0;
  const saved = state.attendance[date] ?? {};
  const savedCount = pupils.filter((p) => saved[p.id]).length;

  const trendData = Object.keys(state.attendance)
    .sort()
    .slice(-8)
    .map((d) => ({ date: d, ...attendanceForDate(state, d) }));

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Attendance register</h1>
          <div className="page-sub">
            {classById(state, classId)?.name ?? "—"} · {shortDate(date)} ·{" "}
            {total === 0
              ? "no pupils enrolled in this class yet"
              : savedCount === total
              ? "register saved"
              : `${savedCount}/${total} previously marked`}
          </div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={markAllPresent}>
            <IconCheck size={15} /> Mark all present
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              saveAttendance(date, draft);
              setDirty(false);
              setSavedAt(Date.now());
              toast(`Register saved for ${classById(state, classId)?.name ?? "class"}`);
            }}
          >
            <IconCheckSquare size={15} /> Save register
          </button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <StatCard label="Class size" value={total} icon={<IconCheckSquare size={17} />} trendLabel={classById(state, classId)?.room || "pupils enrolled"} />
        <StatCard label="Present" value={counts.present} icon={<IconCheck size={17} />} tone="#16a34a" soft="#e8f8ee" trendLabel="Marked in register" />
        <StatCard label="Late" value={counts.late} icon={<IconClock size={17} />} tone="#d97706" soft="#fef4e2" trendLabel="Arrived late" />
        <StatCard label="Absent" value={counts.absent} icon={<IconX size={17} />} tone="#dc2626" soft="#fdeceb" trendLabel={`Attendance ${rate}%`} />
      </div>

      <div className="grid g-dash att-layout">
        <Card>
          <div className="card-pad" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", borderBottom: "1px solid var(--line)" }}>
            <div className="field" style={{ width: 190 }}>
              <label>Class</label>
              <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {myClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ width: 170 }}>
              <label>Date</label>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {savedAt && !dirty ? (
                <Badge tone="badge-green">Saved</Badge>
              ) : dirty ? (
                <Badge tone="badge-amber">Unsaved changes</Badge>
              ) : savedCount === total && total > 0 ? (
                <Badge tone="badge-green">Saved</Badge>
              ) : (
                <Badge tone="badge-grey">Not saved</Badge>
              )}
            </div>
          </div>

          <div className="table-wrap">
            <table className="tbl att-table">
              <thead>
                <tr>
                  <th style={{ width: 34 }}>#</th>
                  <th>Pupil</th>
                  <th style={{ width: 96 }}>Term</th>
                  <th style={{ width: 250 }}>Today</th>
                </tr>
              </thead>
              <tbody>
                {pupils.map((p, i) => {
                  const status = draft[p.id] ?? "present";
                  return (
                    <tr key={p.id} className={flash === p.id ? "att-flash" : undefined}>
                      <td className="att-num" style={{ color: "var(--muted-2)", fontWeight: 800, fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <span className="cell-person">
                          <Avatar name={fullName(p)} size={30} />
                          <span>
                            <span className="nm" style={{ fontSize: 12.5 }}>{fullName(p)}</span>
                            <span className="sm">{p.admissionNo}</span>
                          </span>
                        </span>
                      </td>
                      <td className="att-term">
                        <span style={{ fontSize: 12, fontWeight: 800, color: attendancePct(state, p.id) >= 90 ? "var(--green)" : "var(--amber)" }}>
                          {attendancePct(state, p.id)}%
                        </span>
                      </td>
                      <td className="att-today">
                        <div className="att-toggle">
                          {(["present", "late", "absent"] as AttStatus[]).map((s) => (
                            <button key={s} className={status === s ? `on-${s}` : ""} onClick={() => set(p.id, s)}>
                              {s === "present" ? "Present" : s === "late" ? "Late" : "Absent"}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pupils.length === 0 && (
            <Empty title="No pupils in this class" sub="Admit pupils to start marking attendance." />
          )}
        </Card>

        <div className="grid" style={{ gap: 16, alignContent: "start" }}>
          <SectionCard title="Today's numbers" sub={`${classById(state, classId)?.name ?? "—"} · ${shortDate(date)}`}>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { label: "Present", value: counts.present, color: "#16a34a" },
                { label: "Late", value: counts.late, color: "#d97706" },
                { label: "Absent", value: counts.absent, color: "#dc2626" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 800 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: row.color }} />
                  <span>{row.label}</span>
                  <span className="mono" style={{ marginLeft: "auto" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{rate}%</span>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>attendance rate</span>
            </div>
          </SectionCard>

          <SectionCard title="Last saved registers" sub="Most recent days, newest first">
            {trendData.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {trendData
                  .slice()
                  .reverse()
                  .slice(0, 6)
                  .map((t) => (
                    <div key={t.date} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, fontWeight: 800 }}>
                      <span style={{ color: "var(--muted)" }}>{shortDate(t.date)}</span>
                      <span style={{ marginLeft: "auto" }}>{Math.round(t.rate)}%</span>
                    </div>
                  ))}
              </div>
            ) : (
              <Empty title="No history yet" sub="Saved registers appear here." />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function AttendanceReadOnly() {
  const { state, persona } = useApp();
  const ids = persona.childrenIds;
  const kids = ids.map((id) => state.students.find((s) => s.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof state.students.find>>[];
  const today = attendanceForDate(state, Object.keys(state.attendance).sort().slice(-1)[0] ?? todayISO());

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Attendance</h1>
          <div className="page-sub">Updated after each register is saved</div>
        </div>
      </div>

      {kids.length === 0 ? (
        <SectionCard title="Nothing to show yet"><Empty title="No linked pupil" /></SectionCard>
      ) : (
        <div className="grid g-dash">
          <div className="grid" style={{ gap: 16 }}>
            {kids.map((k) => {
              const pct = attendancePct(state, k.id);
              const dates = Object.keys(state.attendance).sort();
              return (
                <Card key={k.id} className="card-pad">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={fullName(k)} size={44} square />
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 15 }}>{fullName(k)}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>{classById(state, k.classId)?.name ?? "—"}</div>
                    </div>
                    <Badge tone={pct >= 92 ? "badge-green" : pct >= 85 ? "badge-amber" : "badge-red"}>{pct}% term</Badge>
                  </div>

                  {dates.length ? (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14 }}>
                        {dates.map((d) => {
                          const st = state.attendance[d][k.id];
                          const color = st === "present" ? "var(--green)" : st === "late" ? "var(--amber)" : "var(--red)";
                          return (
                            <div key={d} title={`${shortDate(d)} — ${st ?? "not marked"}`} style={{ width: 26, height: 26, borderRadius: 8, background: st ? color : "#e8ded2", opacity: st ? 0.22 : 0.35, border: `1.5px solid ${st ? color : "#e8ded2"}` }} />
                          );
                        })}
                      </div>
                      <div className="legend" style={{ marginTop: 12 }}>
                        <span><i style={{ background: "var(--green)" }} /> Present</span>
                        <span><i style={{ background: "var(--amber)" }} /> Late</span>
                        <span><i style={{ background: "var(--red)" }} /> Absent</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted)", fontWeight: 700 }}>No register marked yet.</div>
                  )}
                </Card>
              );
            })}
          </div>

          <SectionCard title="Latest register" sub={today.total ? `${today.total} pupils marked` : "No register yet"}>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { label: "Present", value: today.present, color: "#16a34a" },
                { label: "Late", value: today.late, color: "#d97706" },
                { label: "Absent", value: today.absent, color: "#dc2626" },
              ].map((row) => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 800 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: row.color }} />
                  <span>{row.label}</span>
                  <span className="mono" style={{ marginLeft: "auto" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="divider" />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 900 }}>{today.rate}%</span>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>in school</span>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
