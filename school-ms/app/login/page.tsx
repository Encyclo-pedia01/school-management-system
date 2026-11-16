"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconArrowRight, IconCheck, IconX, Logo } from "@/components/Icons";
import { Field, TextInput } from "@/components/forms";
import { useApp } from "@/lib/store";

export default function LoginPage() {
  const { state, ready, session, signIn } = useApp();
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // already signed in? go straight in
  useEffect(() => {
    if (ready && session) router.replace("/dashboard");
  }, [ready, session, router]);

  useEffect(() => {
    if (ready && !state.setupComplete) router.replace("/setup");
  }, [ready, state.setupComplete, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = signIn(login, key);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not sign in");
      return;
    }
    setError("");
    router.replace("/dashboard");
  };

  return (
    <div className="login-wrap">
      <div className="login-art">
        <div className="login-brand">
          <Logo size={40} />
          <div>
            <div className="brand-name" style={{ color: "#fff" }}>{state.school.name || "Your school"}</div>
            <div className="brand-sub" style={{ color: "#b9b3aa" }}>{state.school.shortName || "Management system"}</div>
          </div>
        </div>

        <div>
          <h1 style={{ fontSize: 34, color: "#fff", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
            Sign in to your school.
          </h1>
          <p style={{ color: "#b9b3aa", fontSize: 14, fontWeight: 600, marginTop: 14, maxWidth: 380, lineHeight: 1.6 }}>
            Administrators, teachers and parents each have their own key. What you can see is decided by the
            account you sign in with — there is no role switch to get wrong.
          </p>
        </div>

        <div style={{ color: "#8d867d", fontSize: 12, fontWeight: 700 }}>
          {state.school.motto || "Learning with colour, growing with character"}
        </div>
      </div>

      <div className="login-form">
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div className="eyebrow">Welcome back</div>
          <h2 style={{ fontSize: 26, marginTop: 8 }}>Sign in</h2>

          <form onSubmit={submit} style={{ marginTop: 22 }}>
            <Field label="Email, phone or username">
              <TextInput
                value={login}
                onChange={(e) => {
                  setLogin(e.target.value);
                  setError("");
                }}
                placeholder="you@school.edu"
                autoComplete="username"
              />
            </Field>
            <div style={{ height: 12 }} />
            <Field label="Access key">
              <TextInput
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
              />
            </Field>

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

            <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: 18, justifyContent: "center" }} disabled={busy}>
              Sign in <IconArrowRight size={15} />
            </button>
          </form>

          <div style={{ marginTop: 16, fontSize: 12, color: "var(--muted)", fontWeight: 700, display: "flex", gap: 6, alignItems: "center" }}>
            <IconCheck size={13} /> Ask an administrator if you have lost your key.
          </div>

          <div style={{ marginTop: 22, fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>
            Setting up a new school? <Link href="/setup" style={{ color: "var(--orange-dk)" }}>Start setup</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
