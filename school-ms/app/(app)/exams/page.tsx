"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconFile, IconSearch } from "@/components/Icons";
import { HBars } from "@/components/Charts";
import { Avatar, Badge, Card, Empty, SectionCard, StatCard } from "@/components/ui";
import { classById, fullName, studentsOf, subjectAverages, subjectsFor } from "@/lib/derive";
import { bandRange, gradeBadge, gradeFor } from "@/lib/grading";
import { useApp } from "@/lib/store";

export default function ExamsPage() {
  const { state, persona, saveScores, toast } = useApp();
  const myClasses = state.classes.filter((c) => (persona.role === "teacher" ? persona.classIds.includes(c.id) : true));
  const [classId, setClassId] = useState("");
  const firstClassId = myClasses[0]?.id ?? "";
  // pick a default class once records are hydrated from storage
  useEffect(() => {
    if (!classId && firstClassId) setClassId(firstClassId);
  }, [classId, firstClassId]);
  const cls = classById(state, classId);
  const subjects = useMemo(() => (cls ? subjectsFor(state, cls.level) : []), [state, cls]);
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [draft, setDraft] = useState<Record<string, { class: number; exam: number }>>({});
  const [find, setFind] = useState("");
  const [dirty, setDirty] = useState(false);

  const pupils = useMemo(() => studentsOf(state, classId), [state, classId]);

  useEffect(() => {
    if (!subjects.some((s) => s.id === subjectId)) setSubjectId(subjects[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subjects.length]);

  useEffect(() => {
    const next: Record<string, { class: number; exam: number }> = {};
    pupils.forEach((p) => {
      next[p.id] = state.scores[p.id]?.[subjectId] ?? { class: 0, exam: 0 };
    });
    setDraft(next);
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, subjectId, pupils.length]);

  if (!state.classes.length)
    return (
      <div className="fade-in">
        <div className="page-head">
          <div><h1 className="page-title">Exams & scores</h1><div className="page-sub">No classes yet</div></div>
        </div>
        <SectionCard title="Create a class and its subjects first" sub="Scores are entered per class and subject">
          {persona.role === "admin" ? (
            <Link href="/settings" className="btn btn-primary btn-sm">School setup</Link>
          ) : (
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>
              Ask an administrator to create your classes and subjects.
            </div>
          )}
        </SectionCard>
      </div>
    );

  const visiblePupils = find.trim()
    ? pupils.filter((p) => `${p.firstName} ${p.lastName} ${p.admissionNo}`.toLowerCase().includes(find.trim().toLowerCase()))
    : pupils;

  const rows = visiblePupils.map((p) => {
    const d = draft[p.id] ?? { class: 0, exam: 0 };
    const total = (d.class ?? 0) + (d.exam ?? 0);
    return { pupil: p, ...d, total, grade: gradeFor(total) };
  });

  const avgs = subjectAverages(state, classId);
  const classAvg = rows.length ? Math.round(rows.reduce((a, r) => a + r.total, 0) / rows.length) : 0;
  const passed = rows.filter((r) => r.total >= 50).length;
  const entered = rows.filter((r) => r.total > 0).length;
  const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? "—";

  const setVal = (id: string, field: "class" | "exam", value: string, max: number) => {
    const n = Math.max(0, Math.min(max, Number(value) || 0));
    setDraft((d) => ({ ...d, [id]: { ...(d[id] ?? { class: 0, exam: 0 }), [field]: n } }));
    setDirty(true);
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Exams & scores</h1>
          <div className="page-sub">Class score 30% + exam 70% · grades 1–9</div>
        </div>
        <div className="head-actions">
          <button
            className="btn btn-primary"
            disabled={!subjectId}
            onClick={() => {
              saveScores(rows.map((r) => ({ studentId: r.pupil.id, subjectId, classScore: r.class, examScore: r.exam })));
              setDirty(false);
              toast(`${subjectName} scores saved for ${cls?.name ?? "class"}`);
            }}
          >
            <IconCheck size={15} /> Save scores
          </button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <StatCard label="Pupils in class" value={pupils.length} icon={<IconFile size={17} />} trendLabel={cls?.name ?? ""} />
        <StatCard label="Scores entered" value={`${entered}/${pupils.length}`} icon={<IconCheck size={17} />} tone="#2563eb" soft="#eaf1ff" trendLabel={subjectName} />
        <StatCard label="Subject average" value={`${classAvg}%`} icon={<IconFile size={17} />} tone="#7c3aed" soft="#f2ecfe" trendLabel="All pupils in view" />
        <StatCard label="Passing (≥50%)" value={passed} icon={<IconCheck size={17} />} tone="#16a34a" soft="#e8f8ee" trendLabel={`${pupils.length ? Math.round((passed / pupils.length) * 100) : 0}% of class`} />
      </div>

      <div className="grid g-dash">
        <Card>
          <div className="card-pad" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", borderBottom: "1px solid var(--line)" }}>
            <div className="field" style={{ width: 180 }}>
              <label>Class</label>
              <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ width: 200 }}>
              <label>Find pupil</label>
              <div className="search" style={{ width: "100%" }}>
                <IconSearch size={15} />
                <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Name or admission no." />
              </div>
            </div>
            <div className="field" style={{ width: 210 }}>
              <label>Subject</label>
              <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ marginLeft: "auto" }}>
              {dirty ? <Badge tone="badge-amber">Unsaved changes</Badge> : <Badge tone="badge-green">All saved</Badge>}
            </div>
          </div>

          {subjects.length === 0 ? (
            <Empty title="No subjects for this level" sub="Add subjects in School setup." />
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Pupil</th>
                    <th style={{ width: 110 }}>Class /30</th>
                    <th style={{ width: 110 }}>Exam /70</th>
                    <th className="num-right">Total</th>
                    <th>Grade</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.pupil.id}>
                      <td>
                        <div className="cell-person">
                          <Avatar name={fullName(r.pupil)} size={28} />
                          <span>
                            <span className="nm" style={{ fontSize: 12.5 }}>{fullName(r.pupil)}</span>
                            <span className="sm">{r.pupil.admissionNo}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <input
                          className="input mono"
                          type="number"
                          min={0}
                          max={30}
                          value={r.class}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => setVal(r.pupil.id, "class", e.target.value, 30)}
                          style={{ padding: "6px 9px", width: 78 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input mono"
                          type="number"
                          min={0}
                          max={70}
                          value={r.exam}
                          onFocus={(e) => e.currentTarget.select()}
                          onChange={(e) => setVal(r.pupil.id, "exam", e.target.value, 70)}
                          style={{ padding: "6px 9px", width: 78 }}
                        />
                      </td>
                      <td className="num-right mono" style={{ fontWeight: 900 }}>{r.total}%</td>
                      <td><span className={`badge ${gradeBadge(r.grade.tone)}`}>{r.grade.label}</span></td>
                      <td style={{ color: "var(--muted)", fontWeight: 700, fontSize: 12.5 }}>{r.grade.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {subjects.length > 0 && rows.length === 0 && (
            <Empty
              title={find.trim() ? "No pupil matches that search" : "No pupils in this class"}
              sub={find.trim() ? "Try another name or admission number." : "Admit pupils first."}
            />
          )}
        </Card>

        <div className="grid" style={{ gap: 16, alignContent: "start" }}>
          <SectionCard title="Class averages" sub={`${cls?.name ?? ""} · all subjects`}>
            {avgs.length ? (
              <HBars
                data={avgs.map((a) => ({
                  label: a.subject.length > 17 ? a.subject.slice(0, 16) + "…" : a.subject,
                  value: a.avg,
                  color: a.avg >= 70 ? "#16a34a" : a.avg >= 55 ? "#2563eb" : "#f97316",
                }))}
                max={100}
                suffix="%"
              />
            ) : (
              <Empty title="No subjects yet" />
            )}
          </SectionCard>

          <SectionCard title="Grading scale" sub="Set by the school in School setup">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 700 }}>
              {[...(state.grading ?? [])].map((g, i) => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span className={`badge ${gradeBadge(g.tone)}`} style={{ minWidth: 26, justifyContent: "center" }}>{g.label}</span>
                  <span className="mono" style={{ color: "var(--muted)" }}>{bandRange(state.grading, i)}</span>
                  <span style={{ marginLeft: "auto" }}>{g.remark}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
