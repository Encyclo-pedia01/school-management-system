"use client";

import { useState } from "react";
import { IconMegaphone, IconPin, IconPlus, IconX } from "@/components/Icons";
import { Field, Select, TextInput } from "@/components/forms";
import { Avatar, Badge, Card, Empty, Modal, SectionCard } from "@/components/ui";
import { shortDate } from "@/lib/derive";
import { useApp } from "@/lib/store";
import type { Announcement } from "@/lib/types";

const AUD_TONE: Record<string, { badge: string; label: string }> = {
  all: { badge: "badge-orange", label: "Everyone" },
  parents: { badge: "badge-blue", label: "Parents" },
  staff: { badge: "badge-violet", label: "Staff" },
};

export default function AnnouncementsPage() {
  const { state, persona, upsertAnnouncement, deleteAnnouncement, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: string; title: string; body: string; audience: Announcement["audience"]; pinned: boolean }>({
    title: "",
    body: "",
    audience: "parents",
    pinned: false,
  });

  const canPost = persona.role === "admin" || persona.role === "teacher";

  const visible = state.announcements
    .filter((a) => (filter === "all" ? true : a.audience === filter))
    .filter((a) => (persona.role === "parent" ? a.audience !== "staff" : true))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));

  const submit = () => {
    if (!form.title.trim() || !form.body.trim()) return toast("Add a title and message", "warn");
    upsertAnnouncement(form);
    setForm({ title: "", body: "", audience: "parents", pinned: false });
    setOpen(false);
    toast(form.id ? "Announcement updated" : "Announcement sent");
  };

  const target = confirmId ? state.announcements.find((a) => a.id === confirmId) : null;

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Announcements</h1>
          <div className="page-sub">{state.announcements.length} notices · parents see them in their portal</div>
        </div>
        <div className="head-actions">
          <div className="chip-toggle">
            {[{ id: "all", label: "All" }, { id: "parents", label: "Parents" }, { id: "staff", label: "Staff" }].map((o) => (
              <button key={o.id} className={filter === o.id ? "on" : ""} onClick={() => setFilter(o.id)}>{o.label}</button>
            ))}
          </div>
          {canPost && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setForm({ title: "", body: "", audience: "parents", pinned: false });
                setOpen(true);
              }}
            >
              <IconPlus size={15} /> New announcement
            </button>
          )}
        </div>
      </div>

      <div className="grid g-dash">
        <div className="grid" style={{ gap: 14 }}>
          {visible.length === 0 && (
            <Card className="card-pad">
              <Empty title="No announcements yet" sub={canPost ? "Post a notice for parents or staff." : "Notices from the school appear here."} />
            </Card>
          )}
          {visible.map((a) => (
            <Card key={a.id} className="card-pad">
              <div style={{ display: "flex", gap: 12 }}>
                <span
                  style={{
                    width: 40, height: 40, borderRadius: 13, flex: "none", display: "grid", placeItems: "center",
                    background: a.pinned ? "#fff1e6" : "#f7f3ed", color: a.pinned ? "#ea580c" : "#948d84",
                  }}
                >
                  {a.pinned ? <IconPin size={17} /> : <IconMegaphone size={17} />}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 15.5 }}>{a.title}</h3>
                    <Badge tone={AUD_TONE[a.audience].badge}>{AUD_TONE[a.audience].label}</Badge>
                    {a.pinned && <span className="badge badge-amber">Pinned</span>}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, lineHeight: 1.55, marginTop: 6 }}>{a.body}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 11 }}>
                    <Avatar name={a.author} size={22} />
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--muted)" }}>{a.author}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted-2)" }}>· {shortDate(a.date)}</span>
                    {canPost && (
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setForm({ id: a.id, title: a.title, body: a.body, audience: a.audience, pinned: a.pinned });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--red)", borderColor: "#f7d4d1" }}
                          onClick={() => setConfirmId(a.id)}
                          aria-label={`Delete ${a.title}`}
                        >
                          <IconX size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid" style={{ gap: 16, alignContent: "start" }}>
          <SectionCard title="Delivery channels" sub="How families receive notices">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, fontWeight: 700 }}>
              <ChannelRow label="Parent portal" value="Always" tone="var(--green)" />
              <ChannelRow label="SMS to guardians" value="Critical notices" tone="var(--blue)" />
              <ChannelRow label="Email digest" value="Weekly" tone="var(--orange)" />
              <ChannelRow label="Notice board" value="Printed at reception" tone="var(--muted)" />
            </div>
            <div className="divider" />
            <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>
              In this build, announcements appear instantly in each persona&apos;s portal.
            </div>
          </SectionCard>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "Edit announcement" : "New announcement"}
        sub="Parents and staff see it immediately in their portals."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit}>
              <IconMegaphone size={15} /> {form.id ? "Save changes" : "Send announcement"}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Title" full>
            <TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Mid-term break" />
          </Field>
          <Field label="Message" full>
            <textarea className="textarea" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Dear parents, school will close on…" />
          </Field>
          <Field label="Audience">
            <Select
              value={form.audience}
              onChange={(v) => setForm({ ...form, audience: v as Announcement["audience"] })}
              options={[{ value: "parents", label: "Parents" }, { value: "staff", label: "Staff" }, { value: "all", label: "Everyone" }]}
            />
          </Field>
          <Field label="Pin to top">
            <Select
              value={form.pinned ? "yes" : "no"}
              onChange={(v) => setForm({ ...form, pinned: v === "yes" })}
              options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes — pin" }]}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!confirmId}
        onClose={() => setConfirmId(null)}
        title="Delete this announcement?"
        width={420}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>Keep</button>
            <button
              className="btn btn-primary"
              style={{ background: "var(--red)", boxShadow: "none" }}
              onClick={() => {
                if (confirmId) deleteAnnouncement(confirmId);
                toast("Announcement deleted", "warn");
                setConfirmId(null);
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>{target?.title}</div>
      </Modal>
    </div>
  );
}

function ChannelRow({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: 3, background: tone }} />
      <span>{label}</span>
      <span style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 11.5 }}>{value}</span>
    </div>
  );
}
