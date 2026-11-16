"use client";

import { useMemo, useState } from "react";
import { IconMail, IconPhone, IconPlus, IconSearch, IconUsers, IconX } from "@/components/Icons";
import { Field, Select, TextInput } from "@/components/forms";
import { Avatar, Badge, Card, Empty, Modal, SectionCard, StatCard } from "@/components/ui";
import { classById } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { Staff } from "@/lib/types";

export default function StaffPage() {
  const { state, upsertStaff, deleteStaff, toast } = useApp();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: string; name: string; role: string; department: string; email: string; phone: string; status: Staff["status"]; classIds: string[] }>({
    name: "",
    role: "",
    department: "Teaching",
    email: "",
    phone: "",
    status: "Active",
    classIds: [],
  });

  const depts = [...new Set(state.staff.map((s) => s.department))];
  const rows = useMemo(
    () =>
      state.staff
        .filter((s) => (dept === "all" ? true : s.department === dept))
        .filter((s) => (q ? (s.name + s.role + s.department).toLowerCase().includes(q.toLowerCase()) : true))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [state.staff, q, dept],
  );

  const teaching = state.staff.filter((s) => s.department !== "Administration" && s.department !== "Support").length;
  const pupils = state.students.filter((s) => s.status === "Active").length;

  const openAdd = () => {
    setForm({ name: "", role: "", department: depts[0] ?? "Teaching", email: "", phone: "", status: "Active", classIds: [] });
    setOpen(true);
  };

  const openEdit = (s: Staff) => {
    setForm({ id: s.id, name: s.name, role: s.role, department: s.department, email: s.email, phone: s.phone, status: s.status, classIds: s.classIds });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast("Enter the staff member's name", "warn");
    upsertStaff({
      id: form.id,
      name: form.name.trim(),
      role: form.role || "Teacher",
      department: form.department || "Teaching",
      email: form.email,
      phone: form.phone,
      status: form.status,
      classIds: form.classIds,
    });
    setOpen(false);
    toast(form.id ? "Staff record updated" : `${form.name} added to staff`);
  };

  const target = confirmId ? state.staff.find((s) => s.id === confirmId) : null;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Staff</h1>
          <div className="page-sub">
            {state.staff.length} on roll · {teaching} teaching · {state.staff.length - teaching} admin & support
          </div>
        </div>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={openAdd}>
            <IconPlus size={15} /> Add staff
          </button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 16 }}>
        <StatCard label="Total staff" value={state.staff.length} icon={<IconUsers size={17} />} trendLabel="Full establishment" />
        <StatCard label="Teaching staff" value={teaching} icon={<IconUsers size={17} />} tone="#2563eb" soft="#eaf1ff" trendLabel={`${depts.length} departments`} />
        <StatCard
          label="Pupil : teacher"
          value={teaching ? Math.round(pupils / teaching) : 0}
          suffix=" : 1"
          icon={<IconUsers size={17} />}
          tone="#7c3aed"
          soft="#f2ecfe"
          trendLabel="Across the school"
        />
        <StatCard label="On leave" value={state.staff.filter((s) => s.status !== "Active").length} icon={<IconPhone size={17} />} tone="#d97706" soft="#fef4e2" trendLabel="Cover to arrange" />
      </div>

      {state.staff.length === 0 ? (
        <SectionCard title="No staff yet" sub="Add teachers, then assign them as form teachers on the classes page">
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <IconPlus size={14} /> Add your first staff member
          </button>
        </SectionCard>
      ) : (
        <>
          <Card style={{ marginBottom: 14 }}>
            <div className="card-pad filter-bar">
              <div className="search" style={{ maxWidth: 320, flex: 1 }}>
                <IconSearch size={16} />
                <input placeholder="Search staff or role…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <div className="chip-toggle">
                {[{ id: "all", label: "All" }, ...depts.map((d) => ({ id: d, label: d }))].map((o) => (
                  <button key={o.id} className={dept === o.id ? "on" : ""} onClick={() => setDept(o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Staff member</th>
                    <th>Department</th>
                    <th>Classes</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="cell-person">
                          <Avatar name={s.name} size={34} />
                          <span>
                            <span className="nm">{s.name}</span>
                            <span className="sm">{s.role}</span>
                          </span>
                        </div>
                      </td>
                      <td><span className="badge badge-grey">{s.department}</span></td>
                      <td style={{ fontWeight: 700, fontSize: 12.5 }}>
                        {s.classIds.length ? s.classIds.map((id) => classById(state, id)?.name).filter(Boolean).join(", ") : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><IconMail size={12} /> {s.email || "—"}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><IconPhone size={12} /> {s.phone || "—"}</span>
                        </div>
                      </td>
                      <td><Badge tone={s.status === "Active" ? "badge-green" : "badge-amber"}>{s.status}</Badge></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
                            onClick={() => setConfirmId(s.id)}
                            aria-label={`Delete ${s.name}`}
                          >
                            <IconX size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <Empty title="No staff found" sub="Try a different department or search term." />}
          </Card>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit staff member" : "Add a staff member"}
        sub="Assign classes to give a teacher access to their registers and score sheets."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{form.id ? "Save changes" : "Add staff"}</button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Full name" full>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mr. Kwame Osei" autoFocus />
          </Field>
          <Field label="Role / title">
            <TextInput value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Class Teacher" />
          </Field>
          <Field label="Department">
            <TextInput value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Upper Primary" list="depts" />
          </Field>
          <Field label="Email">
            <TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@school.edu" />
          </Field>
          <Field label="Phone">
            <TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+233 …" />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v as Staff["status"] })}
              options={[{ value: "Active", label: "Active" }, { value: "On leave", label: "On leave" }]}
            />
          </Field>
          <div className="field full">
            <label>Classes</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {state.classes.length === 0 && (
                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 700 }}>No classes created yet.</span>
              )}
              {state.classes.map((c) => {
                const on = form.classIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        classIds: on ? form.classIds.filter((x) => x !== c.id) : [...form.classIds, c.id],
                      })
                    }
                    className="badge"
                    style={{
                      background: on ? "var(--orange)" : "#fff",
                      color: on ? "#fff" : "var(--muted)",
                      border: `1px solid ${on ? "var(--orange)" : "var(--line-2)"}`,
                      cursor: "pointer",
                      fontSize: 11.5,
                      padding: "5px 10px",
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Remove this staff member?"
        sub="They will be unassigned from any classes they lead."
        width={440}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Keep</button>
            <button
              className="btn btn-primary"
              style={{ background: "var(--red)", boxShadow: "none" }}
              onClick={() => {
                if (confirmId) deleteStaff(confirmId);
                toast(`${target?.name ?? "Staff"} removed`, "warn");
                setConfirmId(null);
              }}
            >
              Remove
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
          {target ? `${target.name} — ${target.role}` : ""}
        </div>
      </Modal>
    </div>
  );
}
