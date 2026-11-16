"use client";

import Link from "next/link";
import { useState } from "react";
import { IconCheck, IconX } from "@/components/Icons";
import { Field, TextInput } from "@/components/forms";
import { Card, SectionCard } from "@/components/ui";
import { useApp } from "@/lib/store";

export default function AccountPage() {
  const { session, persona, changeOwnKey, toast } = useApp();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (next !== confirm) return setError("The new keys don't match");
    if (next.trim().length < 6) return setError("Use at least 6 characters");
    const res = changeOwnKey(current, next);
    if (!res.ok) return setError(res.error ?? "Could not change the key");
    setError("");
    setCurrent("");
    setNext("");
    setConfirm("");
    toast("Access key updated");
  };

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <h1 className="page-title">Your account</h1>
          <div className="page-sub">Sign-in details for {persona.name}</div>
        </div>
      </div>

      <div className="grid g-2">
        <SectionCard title="Change your access key" sub="You'll use this key the next time you sign in">
          <div className="form-grid">
            <Field label="Current key" full>
              <TextInput type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
            </Field>
            <Field label="New key">
              <TextInput type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 6 characters" />
            </Field>
            <Field label="Confirm new key">
              <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat it" />
            </Field>
          </div>
          {error && (
            <div
              style={{
                marginTop: 12, background: "#fdecea", color: "#b3261e", border: "1px solid #f7d4d1",
                borderRadius: 12, padding: "9px 12px", fontSize: 12.5, fontWeight: 800,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <IconX size={14} /> {error}
            </div>
          )}
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit}>
            <IconCheck size={15} /> Update key
          </button>
        </SectionCard>

        <Card className="card-pad">
          <div className="eyebrow">Signed in as</div>
          <h2 style={{ fontSize: 20, marginTop: 8 }}>{persona.name}</h2>
          <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 700, marginTop: 6 }}>
            {persona.title}
          </div>
          <div className="divider" />
          <div style={{ display: "grid", gap: 8, fontSize: 12.5, fontWeight: 700 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: "var(--muted)", width: 70 }}>Login</span>
              <code className="mono">{session?.login}</code>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: "var(--muted)", width: 70 }}>Role</span>
              <span style={{ textTransform: "capitalize" }}>{persona.role}</span>
            </div>
          </div>
          <div className="divider" />
          <div style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700, lineHeight: 1.55 }}>
            Lost your key? An administrator can reset any account from{" "}
            <Link href="/settings" style={{ color: "var(--orange-dk)" }}>School setup → Access</Link>. When Supabase is
            connected, sign-in moves to Supabase Auth and this screen is replaced.
          </div>
        </Card>
      </div>
    </div>
  );
}
