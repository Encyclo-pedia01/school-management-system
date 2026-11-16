"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCheckSquare, IconPlus, IconUsers, IconX } from "@/components/Icons";
import { Field, Select, TextInput } from "@/components/forms";
import { Avatar, Badge, Card, Empty, Modal, Progress, SectionCard } from "@/components/ui";
import { classRanking, fullName, lastSchoolDay, studentsOf, staffById } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { ClassRoom, Level } from "@/lib/types";

const LEVEL_TONE: Record<string, string> = { Preschool: "badge-violet", Primary: "badge-orange", JHS: "badge-blue" };
const LEVELS: Level[] = ["Preschool", "Primary", "JHS"];

export default function ClassesPage() {
  const { state, persona, upsertClass, deleteClass, toast } = useApp();
  const [level, setLevel] = useState("all");
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: string; name: string; level: Level; formTeacherId: string; capacity: string; room: string }>({
    name: "",
    level: state.levels[0] ?? "Primary",
    formTeacherId: "",
    capacity: "30",
    room: "",
  });
  const today = lastSchoolDay(state);

  const classes = state.classes
    .filter((c) => (persona.role === "teacher" ? persona.classIds.includes(c.id) : true))
    .filter((c) => (level === "all" ? true : c.level === level));

  const openAdd = () => {
    setForm({ name: "", level: state.levels[0] ?? "Primary", formTeacherId: "", capacity: "30", room: "" });
    setOpen(true);
  };

  const openEdit = (c: ClassRoom) => {
    setForm({
      id: c.id,
      name: c.name,
      level: c.level,
      formTeacherId: c.formTeacherId ?? "",
      capacity: String(c.capacity),
      room: c.room,
    });
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast("Give the class a name", "warn");
    upsertClass({
      id: form.id,
      name: form.name.trim(),
      level: form.level,
      formTeacherId: form.formTeacherId || null,
      capacity: Number(form.capacity) || 30,
      room: form.room,
    });
    setOpen(false);
    toast(form.id ? "Class updated" : `${form.name} created`);
  };

  const target = confirmId ? state.classes.find((c) => c.id === confirmId) : null;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Classes & streams</h1>
          <div className="page-sub">
            {state.classes.length} classes · {state.students.filter((s) => s.status === "Active").length} pupils enrolled
          </div>
        </div>
        <div className="head-actions">
          <div className="chip-toggle">
            {[{ id: "all", label: "All" }, ...LEVELS.map((l) => ({ id: l, label: l }))].map((o) => (
              <button key={o.id} className={level === o.id ? "on" : ""} onClick={() => setLevel(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          {persona.role === "admin" && (
            <button className="btn btn-primary" onClick={openAdd}>
              <IconPlus size={15} /> New class
            </button>
          )}
        </div>
      </div>

      {state.classes.length === 0 ? (
        <SectionCard title="No classes yet" sub="Classes (streams) are the backbone — pupils, registers and report cards all hang off them">
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <IconPlus size={14} /> Create your first class
          </button>
        </SectionCard>
      ) : (
        <div className="grid g-3">
          {classes.map((c) => {
            const pupils = studentsOf(state, c.id);
            const teacher = c.formTeacherId ? staffById(state, c.formTeacherId) : undefined;
            const rec = state.attendance[today] ?? {};
            const marked = pupils.filter((p) => rec[p.id]).length;
            const present = pupils.filter((p) => rec[p.id] === "present" || rec[p.id] === "late").length;
            const attRate = marked ? Math.round((present / marked) * 100) : 0;
            const ranking = classRanking(state, c.id);
            const avg = ranking.length ? Math.round(ranking.reduce((a, r) => a + r.avg, 0) / ranking.length) : 0;
            const fill = Math.round((pupils.length / Math.max(1, c.capacity)) * 100);
            const top = ranking[0];

            return (
              <Card key={c.id} className="card-pad">
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(140deg,#fff1e6,#ffe3cd)", display: "grid", placeItems: "center", color: "#ea580c", fontWeight: 900, fontSize: 13 }}>
                    {(c.name.match(/\d+/) ?? [c.name.slice(0, 2).toUpperCase()])[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 15.5 }}>{c.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700, marginTop: 2 }}>{c.room || c.level}</div>
                  </div>
                  <span className={`badge ${LEVEL_TONE[c.level] ?? "badge-grey"}`} style={{ marginLeft: "auto" }}>{c.level}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, fontWeight: 700, color: "var(--muted)" }}>
                  <Avatar name={teacher?.name ?? "?"} size={22} />
                  {teacher?.name ?? "No form teacher"}
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800, marginBottom: 5 }}>
                    <span style={{ color: "var(--muted)" }}>Enrolment · capacity {c.capacity}</span>
                    <span>{pupils.length} pupils</span>
                  </div>
                  <Progress pct={fill} color={fill > 95 ? "var(--red)" : "linear-gradient(90deg,#f97316,#ea580c)"} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 13 }}>
                  <div style={{ background: "var(--cream-2)", borderRadius: 12, padding: "8px 11px" }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: "var(--muted)" }}>Present (last day)</div>
                    <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2, color: attRate >= 90 ? "var(--green)" : "var(--amber)" }}>
                      {marked ? `${attRate}%` : "—"}
                      <span style={{ fontSize: 10.5, color: "var(--muted-2)", fontWeight: 800 }}> {present}/{marked}</span>
                    </div>
                  </div>
                  <div style={{ background: "var(--cream-2)", borderRadius: 12, padding: "8px 11px" }}>
                    <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800, color: "var(--muted)" }}>Class average</div>
                    <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2, color: "var(--blue)" }}>{avg}%</div>
                  </div>
                </div>

                {top && (
                  <div style={{ marginTop: 11, fontSize: 11.5, fontWeight: 700, color: "var(--muted)" }}>
                    Top pupil: <span style={{ color: "var(--ink)", fontWeight: 800 }}>{fullName(top.student)}</span> ({top.avg}%)
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <Link href="/students" className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                    <IconUsers size={13} /> Pupils
                  </Link>
                  <Link href="/attendance" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    <IconCheckSquare size={13} /> Register
                  </Link>
                </div>

                {persona.role === "admin" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(c)}>Edit</button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
                      onClick={() => setConfirmId(c.id)}
                      aria-label={`Delete ${c.name}`}
                    >
                      <IconX size={13} />
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {classes.length === 0 && state.classes.length > 0 && <Empty title="No classes at this level" sub="Pick another level filter." />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit class" : "New class"}
        sub="Capacity is only used for the enrolment bar."
        width={520}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>{form.id ? "Save changes" : "Create class"}</button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Class name" full>
            <TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Basic 4 or JHS 2B" autoFocus />
          </Field>
          <Field label="Level">
            <Select
              value={form.level}
              onChange={(v) => setForm({ ...form, level: v as Level })}
              options={(state.levels.length ? state.levels : LEVELS).map((l) => ({ value: l, label: l }))}
            />
          </Field>
          <Field label="Capacity">
            <TextInput type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </Field>
          <Field label="Form teacher" full>
            <Select
              value={form.formTeacherId}
              onChange={(v) => setForm({ ...form, formTeacherId: v })}
              options={[{ value: "", label: "Not assigned" }, ...state.staff.map((s) => ({ value: s.id, label: `${s.name} — ${s.role}` }))]}
            />
          </Field>
          <Field label="Room / block" full>
            <TextInput value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="e.g. Block B · 14" />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title={`Delete ${target?.name ?? "class"}?`}
        sub="Pupils in this class will also be removed. Move them to another class first if you want to keep them."
        width={460}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Keep</button>
            <button
              className="btn btn-primary"
              style={{ background: "var(--red)", boxShadow: "none" }}
              onClick={() => {
                if (confirmId) deleteClass(confirmId);
                toast(`${target?.name ?? "Class"} deleted`, "warn");
                setConfirmId(null);
              }}
            >
              Delete class
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>
          {target ? `${studentsOf(state, target.id).length} pupils are currently in this class.` : ""}
        </div>
      </Modal>
    </div>
  );
}
