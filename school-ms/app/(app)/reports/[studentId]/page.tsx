"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { IconChevronRight, IconPrint, Logo } from "@/components/Icons";
import { Badge, Card, Empty } from "@/components/ui";
import {
  attendancePct,
  classById,
  currentTerm,
  fullName,
  guardianOf,
  rankOf,
  resultsFor,
  shortDate,
  staffById,
} from "@/lib/derive";

import { useApp } from "@/lib/store";

const remarkFor = (avg: number) => {
  if (avg >= 80) return "An outstanding term. Keep up the excellent work and continue to lead the class by example.";
  if (avg >= 70) return "A very good term's work. A little more consistency in the weaker subjects and an excellent result is within reach.";
  if (avg >= 60) return "A good, steady performance. More attention to homework and revision will lift the weaker subjects.";
  if (avg >= 50) return "A fair performance. Improvement is needed in several subjects; extra reading at home is strongly encouraged.";
  return "This term's results are below expectation. Please meet the form teacher to agree a support plan for next term.";
};

const headRemarkFor = (avg: number, pos: number, size: number) => {
  if (avg >= 75) return `Congratulations. Placed ${pos} of ${size} — a credit to the school. We look forward to another strong term.`;
  if (avg >= 60) return `A commendable effort, placed ${pos} of ${size}. With focus on the weaker subjects this can become a distinction.`;
  return `Placed ${pos} of ${size}. The school will work with the family to strengthen foundations next term.`;
};

export default function ReportCardPage() {
  const params = useParams<{ studentId: string }>();
  const { state } = useApp();
  const student = state.students.find((s) => s.id === params.studentId);
  const term = currentTerm(state);
  const school = state.school;

  if (!student) {
    return (
      <Card className="card-pad">
        <h3>Report card not found</h3>
        <Link href="/reports" className="btn btn-ghost" style={{ marginTop: 12 }}>Back to reports</Link>
      </Card>
    );
  }

  const cls = classById(state, student.classId);
  const results = resultsFor(state, student.id);
  const rank = rankOf(state, student.id);
  const att = attendancePct(state, student.id);
  const formTeacher = cls?.formTeacherId ? staffById(state, cls.formTeacherId) : undefined;
  const guardian = guardianOf(state, student);
  const daysPresent = Math.round((att / 100) * Object.keys(state.attendance).length);
  const nextTerm = state.terms.find((t) => t.id !== state.currentTermId && t.start > (term?.start ?? ""));

  return (
    <div className="fade-in">
      <div className="page-head no-print">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>
            <Link href="/dashboard">Dashboard</Link>
            <IconChevronRight size={13} />
            <Link href="/reports">Report cards</Link>
            <IconChevronRight size={13} />
            <span style={{ color: "var(--ink)" }}>{fullName(student)}</span>
          </div>
          <h1 className="page-title">Termly report card</h1>
          <div className="page-sub">{cls?.name ?? "—"} · {term ? `${term.name} · ${term.year}` : "No term"}</div>
        </div>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={() => window.print()}>
            <IconPrint size={15} /> Print / save PDF
          </button>
        </div>
      </div>

      <div className="report-stage">
        <div className="report-sheet">
          {/* ---------------------------------------------------------- header */}
          <div className="report-head">
            <Logo size={50} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="report-title">{school.name || "Your school"}</div>
              <div className="report-sub">
                {[school.address, school.phone, school.email].filter(Boolean).join("  ·  ") || "School address"}
              </div>
              {school.motto && <div className="report-motto">{school.motto.toUpperCase()}</div>}
            </div>
            <div className="report-stamp">
              <strong>Termly report</strong>
              {term ? `${term.name} · ${term.year}` : "No term set"}
            </div>
          </div>

          {/* ---------------------------------------------------------- facts */}
          <div className="report-meta">
            <div><div className="k">Pupil</div><div className="v">{fullName(student)}</div></div>
            <div><div className="k">Class</div><div className="v">{cls?.name ?? "—"}</div></div>
            <div><div className="k">Admission no.</div><div className="v">{student.admissionNo}</div></div>
            <div><div className="k">Attendance</div><div className="v">{att}% · {daysPresent} day{daysPresent === 1 ? "" : "s"}</div></div>
            <div><div className="k">Position in class</div><div className="v">{rank.size ? `${rank.position} of ${rank.size}` : "—"}</div></div>
            <div><div className="k">Term average</div><div className="v">{results.length ? `${rank.avg}%` : "—"}</div></div>
            <div><div className="k">Aggregate (best 6)</div><div className="v">{results.length ? rank.aggregate : "—"}</div></div>
            <div><div className="k">Re-opening</div><div className="v">{nextTerm ? shortDate(nextTerm.start) : term ? `After ${shortDate(term.end)}` : "—"}</div></div>
          </div>

          {/* ---------------------------------------------------------- marks */}
          {results.length ? (
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: "31%" }}>Subject</th>
                  <th style={{ textAlign: "right", width: "14%" }}>Class (30)</th>
                  <th style={{ textAlign: "right", width: "14%" }}>Exam (70)</th>
                  <th style={{ textAlign: "right", width: "14%" }}>Total (100)</th>
                  <th style={{ textAlign: "center", width: "9%" }}>Grade</th>
                  <th style={{ width: "18%" }}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.subjectId}>
                    <td style={{ fontWeight: 800 }}>{r.subject}</td>
                    <td className="num">{r.classScore}</td>
                    <td className="num">{r.examScore}</td>
                    <td className="num">{r.total}</td>
                    <td className="grade-cell">{r.grade}</td>
                    <td style={{ fontWeight: 600, color: "#6b6a66" }}>{r.remark}</td>
                  </tr>
                ))}
                <tr className="report-total">
                  <td>TOTAL / AVERAGE</td>
                  <td className="num">{results.reduce((a, r) => a + r.classScore, 0)}</td>
                  <td className="num">{results.reduce((a, r) => a + r.examScore, 0)}</td>
                  <td className="num" style={{ color: "#ea580c" }}>{rank.avg}%</td>
                  <td colSpan={2} style={{ fontSize: "7.5pt" }}>
                    Aggregate {rank.aggregate} · Position {rank.position} of {rank.size}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <Empty title="No scores recorded yet" sub="Enter scores on the exams page and this report fills in automatically." />
          )}

          {/* ---------------------------------------------------------- remarks */}
          <div className="report-remarks">
            <div className="report-remark">
              <div className="eyebrow2">Class teacher&apos;s remark</div>
              <p>{results.length ? remarkFor(rank.avg) : "Comments appear once scores are entered."}</p>
              <div className="sign">{formTeacher?.name ?? "Form Teacher"} · signature</div>
            </div>
            <div className="report-remark">
              <div className="eyebrow2">Head teacher&apos;s remark</div>
              <p>{results.length ? headRemarkFor(rank.avg, rank.position, rank.size) : "—"}</p>
              <div className="sign">{school.headTeacher || "Head Teacher"} · signature</div>
            </div>
          </div>

          {/* ---------------------------------------------------------- conduct */}
          <div className="report-hands">
            {[
              { k: "Conduct" },
              { k: "Attitude to work" },
              { k: "Interest / hobbies" },
            ].map((f) => (
              <div key={f.k}>
                <div className="eyebrow2">{f.k}</div>
                <div className="line" />
              </div>
            ))}
          </div>

          {/* ---------------------------------------------------------- grading key */}
          <div className="report-key">
            <span style={{ fontWeight: 900, color: "#14161a" }}>GRADING</span>
            {[...(state.grading ?? [])]
              .sort((a, b) => b.min - a.min)
              .map((b) => (
                <span key={b.id}>
                  {b.label} · {(b.remark || "—").trim()} · {b.min}+
                </span>
              ))}
          </div>

          <div style={{ flex: 1, minHeight: "6mm" }} />

          <div className="report-sign-row">
            <div>Class teacher&apos;s signature</div>
            <div>Head teacher&apos;s signature</div>
            <div>Parent / guardian&apos;s signature</div>
          </div>

          {/* ---------------------------------------------------------- footer */}
          <div className="report-foot">
            <span>
              {school.name || "School"}
              {guardian ? ` · Guardian: ${guardian.name}` : ""} · generated {shortDate(new Date().toISOString().slice(0, 10))}
            </span>
            <span>{nextTerm ? `Next term begins ${shortDate(nextTerm.start)}` : term ? `Term ends ${shortDate(term.end)}` : ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
