import { gradeBadge, gradeFor } from "./grading";
import type { AppState, AttStatus, ClassRoom, Student, Subject } from "./types";

/* ------------------------------------------------------------------ */
/* currency (set by the provider from the school profile)             */
/* ------------------------------------------------------------------ */
let SYMBOL = "GH₵";
export const setCurrencySymbol = (s: string) => {
  SYMBOL = s || "GH₵";
};
export const currencySymbol = () => SYMBOL;

const group = (n: number) => Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const sign = (n: number) => (n < 0 ? "-" : "");

export const money = (v: number) => sign(v) + SYMBOL + group(Math.round(v));
export const money2 = (v: number) => sign(v) + SYMBOL + (Math.round(v * 100) / 100).toFixed(2);
export const moneyCompact = (v: number) =>
  Math.abs(v) >= 1000 ? sign(v) + SYMBOL + Math.round(v / 100) / 10 + "k" : money(v);

/* ------------------------------------------------------------------ */
/* dates — formatted by hand so server & browser always agree          */
/* ------------------------------------------------------------------ */
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const shortDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const dayMonth = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
export const longDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return "";
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
export const monthShort = (ym: string) => (ym?.length >= 7 ? MONTHS[Number(ym.slice(5, 7)) - 1] : ym);
export const todayISO = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/* names & avatars                                                     */
/* ------------------------------------------------------------------ */
export const fullName = (s: { firstName: string; lastName: string }) => `${s.firstName} ${s.lastName}`.trim();
export const initials = (name: string) =>
  name
    .replace(/^(Mrs\.|Mr\.|Ms\.|Dr\.|Prof\.)\s/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

const AV = ["#f97316", "#2563eb", "#7c3aed", "#0d9488", "#db2777", "#ca8a04", "#0891b2", "#4d7c0f"];
export const avatarColor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973;
  return AV[h % AV.length];
};

/* ------------------------------------------------------------------ */
/* lookups                                                             */
/* ------------------------------------------------------------------ */
export const classById = (state: AppState, id: string) => state.classes.find((c) => c.id === id);
export const classByName = (state: AppState, name: string) => state.classes.find((c) => c.name === name);
export const studentById = (state: AppState, id: string) => state.students.find((s) => s.id === id);
export const staffById = (state: AppState, id: string) => state.staff.find((s) => s.id === id);
export const guardianOf = (state: AppState, student: Student) => state.guardians.find((g) => g.id === student.guardianId);
export const studentsOf = (state: AppState, classId: string) =>
  state.students.filter((s) => s.classId === classId && s.status === "Active").sort((a, b) => fullName(a).localeCompare(fullName(b)));
export const activeStudents = (state: AppState) => state.students.filter((s) => s.status === "Active");
export const subjectsFor = (state: AppState, level: string) => state.subjects.filter((s) => s.level === level);
export const subjectById = (state: AppState, id: string): Subject | undefined => state.subjects.find((s) => s.id === id);
export const currentTerm = (state: AppState) => state.terms.find((t) => t.id === state.currentTermId) ?? state.terms[0];
export const classesFor = (state: AppState, ids: string[]): ClassRoom[] => state.classes.filter((c) => ids.includes(c.id));

/* ------------------------------------------------------------------ */
/* fees                                                                */
/* ------------------------------------------------------------------ */
export const billedFor = (state: AppState, student: Student) =>
  state.feeByLevel[classById(state, student.classId)?.level ?? "Primary"] ?? 0;

export const paidFor = (state: AppState, studentId: string, termId = state.currentTermId) =>
  state.payments
    .filter((p) => p.studentId === studentId && (!termId || p.termId === termId))
    .reduce((a, p) => a + p.amount, 0);

export const balanceFor = (state: AppState, student: Student) =>
  Math.max(0, billedFor(state, student) - paidFor(state, student.id));

export const feeStatus = (state: AppState, student: Student): "Paid" | "Part paid" | "Owing" => {
  const billed = billedFor(state, student);
  const paid = paidFor(state, student.id);
  if (billed === 0 && paid === 0) return "Owing";
  if (paid >= billed) return "Paid";
  if (paid > 0) return "Part paid";
  return "Owing";
};

export const feeTotals = (state: AppState) => {
  const list = activeStudents(state);
  const billed = list.reduce((a, s) => a + billedFor(state, s), 0);
  const collected = list.reduce((a, s) => a + Math.min(paidFor(state, s.id), billedFor(state, s)), 0);
  const outstanding = Math.max(0, billed - collected);
  const arrearsCount = list.filter((s) => feeStatus(state, s) !== "Paid").length;
  return { billed, collected, outstanding, arrearsCount, rate: billed ? Math.round((collected / billed) * 100) : 0 };
};

export const collectionsByMonth = (state: AppState) => {
  const map = new Map<string, number>();
  state.payments.forEach((p) => map.set(p.date.slice(0, 7), (map.get(p.date.slice(0, 7)) ?? 0) + p.amount));

  // span the current term (or the payments themselves) so the trend has a real baseline
  const term = state.terms.find((t) => t.id === state.currentTermId);
  const keys = [...map.keys()].sort();
  const start = term?.start?.slice(0, 7) ?? keys[0];
  const end = todayISO().slice(0, 7) > (keys[keys.length - 1] ?? "")
    ? todayISO().slice(0, 7)
    : keys[keys.length - 1];
  if (!start || !end || start > end) return [];

  const out: { month: string; total: number }[] = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const monthsBack = (ey - y) * 12 + (em - m);
  if (monthsBack > 7) {
    // keep it readable: show the last 8 months only
    const d = new Date(Date.UTC(ey, em - 1, 1));
    d.setUTCMonth(d.getUTCMonth() - 7);
    y = d.getUTCFullYear();
    m = d.getUTCMonth() + 1;
  }
  while (y < ey || (y === ey && m <= em)) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push({ month: key, total: map.get(key) ?? 0 });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* attendance                                                          */
/* ------------------------------------------------------------------ */
export const ATT_MARK: Record<AttStatus, number> = { present: 1, late: 0.5, absent: 0 };

export const attendancePct = (state: AppState, studentId: string) => {
  const dates = Object.keys(state.attendance);
  if (!dates.length) return 0;
  let sum = 0;
  let n = 0;
  dates.forEach((d) => {
    const st = state.attendance[d]?.[studentId];
    if (st) {
      sum += ATT_MARK[st];
      n++;
    }
  });
  return n ? Math.round((sum / n) * 100) : 0;
};

export const lastSchoolDay = (state: AppState) => {
  const dates = Object.keys(state.attendance).sort();
  return dates.length ? dates[dates.length - 1] : todayISO();
};

export const attendanceForDate = (state: AppState, date: string) => {
  const rec = state.attendance[date] ?? {};
  const entries = Object.entries(rec);
  const present = entries.filter(([, v]) => v === "present").length;
  const late = entries.filter(([, v]) => v === "late").length;
  const absent = entries.filter(([, v]) => v === "absent").length;
  const total = entries.length;
  return { present, late, absent, total, rate: total ? Math.round(((present + late) / total) * 100) : 0 };
};

export const attendanceTrend = (state: AppState, days = 10) =>
  Object.keys(state.attendance)
    .sort()
    .slice(-days)
    .map((d) => ({ date: d, ...attendanceForDate(state, d) }));

/* ------------------------------------------------------------------ */
/* academics                                                           */
/* ------------------------------------------------------------------ */
export interface SubjectResult {
  subjectId: string;
  subject: string;
  classScore: number;
  examScore: number;
  total: number;
  grade: string;
  gradeRank: number;
  remark: string;
  tone: string;
}

export const resultsFor = (state: AppState, studentId: string): SubjectResult[] => {
  const student = studentById(state, studentId);
  if (!student) return [];
  const level = classById(state, student.classId)?.level ?? "Primary";
  const row = state.scores[studentId] ?? {};
  return subjectsFor(state, level)
    .filter((sub) => row[sub.id])
    .map((sub) => {
      const { class: c, exam: e } = row[sub.id];
      const total = c + e;
      const g = gradeFor(total, state.grading);
      return {
        subjectId: sub.id,
        subject: sub.name,
        classScore: c,
        examScore: e,
        total,
        grade: g.label,
        gradeRank: g.rank,
        remark: g.remark,
        tone: gradeBadge(g.tone),
      };
    });
};

export const averageOf = (results: SubjectResult[]) =>
  results.length ? Math.round(results.reduce((a, r) => a + r.total, 0) / results.length) : 0;

export const aggregateOf = (results: SubjectResult[]) =>
  [...results].sort((a, b) => a.gradeRank - b.gradeRank).slice(0, 6).reduce((a, r) => a + r.gradeRank, 0);

export const classRanking = (state: AppState, classId: string) => {
  const pupils = studentsOf(state, classId).map((s) => {
    const results = resultsFor(state, s.id);
    return { student: s, results, avg: averageOf(results), aggregate: aggregateOf(results) };
  });
  pupils.sort((a, b) => b.avg - a.avg);
  return pupils.map((p, i) => ({ ...p, position: i + 1 }));
};

export const rankOf = (state: AppState, studentId: string) => {
  const s = studentById(state, studentId);
  if (!s) return { position: 0, size: 0, avg: 0, aggregate: 0 };
  const ranking = classRanking(state, s.classId);
  const row = ranking.find((r) => r.student.id === studentId);
  return { position: row?.position ?? 0, size: ranking.length, avg: row?.avg ?? 0, aggregate: row?.aggregate ?? 0 };
};

export const subjectAverages = (state: AppState, classId: string) => {
  const cls = classById(state, classId);
  if (!cls) return [];
  const level = cls.level;
  return subjectsFor(state, level).map((sub) => {
    const totals = studentsOf(state, classId)
      .map((s) => state.scores[s.id]?.[sub.id])
      .filter(Boolean)
      .map((x) => x!.class + x!.exam);
    const avg = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
    return { subject: sub.name, subjectId: sub.id, avg };
  });
};

/* ------------------------------------------------------------------ */
/* school-wide stats                                                   */
/* ------------------------------------------------------------------ */
export const enrolment = (state: AppState) => {
  const map = new Map<string, number>();
  state.classes.forEach((c) => map.set(c.level, (map.get(c.level) ?? 0) + studentsOf(state, c.id).length));
  return map;
};

export const genderSplit = (state: AppState) => {
  const list = activeStudents(state);
  const girls = list.filter((s) => s.gender === "Female").length;
  return { girls, boys: list.length - girls, total: list.length };
};

export const termProgress = (state: AppState, today = new Date()) => {
  const term = currentTerm(state);
  if (!term?.start || !term?.end) {
    return { term: term ?? { id: "", name: "No term set", year: "", start: "", end: "" }, pct: 0, daysLeft: 0 };
  }
  const start = new Date(term.start + "T00:00:00Z").getTime();
  const end = new Date(term.end + "T00:00:00Z").getTime();
  const now = today.getTime();
  const pct = Math.max(0, Math.min(100, Math.round(((now - start) / Math.max(1, end - start)) * 100)));
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
  return { term, pct, daysLeft };
};

/** Setup checklist for a brand-new school. */
export const setupProgress = (state: AppState) => {
  const steps = [
    { id: "school", label: "School details", href: "/settings", done: Boolean(state.school.name) },
    { id: "classes", label: "Classes & streams", href: "/settings", done: state.classes.length > 0 },
    { id: "subjects", label: "Subjects", href: "/settings", done: state.subjects.length > 0 },
    { id: "term", label: "Term & fees", href: "/settings", done: state.terms.length > 0 && Object.values(state.feeByLevel).some((v) => v > 0) },
    { id: "staff", label: "Staff", href: "/staff", done: state.staff.length > 0 },
    { id: "pupils", label: "Admit pupils", href: "/students", done: state.students.length > 0 },
  ];
  return { steps, done: steps.filter((s) => s.done).length, total: steps.length };
};
