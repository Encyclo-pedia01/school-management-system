"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { IconPlus, IconSearch, IconUsers, IconX } from "@/components/Icons";
import { Field, Select, TextInput } from "@/components/forms";
import { Avatar, Badge, Card, Empty, Modal, SectionCard } from "@/components/ui";
import { attendancePct, balanceFor, classById, feeStatus, fullName, guardianOf, money, studentsOf } from "@/lib/derive";
import { useApp, type StudentInput } from "@/lib/store";

const HOUSES = ["Osei Tutu", "Yaa Asantewaa", "Anokye", "Akwamu"];

const emptyForm = (classId: string): StudentInput => ({
  firstName: "",
  lastName: "",
  gender: "Female",
  dob: "",
  classId,
  address: "",
  house: HOUSES[0],
  status: "Active",
  guardianName: "",
  guardianPhone: "",
  guardianEmail: "",
  guardianRelation: "Mother",
});

export default function StudentsPage() {
  const { state, persona, upsertStudent, deleteStudent, toast } = useApp();
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [gender, setGender] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StudentInput>(emptyForm(state.classes[0]?.id ?? ""));
  const [confirmId, setConfirmId] = useState<string | null>(null);

  /* the topbar search links here as /students?q=… — pick the term up on mount */
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("q");
    if (fromUrl) setQ(fromUrl);
  }, []);

  const allowedClasses = useMemo(
    () => (persona.role === "teacher" ? state.classes.filter((c) => persona.classIds.includes(c.id)) : state.classes),
    [state.classes, persona],
  );

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.students
      .filter((s) => s.status === "Active")
      .filter((s) => allowedClasses.some((c) => c.id === s.classId))
      .filter((s) => (classFilter === "all" ? true : s.classId === classFilter))
      .filter((s) => (gender === "all" ? true : s.gender === gender))
      .filter((s) =>
        !term
          ? true
          : fullName(s).toLowerCase().includes(term) ||
            s.admissionNo.toLowerCase().includes(term) ||
            (guardianOf(state, s)?.name.toLowerCase().includes(term) ?? false),
      )
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [state, q, classFilter, gender, allowedClasses]);

  const openAdd = () => {
    if (!state.classes.length) {
      toast("Create a class first in School setup", "warn");
      return;
    }
    setForm(emptyForm(classFilter !== "all" ? classFilter : state.classes[0].id));
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const s = state.students.find((x) => x.id === id);
    if (!s) return;
    const g = guardianOf(state, s);
    setForm({
      id: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender,
      dob: s.dob,
      classId: s.classId,
      address: s.address,
      house: s.house,
      status: s.status,
      guardianName: g?.name ?? "",
      guardianPhone: g?.phone ?? "",
      guardianEmail: g?.email ?? "",
      guardianRelation: g?.relation ?? "Guardian",
    });
    setOpen(true);
  };

  const submit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return toast("Enter the pupil's name", "warn");
    if (!form.classId) return toast("Choose a class", "warn");
    if (!form.guardianName.trim()) return toast("Enter a guardian name", "warn");
    upsertStudent(form);
    setOpen(false);
    toast(form.id ? `${form.firstName} updated` : `${form.firstName} ${form.lastName} admitted`);
  };

  const target = confirmId ? state.students.find((s) => s.id === confirmId) : null;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Students</h1>
          <div className="page-sub">
            {rows.length} shown · {state.students.filter((s) => s.status === "Active").length} on roll
            {state.classes.length ? "" : " · no classes yet"}
          </div>
        </div>
        <div className="head-actions">
          <Link href="/classes" className="btn btn-ghost">
            <IconUsers size={15} /> By class
          </Link>
          <button className="btn btn-primary" onClick={openAdd}>
            <IconPlus size={15} /> Add pupil
          </button>
        </div>
      </div>

      {state.students.length === 0 ? (
        <SectionCard title="No pupils yet" sub="Admit your first pupil to start building the register">
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
            {state.classes.length === 0 ? (
              persona.role === "admin" ? (
                <Link href="/settings" className="btn btn-primary btn-sm">Create classes first</Link>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>An administrator has to create classes first</span>
              )
            ) : (
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <IconPlus size={14} /> Admit your first pupil
              </button>
            )}
          </div>
          <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>
            Each admission creates the pupil record, links a guardian and opens a blank score sheet for their subjects.
          </div>
        </SectionCard>
      ) : (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div className="card-pad filter-bar">
              <div className="search" style={{ maxWidth: 340, flex: 1 }}>
                <IconSearch size={16} />
                <input placeholder="Name, admission no. or guardian…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>

              <select className="select" style={{ width: 175 }} value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                <option value="all">All classes</option>
                {allowedClasses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div className="chip-toggle">
                {[{ id: "all", label: "All" }, { id: "Female", label: "Girls" }, { id: "Male", label: "Boys" }].map((g) => (
                  <button key={g.id} className={gender === g.id ? "on" : ""} onClick={() => setGender(g.id)}>
                    {g.label}
                  </button>
                ))}
              </div>

              <span className="badge badge-orange" style={{ marginLeft: "auto" }}>{rows.length} results</span>
            </div>
          </Card>

          <Card>
            <div className="table-wrap">
              <table className="tbl stu-table">
                <thead>
                  <tr>
                    <th>Pupil</th>
                    <th>Class</th>
                    <th className="hide-sm">Gender</th>
                    <th className="hide-sm">Guardian</th>
                    <th>Fees</th>
                    <th className="hide-sm">Attendance</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 60).map((s) => {
                    const cls = classById(state, s.classId);
                    const g = guardianOf(state, s);
                    const status = feeStatus(state, s);
                    const bal = balanceFor(state, s);
                    const att = attendancePct(state, s.id);
                    return (
                      <tr key={s.id}>
                        <td>
                          <span className="cell-person">
                            <Avatar name={fullName(s)} size={34} />
                            <span>
                              <span className="nm">{fullName(s)}</span>
                              <span className="sm">{s.admissionNo}{s.house ? ` · ${s.house}` : ""}</span>
                            </span>
                          </span>
                        </td>
                        <td><span className="badge badge-grey">{cls?.name ?? "—"}</span></td>
                        <td className="hide-sm" style={{ fontWeight: 700, color: "var(--muted)" }}>{s.gender}</td>
                        <td className="hide-sm">
                          <div style={{ fontWeight: 800, fontSize: 12.5 }}>{g?.name ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{g?.phone}</div>
                        </td>
                        <td>
                          <Badge tone={status === "Paid" ? "badge-green" : status === "Part paid" ? "badge-amber" : "badge-red"}>
                            {status === "Paid" ? "Paid" : `${money(bal)} due`}
                          </Badge>
                        </td>
                        <td className="hide-sm">
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 110 }}>
                            <div style={{ flex: 1 }}>
                              <div className="progress" style={{ height: 6 }}>
                                <span style={{ width: `${att}%`, background: att >= 92 ? "var(--green)" : att >= 85 ? "var(--amber)" : "var(--red)" }} />
                              </div>
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--muted)" }}>{att}%</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s.id)}>Edit</button>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
                              onClick={() => setConfirmId(s.id)}
                              aria-label={`Delete ${fullName(s)}`}
                            >
                              <IconX size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <Empty title="No pupils match those filters" sub="Try clearing the search or picking another class." />}
            {rows.length > 60 && (
              <div style={{ padding: "12px 20px", fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
                Showing first 60 of {rows.length} — refine the filters to narrow down.
              </div>
            )}
          </Card>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit pupil" : "Admit a new pupil"}
        sub={form.id ? "Changes save straight to the register." : "Creates the pupil record, guardian link and a blank score sheet."}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>
              {form.id ? "Save changes" : <><IconPlus size={15} /> Admit pupil</>}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="First name">
            <TextInput value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Ama" />
          </Field>
          <Field label="Surname">
            <TextInput value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Mensah" />
          </Field>
          <Field label="Gender">
            <Select value={form.gender} onChange={(v) => setForm({ ...form, gender: v as "Male" })} options={[{ value: "Female", label: "Female" }, { value: "Male", label: "Male" }]} />
          </Field>
          <Field label="Date of birth">
            <TextInput type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </Field>
          <Field label="Class">
            <Select
              value={form.classId}
              onChange={(v) => setForm({ ...form, classId: v })}
              options={state.classes.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Field>
          <Field label="House / group" hint="Optional — leave blank if unused">
            <TextInput value={form.house} onChange={(e) => setForm({ ...form, house: e.target.value })} placeholder="e.g. Blue" />
          </Field>
          <Field label="Guardian name" full>
            <TextInput value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} placeholder="Mrs. Grace Boateng" />
          </Field>
          <Field label="Guardian phone">
            <TextInput value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} placeholder="+233 …" />
          </Field>
          <Field label="Relationship">
            <Select
              value={form.guardianRelation}
              onChange={(v) => setForm({ ...form, guardianRelation: v as "Mother" })}
              options={[{ value: "Mother", label: "Mother" }, { value: "Father", label: "Father" }, { value: "Guardian", label: "Guardian" }]}
            />
          </Field>
          <Field label="Guardian email">
            <TextInput value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} placeholder="parent@email.com" />
          </Field>
          <Field label="Residential area">
            <TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Area, town" />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as "Active" })}
              options={[{ value: "Active", label: "Active" }, { value: "Left", label: "Left / withdrawn" }]}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Remove this pupil?"
        sub="This also deletes their fee receipts and score entries. It cannot be undone."
        width={460}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Keep</button>
            <button
              className="btn btn-primary"
              style={{ background: "var(--red)", boxShadow: "none" }}
              onClick={() => {
                if (confirmId) deleteStudent(confirmId);
                toast(`${target ? fullName(target) : "Pupil"} removed`, "warn");
                setConfirmId(null);
              }}
            >
              Delete pupil
            </button>
          </>
        }
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {target && <Avatar name={fullName(target)} size={40} />}
          <div>
            <div style={{ fontWeight: 800 }}>{target ? fullName(target) : ""}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>
              {target ? `${classById(state, target.classId)?.name ?? "—"} · ${target.admissionNo}` : ""}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
