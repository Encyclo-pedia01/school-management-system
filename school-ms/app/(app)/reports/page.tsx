"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconFile, IconPrint, IconStar } from "@/components/Icons";
import { Avatar, Badge, Card, Empty, Progress, SectionCard, StatCard } from "@/components/ui";
import { classById, classRanking, currentTerm, fullName, rankOf, shortDate, studentsOf } from "@/lib/derive";

import { useApp } from "@/lib/store";

export default function ReportsPage() {
  const { state, persona, togglePublish, toast } = useApp();
  if (persona.role === "parent") return <ReportsReadOnly />;
  if (!state.classes.length)
    return (
      <div className="fade-in">
        <div className="page-head"><div><h1 className="page-title">Report cards</h1><div className="page-sub">No classes yet</div></div></div>
        <SectionCard title="Create classes and enter scores first" sub="Report cards are generated per class">
          <Link href="/classes" className="btn btn-primary btn-sm">Go to classes</Link>
        </SectionCard>
      </div>
    );
  return <ReportsAdmin />;
}

function ReportsAdmin() {
  const { state, persona, togglePublish, toast } = useApp();
  const myClasses = state.classes.filter((c) => (persona.role === "teacher" ? persona.classIds.includes(c.id) : true));
  const [classId, setClassId] = useState("");
  const firstClassId = myClasses[0]?.id ?? "";
  // pick a default class once records are hydrated from storage
  useEffect(() => {
    if (!classId && firstClassId) setClassId(firstClassId);
  }, [classId, firstClassId]);
  const cls = classById(state, classId);
  const ranking = useMemo(() => classRanking(state, classId), [state, classId]);
  const term = currentTerm(state);
  const published = state.published.includes(`${classId}::${state.currentTermId}`);
  const classAvg = ranking.length ? Math.round(ranking.reduce((a, r) => a + r.avg, 0) / ranking.length) : 0;
  const distinctions = ranking.filter((r) => r.avg >= 75).length;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Report cards</h1>
          <div className="page-sub">{term ? `${term.name} · ${term.year} · positions from class average` : "No term set"}</div>
        </div>
        <div className="head-actions">
          <select className="select" style={{ width: 180 }} value={classId} onChange={(e) => setClassId(e.target.value)}>
            {myClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button
            className="btn btn-primary"
            disabled={!ranking.some((r) => r.results.length)}
            onClick={() => {
              togglePublish(classId);
              toast(published ? `${cls?.name} reports unpublished` : `${cls?.name} reports published to parents`, published ? "warn" : "success");
            }}
          >
            <IconStar size={15} /> {published ? "Unpublish" : "Publish to parents"}
          </button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <StatCard label="Pupils in class" value={ranking.length} icon={<IconFile size={17} />} trendLabel={cls?.name ?? ""} />
        <StatCard label="Class average" value={`${classAvg}%`} icon={<IconFile size={17} />} tone="#2563eb" soft="#eaf1ff" trendLabel="Mean of all subjects" />
        <StatCard label="Distinctions" value={distinctions} icon={<IconStar size={17} />} tone="#16a34a" soft="#e8f8ee" trendLabel="Average of 75%+" />
        <StatCard
          label="Publication"
          value={published ? "Published" : "Draft"}
          icon={<IconPrint size={17} />}
          tone={published ? "#16a34a" : "#d97706"}
          soft={published ? "#e8f8ee" : "#fef4e2"}
          trendLabel={published ? "Visible in the parent portal" : "Not visible to parents"}
        />
      </div>

      <Card>
        <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>{cls?.name} · termly ranking</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, marginTop: 2 }}>
              Best six subjects give the aggregate{term?.end ? ` · ${shortDate(term.end)} closing date` : ""}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Badge tone={published ? "badge-green" : "badge-amber"}>{published ? "Published" : "Draft"}</Badge>
          </div>
        </div>

        {ranking.length ? (
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Pupil</th>
                  <th className="num-right">Average</th>
                  <th className="num-right">Aggregate</th>
                  <th>Best subject</th>
                  <th>Grade profile</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => {
                  const best = [...r.results].sort((a, b) => b.total - a.total)[0];
                  return (
                    <tr key={r.student.id}>
                      <td style={{ fontWeight: 900, color: r.position <= 3 ? "var(--orange-dk)" : "var(--muted)" }}>{r.position}</td>
                      <td>
                        <div className="cell-person">
                          <Avatar name={fullName(r.student)} size={30} />
                          <span>
                            <span className="nm" style={{ fontSize: 12.5 }}>{fullName(r.student)}</span>
                            <span className="sm">{r.student.admissionNo}</span>
                          </span>
                        </div>
                      </td>
                      <td className="num-right mono" style={{ fontWeight: 900 }}>{r.results.length ? `${r.avg}%` : "—"}</td>
                      <td className="num-right mono">{r.results.length ? r.aggregate : "—"}</td>
                      <td style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>{best?.subject ?? "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 3 }}>
                          {r.results.map((res) => (
                            <span
                              key={res.subjectId}
                              title={`${res.subject}: ${res.total}% (grade ${res.grade})`}
                              className={`badge ${res.tone}`}
                              style={{ padding: "2px 5px", fontSize: 9.5 }}
                            >
                              {res.grade}
                            </span>
                          ))}
                          {r.results.length === 0 && <span style={{ fontSize: 11.5, color: "var(--muted-2)", fontWeight: 700 }}>no scores</span>}
                        </div>
                      </td>
                      <td className="num-right">
                        <Link href={`/reports/${r.student.id}`} className="btn btn-ghost btn-sm">
                          <IconFile size={13} /> Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No pupils in this class" sub="Admit pupils to build report cards." />
        )}
      </Card>
    </div>
  );
}

function ReportsReadOnly() {
  const { state, persona } = useApp();
  const ids = persona.childrenIds;
  const term = currentTerm(state);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Report cards</h1>
          <div className="page-sub">{term ? `${term.name} · ${term.year}` : "No term set"}</div>
        </div>
      </div>

      {ids.length === 0 ? (
        <SectionCard title="No report cards yet"><Empty title="No linked pupil" /></SectionCard>
      ) : (
        <div className="grid g-2">
          {ids.map((id) => {
            const s = state.students.find((x) => x.id === id);
            if (!s) return null;
            const rank = rankOf(state, s.id);
            const published = state.published.includes(`${s.classId}::${state.currentTermId}`);
            return (
              <SectionCard key={id} title={fullName(s)} sub={`${classById(state, s.classId)?.name ?? "—"} · ${s.admissionNo}`}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <Avatar name={fullName(s)} size={48} square />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <Badge tone="badge-blue">Average {rank.avg}%</Badge>
                      <Badge tone="badge-orange">Pos {rank.position}/{rank.size}</Badge>
                      <Badge tone={published ? "badge-green" : "badge-grey"}>{published ? "Published" : "Pending"}</Badge>
                    </div>
                    <Progress pct={rank.avg} color="var(--orange)" />
                  </div>
                </div>
                <Link href={`/reports/${s.id}`} className="btn btn-primary btn-block" style={{ marginTop: 14 }}>
                  <IconFile size={15} /> View full report card
                </Link>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
