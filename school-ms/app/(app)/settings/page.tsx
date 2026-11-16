"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCheck, IconGrid, IconKey, IconPlus, IconSparkle, IconTrash, IconUsers, IconX, Logo } from "@/components/Icons";
import GradeScaleEditor from "@/components/GradeScaleEditor";
import { ChipEditor, Field, Select, TextInput } from "@/components/forms";
import { Avatar, Badge, Card, Empty, Modal, SectionCard } from "@/components/ui";
import { CURRENCIES } from "@/lib/blank";
import { classById, money, shortDate, studentsOf } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { Level, Role } from "@/lib/types";

const LEVELS: Level[] = ["Preschool", "Primary", "JHS"];

export default function SettingsPage() {
  const { state, persona, ready, setSchool, upsertClass, deleteClass, upsertSubject, deleteSubject, upsertTerm, deleteTerm, setCurrentTerm, setFee, startBlank, toast } = useApp();
  const [profile, setProfile] = useState(state.school);
  useEffect(() => {
    setProfile(state.school);
  }, [ready, state.school]);
  const [confirm, setConfirm] = useState<null | "blank">(null);
  const [newTerm, setNewTerm] = useState(false);
  const [termForm, setTermForm] = useState({ name: "", year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, start: "", end: "" });

  const levels = state.levels.length ? state.levels : LEVELS;

  if (ready && persona.role !== "admin")
    return (
      <div className="fade-in">
        <div className="page-head">
          <div>
            <h1 className="page-title">School setup</h1>
            <div className="page-sub">Administrators only</div>
          </div>
        </div>
        <Card className="card-pad">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
            <span style={{ width: 48, height: 48, borderRadius: 15, background: "#fff1e6", color: "#ea580c", display: "grid", placeItems: "center", flex: "none" }}>
              <IconGrid size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h2 style={{ fontSize: 19 }}>This area is for administrators</h2>
              <p style={{ fontSize: 13.5, color: "var(--muted)", fontWeight: 600, lineHeight: 1.55, marginTop: 8, maxWidth: 520 }}>
                School details, classes, subjects, terms, fees and the grading scale can only be changed by an
                administrator. You are previewing the {persona.role} view — switch back to Administrator in the top
                bar to make changes.
              </p>
              <Link href="/dashboard" className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>
                Back to dashboard
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">School setup</h1>
          <div className="page-sub">Everything here drives the rest of the system — rename, add or remove at any time</div>
        </div>
        <div className="head-actions">
          <span className="badge badge-green">
            <span className="dot" /> {state.classes.length} classes · {state.subjects.length} subjects · {state.terms.length} terms
          </span>
        </div>
      </div>

      <div className="grid g-2" style={{ marginBottom: 16 }}>
        <SectionCard title="School profile" sub="Appears on report cards, receipts and the parent portal">
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
            <Logo size={48} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{profile.name || "Your school"}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>{profile.motto || "Add a motto"}</div>
            </div>
          </div>
          <div className="form-grid">
            <Field label="School name" full>
              <TextInput value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="Short name">
              <TextInput value={profile.shortName} onChange={(e) => setProfile({ ...profile, shortName: e.target.value })} />
            </Field>
            <Field label="Head teacher">
              <TextInput value={profile.headTeacher} onChange={(e) => setProfile({ ...profile, headTeacher: e.target.value })} />
            </Field>
            <Field label="Motto" full>
              <TextInput value={profile.motto} onChange={(e) => setProfile({ ...profile, motto: e.target.value })} />
            </Field>
            <Field label="Address" full>
              <TextInput value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </Field>
            <Field label="Phone">
              <TextInput value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <TextInput value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </Field>
            <Field label="Currency">
              <Select
                value={profile.currencyCode}
                onChange={(code) => {
                  const c = CURRENCIES.find((x) => x.code === code)!;
                  setProfile({ ...profile, currencyCode: c.code, currencySymbol: c.symbol });
                }}
                options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.symbol}  ${c.label}` }))}
              />
            </Field>
            <Field label="Time zone">
              <TextInput value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSchool(profile);
                toast("School profile saved");
              }}
            >
              <IconCheck size={15} /> Save profile
            </button>
            <button className="btn btn-ghost" onClick={() => setProfile(state.school)}>Reset</button>
          </div>
        </SectionCard>

        <div className="grid" style={{ gap: 16, alignContent: "start" }}>
          <SectionCard title="Academic calendar" sub="The highlighted term is the current one">
            {state.terms.length === 0 && <Empty title="No terms yet" sub="Add your first term below." />}
            {state.terms.map((t) => {
              const active = t.id === state.currentTermId;
              return (
                <div key={t.id} className="list-row" style={{ alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => setCurrentTerm(t.id)}
                    title="Set as current term"
                    style={{
                      width: 26, height: 26, borderRadius: 9, flex: "none", display: "grid", placeItems: "center",
                      border: active ? "none" : "1.5px solid var(--line-2)",
                      background: active ? "var(--orange)" : "#fff", color: "#fff", cursor: "pointer",
                    }}
                  >
                    {active && <IconCheck size={13} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <TextInput
                      value={t.name}
                      onChange={(e) => upsertTerm({ ...t, name: e.target.value })}
                      style={{ padding: "5px 8px", fontWeight: 800, fontSize: 12.5, marginBottom: 4 }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <input className="input" type="date" value={t.start} onChange={(e) => upsertTerm({ ...t, start: e.target.value })} style={{ padding: "4px 7px", fontSize: 11.5 }} />
                      <input className="input" type="date" value={t.end} onChange={(e) => upsertTerm({ ...t, end: e.target.value })} style={{ padding: "4px 7px", fontSize: 11.5 }} />
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
                    onClick={() => {
                      deleteTerm(t.id);
                      toast("Term removed", "warn");
                    }}
                    aria-label={`Delete ${t.name}`}
                  >
                    <IconX size={13} />
                  </button>
                </div>
              );
            })}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => setNewTerm(true)}>
              <IconPlus size={14} /> Add term
            </button>
          </SectionCard>

          <SectionCard title="Fees per term" sub="Billed to every pupil in that level">
            <div className="grid g-3">
              {levels.map((l) => (
                <Field key={l} label={l}>
                  <TextInput
                    type="number"
                    value={String(state.feeByLevel[l] ?? 0)}
                    onChange={(e) => setFee(l, Number(e.target.value) || 0)}
                  />
                </Field>
              ))}
            </div>
            <div className="divider" />
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
              Total invoiced this term: {money(Object.entries(state.feeByLevel).reduce((a, [lvl, amt]) => a + amt * state.students.filter((s) => classById(state, s.classId)?.level === lvl && s.status === "Active").length, 0))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <SectionCard
          title="Classes & streams"
          sub="Edit any value — changes save instantly"
          right={
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                upsertClass({ name: "New class", level: levels[0] ?? "Primary", formTeacherId: null, capacity: 30, room: "" });
                toast("Class added — rename it below");
              }}
            >
              <IconPlus size={14} /> Add class
            </button>
          }
          bodyPad={false}
        >
          {state.classes.length === 0 ? (
            <div style={{ padding: "0 20px 18px" }}><Empty title="No classes yet" sub="Classes hold your pupils, registers and report cards." /></div>
          ) : (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ minWidth: 160 }}>Class name</th>
                    <th style={{ width: 156 }}>Level</th>
                    <th style={{ minWidth: 190 }}>Form teacher</th>
                    <th style={{ width: 100 }}>Capacity</th>
                    <th style={{ minWidth: 140 }}>Room</th>
                    <th style={{ width: 90 }}>Pupils</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {state.classes.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <TextInput
                          value={c.name}
                          onChange={(e) => upsertClass({ ...c, name: e.target.value })}
                          style={{ padding: "6px 9px", fontWeight: 800 }}
                        />
                      </td>
                      <td>
                        <Select
                          value={c.level}
                          onChange={(v) => upsertClass({ ...c, level: v as Level })}
                          options={levels.map((l) => ({ value: l, label: l }))}
                          style={{ paddingRight: 26, fontSize: 12.5 }}
                        />
                      </td>
                      <td>
                        <Select
                          value={c.formTeacherId ?? ""}
                          onChange={(v) => upsertClass({ ...c, formTeacherId: v || null })}
                          options={[{ value: "", label: "Not assigned" }, ...state.staff.map((s) => ({ value: s.id, label: s.name }))]}
                        />
                      </td>
                      <td>
                        <TextInput
                          type="number"
                          value={String(c.capacity)}
                          onChange={(e) => upsertClass({ ...c, capacity: Number(e.target.value) || 0 })}
                          style={{ padding: "6px 9px" }}
                        />
                      </td>
                      <td>
                        <TextInput value={c.room} onChange={(e) => upsertClass({ ...c, room: e.target.value })} style={{ padding: "6px 9px" }} />
                      </td>
                      <td>
                        <span className="badge badge-grey">{studentsOf(state, c.id).length}</span>
                      </td>
                      <td className="num-right">
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
                          onClick={() => {
                            deleteClass(c.id);
                            toast(`${c.name} deleted (and its pupils)`, "warn");
                          }}
                          aria-label={`Delete ${c.name}`}
                        >
                          <IconX size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid g-2" style={{ marginBottom: 16 }}>
        <SectionCard title="Subjects" sub="One list per level — these drive score entry and reports">
          {levels.map((level) => (
            <div key={level} style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 7 }}>{level}</div>
              <ChipEditor
                items={state.subjects.filter((s) => s.level === level).map((s) => ({ id: s.id, label: s.name }))}
                placeholder="Add a subject"
                onAdd={(name) => upsertSubject({ name, level })}
                onRemove={(id) => deleteSubject(id)}
                onEdit={(id, name) => {
                  const sub = state.subjects.find((s) => s.id === id);
                  if (sub) upsertSubject({ ...sub, name });
                }}
              />
            </div>
          ))}
        </SectionCard>

        <div className="grid" style={{ gap: 16, alignContent: "start" }}>
          <SectionCard title="Data" sub="This build stores everything in your browser">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <IconUsers size={14} /> {state.students.length} pupils · {state.staff.length} staff · {state.classes.length} classes
              </div>
              <div>· {state.payments.length} receipts · {Object.keys(state.attendance).length} attendance days</div>
              <div>· Setup {state.setupComplete ? "complete" : "incomplete"}</div>
            </div>
            <div className="divider" />
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)", borderColor: "#f7d4d1" }} onClick={() => setConfirm("blank")}>
                Clear all records
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted-2)", fontWeight: 700, marginTop: 10 }}>
              Everything lives in this browser only. Export a backup before clearing. Supabase schema lives in /supabase/migrations.
            </div>
          </SectionCard>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <AccessPanel />
      </div>

      <div style={{ marginBottom: 16 }}>
        <GradeScaleEditor />
      </div>

      <Card className="card-pad" style={{ background: "linear-gradient(110deg,#14161a,#23262d)", color: "#fff", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <IconSparkle size={22} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 15 }}>Ready for real data?</div>
            <div style={{ fontSize: 12.5, color: "#b9b3aa", fontWeight: 600, marginTop: 3 }}>
              Apply <code style={{ color: "#ffb27a" }}>supabase/migrations/0001_init.sql</code>, set your env vars, and this UI runs on live data.
            </div>
          </div>
          <span className="badge badge-orange" style={{ marginLeft: "auto" }}>Saved on this device</span>
        </div>
      </Card>

      <Modal
        open={newTerm}
        onClose={() => setNewTerm(false)}
        title="Add a term"
        width={480}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setNewTerm(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={() => {
                if (!termForm.name.trim() || !termForm.start || !termForm.end) return toast("Fill in the term name and dates", "warn");
                upsertTerm(termForm);
                setNewTerm(false);
                setTermForm({ name: "", year: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, start: "", end: "" });
                toast("Term added");
              }}
            >
              Add term
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Term name">
            <TextInput value={termForm.name} onChange={(e) => setTermForm({ ...termForm, name: e.target.value })} placeholder="Term 2" />
          </Field>
          <Field label="Academic year">
            <TextInput value={termForm.year} onChange={(e) => setTermForm({ ...termForm, year: e.target.value })} />
          </Field>
          <Field label="Starts">
            <TextInput type="date" value={termForm.start} onChange={(e) => setTermForm({ ...termForm, start: e.target.value })} />
          </Field>
          <Field label="Ends">
            <TextInput type="date" value={termForm.end} onChange={(e) => setTermForm({ ...termForm, end: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Start blank?"
        sub="Clears every record and reopens the setup wizard."
        width={460}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ background: "var(--red)", boxShadow: "none" }}
              onClick={() => {
                startBlank();
                toast("Cleared — starting fresh", "warn");
                setConfirm(null);
              }}
            >
              Clear everything
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
          Export anything you need first — this cannot be undone.
        </div>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* access — who can sign in                                            */
/* ------------------------------------------------------------------ */
function AccessPanel() {
  const { state, session, createLogin, resetLogin, revokeLogin, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ role: "teacher" as Role, name: "", login: "", staffId: "", guardianId: "" });
  const [issued, setIssued] = useState<{ login: string; key: string; name: string } | null>(null);

  const linkable = form.role === "teacher" ? state.staff : [];

  const submit = () => {
    const res = createLogin({
      role: form.role,
      name: form.name.trim() || (form.role === "admin" ? "Administrator" : "Staff member"),
      login: form.login,
      staffId: form.staffId || undefined,
      guardianId: form.guardianId || undefined,
    });
    if (!res.ok) return toast(res.error ?? "Could not create the login", "warn");
    setIssued({ login: form.login.trim().toLowerCase(), key: res.key ?? "", name: form.name.trim() || "New account" });
    setOpen(false);
    setForm({ role: "teacher", name: "", login: "", staffId: "", guardianId: "" });
  };

  return (
    <SectionCard
      title="Access & security keys"
      sub="Every person signs in with their own login — the login decides what they can see"
      right={
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
          <IconPlus size={14} /> New login
        </button>
      }
    >
      {issued && (
        <div
          style={{
            background: "#eafaf0", border: "1px solid #c7ecd6", borderRadius: 14, padding: "12px 14px", marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 900, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Copy this key now — it is shown once
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <code className="mono" style={{ fontSize: 16, fontWeight: 900, letterSpacing: "0.12em" }}>{issued.key}</code>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>for {issued.name} · {issued.login}</span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setIssued(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Person</th>
              <th>Login</th>
              <th>Can see</th>
              <th style={{ width: 190 }} />
            </tr>
          </thead>
          <tbody>
            {state.accounts.map((a) => (
              <tr key={a.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={a.name} size={28} />
                    <span style={{ fontWeight: 800 }}>
                      {a.name}
                      {a.id === session?.id && <span className="badge badge-orange" style={{ marginLeft: 8 }}>You</span>}
                    </span>
                  </div>
                </td>
                <td><code className="mono" style={{ fontSize: 12 }}>{a.login}</code></td>
                <td style={{ fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>
                  {a.role === "admin" ? "Everything, including setup" : a.role === "teacher" ? "Own classes & scores" : "Their children only"}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        const res = resetLogin(a.id);
                        if (res.ok) setIssued({ login: a.login, key: res.key ?? "", name: a.name });
                      }}
                    >
                      <IconKey size={14} /> Reset key
                    </button>
                    {a.id !== session?.id && (
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
                        onClick={() => {
                          revokeLogin(a.id);
                          toast("Login revoked", "warn");
                        }}
                      >
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {state.accounts.length === 0 && (
              <tr>
                <td colSpan={4}><Empty title="No logins yet" sub="Create one for each teacher and administrator." /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 11.5, color: "var(--muted-2)", fontWeight: 700, marginTop: 12 }}>
        Keys are stored hashed in this browser. Anyone who loses their key needs it reset from here — you cannot read it back.
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New login"
        sub="They sign in with this login and the key you generate."
        width={520}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>Create login</button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Who is this for">
            <Select
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v as Role })}
              options={[
                { value: "admin", label: "Administrator — everything" },
                { value: "teacher", label: "Teacher — own classes" },
                { value: "parent", label: "Parent — their children" },
              ]}
            />
          </Field>
          <Field label="Full name">
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mr. Kofi Boateng" />
          </Field>
          <Field label="Login (email, phone or username)" full>
            <TextInput value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} placeholder="kofi@school.edu" />
          </Field>
          {linkable.length > 0 && (
            <Field label="Link to a staff record" full hint="Optional — connects scores and classes to them">
              <Select
                value={form.staffId}
                onChange={(v) => setForm({ ...form, staffId: v })}
                options={[{ value: "", label: "Not linked" }, ...linkable.map((s) => ({ value: s.id, label: s.name }))]}
              />
            </Field>
          )}
        </div>
      </Modal>
    </SectionCard>
  );
}
