"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconArrowRight, IconCheck, IconPlus, Logo } from "@/components/Icons";
import { ChipEditor, Field, Select, TextInput } from "@/components/forms";
import { CURRENCIES, DEFAULT_CLASS_NAMES, DEFAULT_SUBJECTS, EMPTY_SCHOOL, newId } from "@/lib/blank";
import { useApp } from "@/lib/store";
import type { Level } from "@/lib/types";

const ALL_LEVELS: { level: Level; label: string; blurb: string }[] = [
  { level: "Preschool", label: "Preschool / Early years", blurb: "Crèche, Nursery, KG" },
  { level: "Primary", label: "Primary", blurb: "Basic 1 – 6" },
  { level: "JHS", label: "Junior High", blurb: "JHS 1 – 3" },
];

const STEPS = ["School details", "Classes & levels", "Subjects", "Term & fees"];

export default function SetupPage() {
  const { state, completeSetup, ready } = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [school, setSchool] = useState({ ...EMPTY_SCHOOL });
  const [levels, setLevels] = useState<Level[]>(["Preschool", "Primary", "JHS"]);
  const [classMap, setClassMap] = useState<Record<string, { id: string; label: string }[]>>({
    Preschool: DEFAULT_CLASS_NAMES.Preschool.map((n) => ({ id: newId("n"), label: n })),
    Primary: DEFAULT_CLASS_NAMES.Primary.map((n) => ({ id: newId("n"), label: n })),
    JHS: DEFAULT_CLASS_NAMES.JHS.map((n) => ({ id: newId("n"), label: n })),
  });
  const [subjectMap, setSubjectMap] = useState<Record<string, { id: string; label: string }[]>>({
    Preschool: DEFAULT_SUBJECTS.Preschool.map((n) => ({ id: newId("n"), label: n })),
    Primary: DEFAULT_SUBJECTS.Primary.map((n) => ({ id: newId("n"), label: n })),
    JHS: DEFAULT_SUBJECTS.JHS.map((n) => ({ id: newId("n"), label: n })),
  });
  const [term, setTerm] = useState({
    name: "Term 1",
    year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    start: `${new Date().getFullYear()}-09-08`,
    end: `${new Date().getFullYear()}-12-18`,
  });
  const [fees, setFees] = useState<Record<string, string>>({ Preschool: "800", Primary: "950", JHS: "1200" });
  const [owner, setOwner] = useState({ name: "", login: "", key: "", confirm: "" });

  useEffect(() => {
    if (ready && state.setupComplete) router.replace("/dashboard");
  }, [ready, state.setupComplete, router]);

  const ownerReady =
    owner.login.trim().length >= 3 && owner.key.trim().length >= 6 && owner.key === owner.confirm;

  const canNext =
    step === 0
      ? Boolean(school.name.trim()) && ownerReady
      : step === 1
        ? levels.length > 0 && levels.every((l) => (classMap[l] ?? []).some((c) => c.label.trim()))
        : step === 2
          ? levels.every((l) => (subjectMap[l] ?? []).some((s) => s.label.trim()))
          : true;

  const finish = () => {
    completeSetup({
      school: { ...school, shortName: school.shortName || school.name.slice(0, 3).toUpperCase() },
      levels,
      classNames: levels.map((level) => ({ level, names: (classMap[level] ?? []).map((c) => c.label) })),
      subjects: levels.map((level) => ({ level, names: (subjectMap[level] ?? []).map((s) => s.label) })),
      term,
      fees: Object.fromEntries(levels.map((l) => [l, Number(fees[l]) || 0])),
      admin: { name: owner.name || school.headTeacher, login: owner.login, key: owner.key },
    });
    router.replace("/dashboard");
  };

  const toggleLevel = (l: Level) =>
    setLevels((cur) => (cur.includes(l) ? cur.filter((x) => x !== l) : [...cur, l]));

  return (
    <div className="login-wrap">
      <aside className="login-art">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <Logo size={40} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 15 }}>{school.name || "New school"}</div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8d8578", fontWeight: 800, marginTop: 2 }}>
                Setup
              </div>
            </div>
          </div>

          <h1 style={{ fontSize: 32, lineHeight: 1.15, marginTop: 44, letterSpacing: "-0.03em" }}>
            Four short steps and your school is ready.
          </h1>
          <p style={{ color: "#b9b3aa", fontSize: 13.5, fontWeight: 600, marginTop: 12, maxWidth: 380, lineHeight: 1.6 }}>
            Everything here is a starting point — rename classes, swap subjects and change fees at any time in School setup.
          </p>

          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 6 }}>
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div
                  key={s}
                  style={{
                    display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 13,
                    background: active ? "rgba(249,115,22,0.16)" : "transparent",
                    border: active ? "1px solid rgba(249,115,22,0.4)" : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      width: 24, height: 24, borderRadius: 99, display: "grid", placeItems: "center", flex: "none",
                      background: done ? "#f97316" : active ? "#fff" : "#2a2e35",
                      color: done ? "#fff" : active ? "#14161a" : "#8d8578",
                      fontSize: 11, fontWeight: 900,
                    }}
                  >
                    {done ? <IconCheck size={12} /> : i + 1}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: 13, color: active || done ? "#fff" : "#8d8578" }}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "#8d8578", fontWeight: 700 }}>
          No data is sent anywhere — this setup is stored in your browser until you connect a database.
        </div>
      </aside>

      <main className="login-form-side">
        <div className="login-card" style={{ maxWidth: 520 }}>
          {step === 0 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 24, letterSpacing: "-0.03em" }}>Tell us about the school</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600, marginTop: 6, marginBottom: 22 }}>
                This appears on report cards, receipts and the parent portal.
              </p>
              <div className="form-grid">
                <Field label="School name" full>
                  <TextInput
                    autoFocus
                    placeholder="e.g. Sunrise Basic School"
                    value={school.name}
                    onChange={(e) => setSchool({ ...school, name: e.target.value })}
                  />
                </Field>
                <Field label="Short name / initials">
                  <TextInput
                    placeholder="SBS"
                    value={school.shortName}
                    onChange={(e) => setSchool({ ...school, shortName: e.target.value })}
                  />
                </Field>
                <Field label="Head teacher">
                  <TextInput
                    placeholder="e.g. Mrs. Abena Mensah"
                    value={school.headTeacher}
                    onChange={(e) => setSchool({ ...school, headTeacher: e.target.value })}
                  />
                </Field>
                <Field label="Motto" full>
                  <TextInput
                    placeholder="Learning with character"
                    value={school.motto}
                    onChange={(e) => setSchool({ ...school, motto: e.target.value })}
                  />
                </Field>
                <Field label="Address" full>
                  <TextInput
                    placeholder="Street, area, city"
                    value={school.address}
                    onChange={(e) => setSchool({ ...school, address: e.target.value })}
                  />
                </Field>
                <Field label="Phone">
                  <TextInput placeholder="+233 …" value={school.phone} onChange={(e) => setSchool({ ...school, phone: e.target.value })} />
                </Field>
                <Field label="Email">
                  <TextInput placeholder="office@school.edu" value={school.email} onChange={(e) => setSchool({ ...school, email: e.target.value })} />
                </Field>
                <Field label="Currency" hint="Used for fees and receipts">
                  <Select
                    value={school.currencyCode}
                    onChange={(code) => {
                      const c = CURRENCIES.find((x) => x.code === code)!;
                      setSchool({ ...school, currencyCode: c.code, currencySymbol: c.symbol });
                    }}
                    options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol}  ${c.label}` }))}
                  />
                </Field>

                <div className="divider" style={{ gridColumn: "1 / -1" }} />
                <div className="eyebrow" style={{ gridColumn: "1 / -1" }}>Your administrator sign-in</div>
                <p style={{ gridColumn: "1 / -1", fontSize: 12, fontWeight: 600, color: "var(--muted)", marginTop: -4 }}>
                  This key is yours alone — it opens School setup and the administrator views. You can reset it later.
                </p>
                <Field label="Your name">
                  <TextInput
                    placeholder="e.g. Mrs. Adjoa Owusu"
                    value={owner.name}
                    onChange={(e) => setOwner({ ...owner, name: e.target.value })}
                  />
                </Field>
                <Field label="Sign-in (email or phone)">
                  <TextInput
                    placeholder="you@school.edu"
                    value={owner.login}
                    onChange={(e) => setOwner({ ...owner, login: e.target.value })}
                  />
                </Field>
                <Field label="Security key" hint="At least 6 characters">
                  <TextInput
                    type="password"
                    placeholder="••••••••"
                    value={owner.key}
                    onChange={(e) => setOwner({ ...owner, key: e.target.value })}
                  />
                </Field>
                <Field label="Confirm key">
                  <TextInput
                    type="password"
                    placeholder="••••••••"
                    value={owner.confirm}
                    onChange={(e) => setOwner({ ...owner, confirm: e.target.value })}
                  />
                </Field>
                {owner.confirm.length > 0 && owner.key !== owner.confirm && (
                  <div style={{ gridColumn: "1 / -1", fontSize: 11.5, fontWeight: 800, color: "var(--red)" }}>
                    Keys don&apos;t match yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 24, letterSpacing: "-0.03em" }}>Which levels do you run?</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600, marginTop: 6, marginBottom: 18 }}>
                We&apos;ll suggest class names — edit, add or remove any of them.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {ALL_LEVELS.map((l) => {
                  const on = levels.includes(l.level);
                  return (
                    <button
                      key={l.level}
                      onClick={() => toggleLevel(l.level)}
                      className="quick-action"
                      style={{ borderColor: on ? "var(--orange)" : "var(--line)", background: on ? "var(--orange-soft)" : "#fff" }}
                    >
                      <span
                        style={{
                          width: 22, height: 22, borderRadius: 7, display: "grid", placeItems: "center",
                          background: on ? "var(--orange)" : "#fff", border: on ? "none" : "1.5px solid var(--line-2)", color: "#fff",
                        }}
                      >
                        {on && <IconCheck size={12} />}
                      </span>
                      <span>
                        <span className="qa-t">{l.label}</span>
                        <span className="qa-s">{l.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {levels.map((level) => (
                <div key={level} style={{ marginBottom: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 7 }}>{level} classes</div>
                  <ChipEditor
                    items={classMap[level] ?? []}
                    placeholder="Add a class, e.g. Basic 7"
                    onAdd={(name) => setClassMap((m) => ({ ...m, [level]: [...(m[level] ?? []), { id: newId("n"), label: name }] }))}
                    onRemove={(id) => setClassMap((m) => ({ ...m, [level]: (m[level] ?? []).filter((c) => c.id !== id) }))}
                    onEdit={(id, name) =>
                      setClassMap((m) => ({ ...m, [level]: (m[level] ?? []).map((c) => (c.id === id ? { ...c, label: name } : c)) }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 24, letterSpacing: "-0.03em" }}>Subjects taught</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600, marginTop: 6, marginBottom: 18 }}>
                One list per level. These drive score entry and report cards.
              </p>
              {levels.map((level) => (
                <div key={level} style={{ marginBottom: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 7 }}>{level}</div>
                  <ChipEditor
                    items={subjectMap[level] ?? []}
                    placeholder="Add a subject"
                    onAdd={(name) => setSubjectMap((m) => ({ ...m, [level]: [...(m[level] ?? []), { id: newId("n"), label: name }] }))}
                    onRemove={(id) => setSubjectMap((m) => ({ ...m, [level]: (m[level] ?? []).filter((s) => s.id !== id) }))}
                    onEdit={(id, name) =>
                      setSubjectMap((m) => ({ ...m, [level]: (m[level] ?? []).map((s) => (s.id === id ? { ...s, label: name } : s)) }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 24, letterSpacing: "-0.03em" }}>Current term & fees</h2>
              <p style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600, marginTop: 6, marginBottom: 18 }}>
                You can add Term 2 and 3 later, and change fees any time.
              </p>
              <div className="form-grid">
                <Field label="Term name">
                  <TextInput value={term.name} onChange={(e) => setTerm({ ...term, name: e.target.value })} />
                </Field>
                <Field label="Academic year">
                  <TextInput value={term.year} onChange={(e) => setTerm({ ...term, year: e.target.value })} />
                </Field>
                <Field label="Starts">
                  <TextInput type="date" value={term.start} onChange={(e) => setTerm({ ...term, start: e.target.value })} />
                </Field>
                <Field label="Ends">
                  <TextInput type="date" value={term.end} onChange={(e) => setTerm({ ...term, end: e.target.value })} />
                </Field>
              </div>

              <div className="eyebrow" style={{ margin: "18px 0 8px" }}>Fees per term ({school.currencySymbol})</div>
              <div className="form-grid">
                {levels.map((l) => (
                  <Field key={l} label={l}>
                    <TextInput
                      type="number"
                      value={fees[l] ?? ""}
                      onChange={(e) => setFees({ ...fees, [l]: e.target.value })}
                      placeholder="0"
                    />
                  </Field>
                ))}
              </div>

              <div style={{ marginTop: 20, background: "var(--cream-2)", borderRadius: 14, padding: "12px 14px", fontSize: 12.5, fontWeight: 600, color: "var(--muted)" }}>
                <strong style={{ color: "var(--ink)" }}>Ready to go:</strong>{" "}
                {levels.reduce((a, l) => a + (classMap[l] ?? []).length, 0)} classes ·{" "}
                {levels.reduce((a, l) => a + (subjectMap[l] ?? []).length, 0)} subject lists · {term.name} {term.year}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
            {step > 0 && (
              <button className="btn btn-ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button className="btn btn-primary" style={{ marginLeft: "auto" }} disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Continue <IconArrowRight size={15} />
              </button>
            ) : (
              <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={finish}>
                <IconCheck size={15} /> Finish setup
              </button>
            )}
          </div>

          <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--muted-2)", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <IconPlus size={12} /> You can add pupils, staff and more once setup is done.
          </div>
        </div>
      </main>
    </div>
  );
}
