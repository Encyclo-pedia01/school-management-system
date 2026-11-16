"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconArrowRight,
  IconBook,
  IconBriefcase,
  IconCheckSquare,
  IconFile,
  IconGrid,
  IconMegaphone,
  IconSettings,
  IconSparkle,
  IconUsers,
  IconWallet,
} from "@/components/Icons";
import { Avatar, Badge, Card, Empty, Progress, SectionCard, StatCard } from "@/components/ui";
import {
  activeStudents,
  attendanceForDate,
  balanceFor,
  billedFor,
  classById,
  classRanking,
  currentTerm,
  feeStatus,
  feeTotals,
  fullName,
  lastSchoolDay,
  longDate,
  money,
  resultsFor,
  setupProgress,
  shortDate,
  studentsOf,
  termProgress,
  todayISO,
} from "@/lib/derive";
import { useApp } from "@/lib/store";
import { compactMoney, useIsPhone } from "@/lib/useMedia";
import type { Role } from "@/lib/types";

/* greeting is computed on the client so the server and browser always agree */
function useGreeting() {
  const [greeting, setGreeting] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
  }, []);
  return greeting;
}

const QUICK_LINKS: Record<Role, { href: string; label: string; sub: string; icon: React.ReactNode; tone: string; soft: string }[]> = {
  admin: [
    { href: "/students", label: "Students", sub: "Register, admit and edit pupils", icon: <IconUsers size={16} />, tone: "#ea580c", soft: "#fff1e6" },
    { href: "/attendance", label: "Attendance", sub: "Take today's register", icon: <IconCheckSquare size={16} />, tone: "#2563eb", soft: "#eaf1ff" },
    { href: "/exams", label: "Exams & scores", sub: "Enter class and exam marks", icon: <IconBook size={16} />, tone: "#7c3aed", soft: "#f2ecfe" },
    { href: "/reports", label: "Report cards", sub: "Rank, publish and print", icon: <IconFile size={16} />, tone: "#16a34a", soft: "#eafaf0" },
    { href: "/fees", label: "Fees", sub: "Balances, receipts and payments", icon: <IconWallet size={16} />, tone: "#ea580c", soft: "#fff1e6" },
    { href: "/classes", label: "Classes", sub: "Streams, teachers and rooms", icon: <IconGrid size={16} />, tone: "#2563eb", soft: "#eaf1ff" },
    { href: "/staff", label: "Staff", sub: "Directory and assignments", icon: <IconBriefcase size={16} />, tone: "#7c3aed", soft: "#f2ecfe" },
    { href: "/announcements", label: "Announcements", sub: "Notify parents and staff", icon: <IconMegaphone size={16} />, tone: "#d97706", soft: "#fff7e6" },
    { href: "/settings", label: "School setup", sub: "Profile, subjects, terms, grading", icon: <IconSettings size={16} />, tone: "#4b5563", soft: "#f3f4f6" },
  ],
  teacher: [
    { href: "/students", label: "My pupils", sub: "Everyone in your classes", icon: <IconUsers size={16} />, tone: "#ea580c", soft: "#fff1e6" },
    { href: "/attendance", label: "Attendance", sub: "Mark today's register", icon: <IconCheckSquare size={16} />, tone: "#2563eb", soft: "#eaf1ff" },
    { href: "/exams", label: "Exams & scores", sub: "Enter marks for your class", icon: <IconBook size={16} />, tone: "#7c3aed", soft: "#f2ecfe" },
    { href: "/reports", label: "Report cards", sub: "Ranking and printing", icon: <IconFile size={16} />, tone: "#16a34a", soft: "#eafaf0" },
  ],
  parent: [
    { href: "/reports", label: "Report cards", sub: "Published results", icon: <IconFile size={16} />, tone: "#16a34a", soft: "#eafaf0" },
    { href: "/fees", label: "Fees", sub: "Balances and receipts", icon: <IconWallet size={16} />, tone: "#ea580c", soft: "#fff1e6" },
    { href: "/attendance", label: "Attendance", sub: "Your children's record", icon: <IconCheckSquare size={16} />, tone: "#2563eb", soft: "#eaf1ff" },
    { href: "/announcements", label: "Announcements", sub: "Notices from school", icon: <IconMegaphone size={16} />, tone: "#d97706", soft: "#fff7e6" },
  ],
};

export default function DashboardPage() {
  const { state, persona } = useApp();
  const greeting = useGreeting();
  const hasPupils = activeStudents(state).length > 0;
  const term = currentTerm(state);
  const prog = termProgress(state);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <div className="eyebrow">{state.school.motto || "School management"}</div>
          <h1 className="page-title" style={{ marginTop: 6 }}>
            {greeting}, {persona.name.replace(/^(Mrs\.|Mr\.|Ms\.|Dr\.)\s/, "").split(" ")[0]}
          </h1>
          <div className="page-sub">
            {longDate(todayISO())} · {term?.name ?? "No term set"}
            {state.school.name ? ` · ${state.school.name}` : ""}
          </div>
        </div>
        <div className="head-actions">
          {persona.role === "admin" && (
            <Link href="/students" className="btn btn-primary">
              <IconUsers size={15} /> Manage pupils
            </Link>
          )}
          {persona.role === "teacher" && persona.classIds.length > 0 && (
            <Link href="/attendance" className="btn btn-primary">
              <IconCheckSquare size={15} /> Mark attendance
            </Link>
          )}
        </div>
      </div>

      {!hasPupils ? (
        persona.role === "admin" ? <GettingStarted /> : <WaitingRoom />
      ) : (
        <>
          {persona.role === "admin" && <AdminHome />}
          {persona.role === "teacher" && <TeacherHome />}
          {persona.role === "parent" && <ParentHome />}
        </>
      )}

      <SectionCard
        title="Term at a glance"
        sub={prog.term.end ? `${prog.daysLeft} days to close` : "Set your term in School setup"}
      >
        <Progress pct={prog.pct} color="linear-gradient(90deg,#f97316,#ea580c)" height={10} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--muted)", marginTop: 8 }}>
          <span>{shortDate(prog.term.start)}</span>
          <span>{shortDate(prog.term.end)}</span>
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* quick links                                                         */
/* ------------------------------------------------------------------ */
function QuickLinks({ role }: { role: Role }) {
  return (
    <div className="quick-tiles" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
      {QUICK_LINKS[role].map((l) => (
        <Link key={l.href} href={l.href} className="quick-action">
          <span style={{ width: 34, height: 34, borderRadius: 11, background: l.soft, color: l.tone, display: "grid", placeItems: "center", flex: "none" }}>
            {l.icon}
          </span>
          <span>
            <span className="qa-t">{l.label}</span>
            <span className="qa-s">{l.sub}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* admin                                                               */
/* ------------------------------------------------------------------ */
function AdminHome() {
  const { state } = useApp();
  const phone = useIsPhone();
  const pupils = activeStudents(state);
  const fees = feeTotals(state);
  const sym = state.school.currencySymbol || "GH₵";
  const day = lastSchoolDay(state);
  const att = attendanceForDate(state, day);
  const attPct = att.total ? Math.round(((att.present + att.late * 0.5) / att.total) * 100) : 0;
  const unmarkedClasses = state.classes.filter((c) => {
    const roster = studentsOf(state, c.id);
    return roster.length > 0 && roster.every((s) => !state.attendance[day]?.[s.id]);
  });
  const unpublished = state.classes.filter((c) => !state.published.includes(`${c.id}::${state.currentTermId}`));
  const owing = pupils.filter((s) => feeStatus(state, s) !== "Paid").length;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="grid g-4">
        <StatCard label="Pupils on roll" value={pupils.length} icon={<IconUsers size={17} />} trendLabel={`${state.classes.length} classes`} />
        <StatCard
          label="Attendance"
          value={`${attPct}%`}
          suffix=""
          icon={<IconCheckSquare size={17} />}
          tone="#2563eb"
          soft="#eaf1ff"
          trendLabel={att.total ? `Last register · ${shortDate(day)}` : "No register saved yet"}
        />
        <StatCard
          label="Fees collected"
          value={phone ? compactMoney(fees.collected, sym) : money(fees.collected)}
          icon={<IconWallet size={17} />}
          trendLabel={`${money(fees.outstanding)} outstanding`}
        />
        <StatCard label="Staff" value={state.staff.length} icon={<IconBriefcase size={17} />} tone="#7c3aed" soft="#f2ecfe" trendLabel="In the directory" />
      </div>

      <Card className="card-pad">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
          <h3 style={{ fontSize: 15 }}>Jump straight in</h3>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>every module, one click</span>
        </div>
        <QuickLinks role="admin" />
      </Card>

      <div className="grid g-2">
        <SectionCard title="Needs attention" sub="Generated from live records">
          {[
            owing > 0
              ? { tone: "#dc2626", title: `${owing} pupil${owing === 1 ? "" : "s"} with a fee balance`, sub: `${money(fees.outstanding)} outstanding`, href: "/fees" }
              : { tone: "#16a34a", title: "Every pupil is fully paid", sub: "Nothing outstanding this term", href: "/fees" },
            unmarkedClasses.length > 0
              ? { tone: "#d97706", title: `${unmarkedClasses.length} class${unmarkedClasses.length === 1 ? "" : "es"} not marked`, sub: `Register for ${shortDate(day)}`, href: "/attendance" }
              : { tone: "#16a34a", title: "All registers are up to date", sub: `Latest school day · ${shortDate(day)}`, href: "/attendance" },
            unpublished.length > 0
              ? { tone: "#2563eb", title: `${unpublished.length} class${unpublished.length === 1 ? "" : "es"} unpublished`, sub: "Report cards parents can't see yet", href: "/reports" }
              : { tone: "#16a34a", title: "Report cards published", sub: "Parents can see this term's results", href: "/reports" },
          ].map((row) => (
            <Link key={row.title} href={row.href} className="alert-row" style={{ borderLeft: `3px solid ${row.tone}` }}>
              <span className="alert-body">
                <span className="alert-t">{row.title}</span>
                <span className="alert-s">{row.sub}</span>
              </span>
              <IconArrowRight size={15} />
            </Link>
          ))}
        </SectionCard>

        <SectionCard title="Latest announcements" sub="Sent to parents and staff" right={<Link href="/announcements" className="btn btn-ghost btn-sm">All</Link>}>
          {state.announcements.length ? (
            state.announcements
              .slice()
              .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date))
              .slice(0, 4)
              .map((a) => (
                <div key={a.id} className="list-row" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
                      {shortDate(a.date)} · {a.author}
                    </div>
                  </div>
                  {a.pinned && <Badge tone="badge-amber">Pinned</Badge>}
                </div>
              ))
          ) : (
            <Empty title="No announcements yet" sub="Post a notice from Announcements." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* teacher                                                             */
/* ------------------------------------------------------------------ */
function TeacherHome() {
  const { state, persona } = useApp();
  const myClasses = state.classes.filter((c) => persona.classIds.includes(c.id));
  const day = lastSchoolDay(state);

  if (!myClasses.length)
    return (
      <Card className="card-pad">
        <Empty
          title="No classes assigned to you yet"
          sub="An administrator assigns classes on the Staff page — your register and score sheets appear here once they do."
        />
      </Card>
    );

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card className="card-pad">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
          <h3 style={{ fontSize: 15 }}>Jump straight in</h3>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>your classes only</span>
        </div>
        <QuickLinks role="teacher" />
      </Card>

      <div className="grid g-3">
        {myClasses.map((c) => {
          const roster = studentsOf(state, c.id);
          const marked = roster.filter((s) => state.attendance[day]?.[s.id]).length;
          const ranking = classRanking(state, c.id);
          const avg = ranking.length ? Math.round(ranking.reduce((a, r) => a + r.avg, 0) / ranking.length) : 0;
          return (
            <Card key={c.id} className="card-pad">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 15 }}>{c.name}</h3>
                <Badge tone="badge-grey">{c.level}</Badge>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700, marginTop: 4 }}>{c.room || "No room set"}</div>
              <div className="divider" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <MiniStat label="Pupils" value={String(roster.length)} />
                <MiniStat label="Class average" value={avg ? `${avg}%` : "—"} />
                <MiniStat label="Marked today" value={`${marked}/${roster.length}`} />
                <MiniStat label="Top pupil" value={ranking[0] ? fullName(ranking[0].student).split(" ")[0] : "—"} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Link href="/attendance" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }}>Register</Link>
                <Link href="/exams" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>Scores</Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* parent                                                              */
/* ------------------------------------------------------------------ */
function ParentHome() {
  const { state, persona } = useApp();
  const children = state.students.filter((s) => persona.childrenIds.includes(s.id));

  if (!children.length)
    return (
      <Card className="card-pad">
        <Empty title="No pupil linked to you yet" sub="The school links your child to your guardian record." />
      </Card>
    );

  return (
    <div className="grid" style={{ gap: 16 }}>
      <Card className="card-pad">
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
          <h3 style={{ fontSize: 15 }}>Jump straight in</h3>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>for your children</span>
        </div>
        <QuickLinks role="parent" />
      </Card>

      <div className="grid g-2">
        {children.map((child) => {
          const cls = classById(state, child.classId);
          const results = resultsFor(state, child.id);
          const avg = results.length ? Math.round(results.reduce((a, r) => a + r.total, 0) / results.length) : 0;
          const billed = billedFor(state, child);
          const bal = balanceFor(state, child);
          return (
            <Card key={child.id} className="card-pad">
              <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <Avatar name={fullName(child)} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 15 }}>{fullName(child)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>
                    {cls?.name ?? "No class"} · {child.admissionNo}
                  </div>
                </div>
                <Badge tone={bal > 0 ? "badge-red" : "badge-green"}>{bal > 0 ? `${money(bal)} owing` : "Fees paid"}</Badge>
              </div>
              <div className="divider" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <MiniStat label="Term average" value={avg ? `${avg}%` : "—"} />
                <MiniStat label="Fees billed" value={money(billed)} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <Link href={`/reports/${child.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: "center" }}>Report card</Link>
                <Link href="/fees" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: "center" }}>Fees</Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* first run                                                           */
/* ------------------------------------------------------------------ */
function GettingStarted() {
  const { state } = useApp();
  const { steps, done, total } = setupProgress(state);
  const pct = Math.round((done / total) * 100);

  return (
    <div className="grid" style={{ gap: 16, marginBottom: 16 }}>
      <Card className="card-pad" style={{ background: "linear-gradient(110deg,#14161a,#23262d)", color: "#fff", border: "none" }}>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="eyebrow" style={{ color: "#ffb27a" }}>{done} of {total} complete</div>
            <h2 style={{ fontSize: 24, marginTop: 8, color: "#fff" }}>Let&apos;s get your school running</h2>
            <p style={{ fontSize: 13, color: "#b9b3aa", fontWeight: 600, marginTop: 8, maxWidth: 520, lineHeight: 1.55 }}>
              Your system is blank on purpose. Add staff, classes and pupils and every register, score sheet and report
              card fills itself in.
            </p>
            <div style={{ display: "flex", gap: 9, marginTop: 16, flexWrap: "wrap" }}>
              <Link href="/students" className="btn btn-primary btn-sm"><IconUsers size={14} /> Admit a pupil</Link>
              <Link href="/settings" className="btn btn-ghost btn-sm" style={{ background: "transparent", color: "#fff", borderColor: "#3a3f47" }}>
                School setup
              </Link>
            </div>
          </div>
          <div style={{ minWidth: 180 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800, color: "#b9b3aa", marginBottom: 8 }}>
              <span>Progress</span>
              <span>{pct}%</span>
            </div>
            <Progress pct={pct} color="linear-gradient(90deg,#f97316,#ea580c)" height={9} />
          </div>
        </div>
      </Card>

      <div className="grid g-2">
        <SectionCard title="Setup checklist" sub="Everything is editable later in School setup">
          {steps.map((step) => (
            <Link key={step.id} href={step.href} className="list-row" style={{ alignItems: "center" }}>
              <span
                style={{
                  width: 22, height: 22, borderRadius: 7, flex: "none", display: "grid", placeItems: "center",
                  background: step.done ? "var(--green-soft)" : "#fff", border: step.done ? "none" : "1.5px solid var(--line-2)",
                  color: step.done ? "var(--green)" : "transparent", fontSize: 12, fontWeight: 900,
                }}
              >
                ✓
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 800, color: step.done ? "var(--muted)" : "var(--ink)" }}>{step.label}</span>
              {!step.done && <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--orange-dk)" }}>Set up →</span>}
            </Link>
          ))}
        </SectionCard>

        <SectionCard title="Quick actions" sub="Jump straight in">
          <QuickLinks role="admin" />
        </SectionCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* waiting room (teacher / parent with no pupils yet)                   */
/* ------------------------------------------------------------------ */
function WaitingRoom() {
  const { persona } = useApp();
  const copy =
    persona.role === "teacher"
      ? {
          title: "No pupils in your classes yet",
          body: "As soon as an administrator admits pupils and assigns you a class, your register and score sheets appear here.",
        }
      : {
          title: "No pupil linked to you yet",
          body: "The school will link your child to your guardian record. Their results, fees and attendance then show up here.",
        };

  return (
    <Card className="card-pad" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ width: 48, height: 48, borderRadius: 15, background: "var(--orange-soft)", color: "var(--orange-dk)", display: "grid", placeItems: "center", flex: "none" }}>
          <IconSparkle size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h2 style={{ fontSize: 19 }}>{copy.title}</h2>
          <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.55, marginTop: 8, maxWidth: 540 }}>{copy.body}</p>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* bits                                                                */
/* ------------------------------------------------------------------ */
function MiniStat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div style={{ background: "var(--cream-2)", borderRadius: 12, padding: "8px 11px" }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2, color: tone ?? "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );
}
