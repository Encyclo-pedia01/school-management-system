"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { buildBlankState, newId } from "./blank";
import { sanitiseState } from "./sanitise";
import { hashKey, generateKey, normaliseLogin } from "./auth";
import { setCurrencySymbol } from "./derive";
import { DEFAULT_GRADE_BANDS, normaliseBands, setGradeBands } from "./grading";
import type {
  Account,
  Announcement,
  AppState,
  AttStatus,
  ClassRoom,
  GradeBand,
  Guardian,
  Level,
  Persona,
  Role,
  SchoolProfile,
  Staff,
  Student,
  Subject,
  Term,
} from "./types";

const KEY = "school-ms-state-v1";

interface Toast {
  id: number;
  title: string;
  tone: "success" | "info" | "warn";
}

export interface SetupPayload {
  school: SchoolProfile;
  levels: Level[];
  classNames: { level: Level; names: string[] }[];
  subjects: { level: Level; names: string[] }[];
  term: { name: string; year: string; start: string; end: string };
  fees: Record<string, number>;
  /** the owner's own sign-in — created during setup */
  admin: { name: string; login: string; key: string };
}

export interface StudentInput {
  id?: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female";
  dob: string;
  classId: string;
  address: string;
  house: string;
  status: "Active" | "Left";
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  guardianRelation: "Mother" | "Father" | "Guardian";
}

interface Ctx {
  state: AppState;
  persona: Persona;
  ready: boolean;
  /* setup */
  completeSetup: (p: SetupPayload) => void;
  startBlank: () => void;
  /* school */
  setSchool: (patch: Partial<SchoolProfile>) => void;
  /* structure */
  upsertClass: (c: Omit<ClassRoom, "id"> & { id?: string }) => void;
  deleteClass: (id: string) => void;
  upsertSubject: (s: { id?: string; name: string; level: Level }) => void;
  deleteSubject: (id: string) => void;
  upsertTerm: (t: Omit<Term, "id"> & { id?: string }) => void;
  deleteTerm: (id: string) => void;
  setCurrentTerm: (id: string) => void;
  setFee: (level: string, amount: number) => void;
  setGrading: (bands: GradeBand[]) => void;
  /* people */
  upsertStudent: (input: StudentInput) => void;
  deleteStudent: (id: string) => void;
  upsertStaff: (s: Omit<Staff, "id"> & { id?: string }) => void;
  deleteStaff: (id: string) => void;
  /* academics */
  saveAttendance: (date: string, records: Record<string, AttStatus>) => void;
  saveScores: (rows: { studentId: string; subjectId: string; classScore: number; examScore: number }[]) => void;
  togglePublish: (classId: string) => void;
  /* money */
  recordPayment: (studentId: string, amount: number, method: string) => void;
  deletePayment: (id: string) => void;
  /* comms */
  upsertAnnouncement: (a: { id?: string; title: string; body: string; audience: Announcement["audience"]; pinned?: boolean }) => void;
  deleteAnnouncement: (id: string) => void;
  /* auth */
  session: Account | null;
  signIn: (login: string, key: string) => { ok: boolean; error?: string };
  signOut: () => void;
  createLogin: (input: {
    role: Role;
    name: string;
    login: string;
    staffId?: string;
    guardianId?: string;
  }) => { ok: boolean; key?: string; error?: string };
  resetLogin: (accountId: string) => { ok: boolean; key?: string; error?: string };
  revokeLogin: (accountId: string) => void;
  changeOwnKey: (currentKey: string, newKey: string) => { ok: boolean; error?: string };
  /* feedback */
  toasts: Toast[];
  toast: (title: string, tone?: Toast["tone"]) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildBlankState());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ready, setReady] = useState(false);

  /* ---- hydrate ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = sanitiseState(JSON.parse(raw));
        if (parsed) setState(parsed);
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  /* money() needs the school's currency symbol available to plain helpers */
  setCurrencySymbol(state.school.currencySymbol || "GH₵");
  setGradeBands(state.grading);

  const toast = useCallback((title: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  /* ---------------- session & persona ---------------- */
  const accounts = useMemo<Account[]>(() => state.accounts ?? [], [state.accounts]);
  const session = useMemo<Account | null>(
    () => accounts.find((a) => a.id === state.sessionAccountId) ?? null,
    [accounts, state.sessionAccountId],
  );

  const persona = useMemo<Persona>(() => {
    const blank = (role: Role, name: string, title: string): Persona => ({
      role,
      name,
      title,
      classIds: [],
      childrenIds: [],
    });

    if (!session || typeof session.role !== "string") return blank("admin", "Guest", "Not signed in");

    const school = state.school ?? ({} as AppState["school"]);
    const staffList = state.staff ?? [];
    const guardianList = state.guardians ?? [];
    const studentList = state.students ?? [];
    const classList = state.classes ?? [];

    if (session.role === "admin")
      return blank("admin", session.name || school.headTeacher || "Administrator", "Full access");

    if (session.role === "teacher") {
      const staff = staffList.find((s) => s.id === session.staffId);
      if (!staff) return blank("teacher", session.name || "Teacher", "No staff record linked");
      const classIds = Array.from(
        new Set([
          ...(staff.classIds ?? []),
          ...classList.filter((c) => c.formTeacherId === staff.id).map((c) => c.id),
        ]),
      );
      return {
        role: "teacher",
        name: staff.name,
        title: `${staff.role}${classIds.length ? ` · ${classIds.length} class${classIds.length > 1 ? "es" : ""}` : " · no classes yet"}`,
        staffId: staff.id,
        classIds,
        childrenIds: [],
      };
    }

    if (session.role === "parent") {
      const guardian = guardianList.find((g) => g.id === session.guardianId);
      if (!guardian) return blank("parent", session.name || "Parent", "No guardian record linked");
      const childrenIds = studentList.filter((s) => s.guardianId === guardian.id).map((s) => s.id);
      return {
        role: "parent",
        name: guardian.name,
        title: `${childrenIds.length} child${childrenIds.length === 1 ? "" : "ren"} at this school`,
        guardianId: guardian.id,
        classIds: [],
        childrenIds,
      };
    }

    return blank("admin", "Guest", "Not signed in");
  }, [session, state.classes, state.guardians, state.students, state.staff, state.school.headTeacher]);

  const value = useMemo<Ctx>(() => {
    /* every write is applied to local state first (optimistic) — the thin top bar
       just confirms the app is committing it */
    const patch = (fn: (s: AppState) => AppState) => {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sms:progress", { detail: "start" }));
      setState(fn);
      if (typeof window !== "undefined") {
        window.setTimeout(() => window.dispatchEvent(new CustomEvent("sms:progress", { detail: "done" })), 380);
      }
    };

    return {
      state,
      persona,
      ready,
      session,
      toasts,
      toast,

      /* ---------------- setup ---------------- */
      completeSetup: (p) =>
        patch((s) => {
          const classes: ClassRoom[] = [];
          p.classNames.forEach((group) =>
            group.names
              .filter((n) => n.trim())
              .forEach((name) =>
                classes.push({
                  id: newId("cls"),
                  name: name.trim(),
                  level: group.level,
                  formTeacherId: null,
                  capacity: 30,
                  room: "",
                }),
              ),
          );
          const subjects: Subject[] = [];
          p.subjects.forEach((group) =>
            group.names
              .filter((n) => n.trim())
              .forEach((name) => subjects.push({ id: newId("sub"), name: name.trim(), level: group.level })),
          );
          const term: Term = {
            id: newId("term"),
            name: p.term.name || "Term 1",
            year: p.term.year || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
            start: p.term.start,
            end: p.term.end,
          };
          const adminLogin = normaliseLogin(p.admin.login);
          const adminAccount: Account = {
            id: newId("acc"),
            role: "admin",
            name: p.admin.name.trim() || p.school.headTeacher || "Administrator",
            login: adminLogin,
            keyHash: hashKey(adminLogin, p.admin.key),
            createdAt: new Date().toISOString(),
          };
          return {
            ...s,
            setupComplete: true,
            school: p.school,
            levels: p.levels,
            classes,
            subjects,
            terms: [term],
            currentTermId: term.id,
            feeByLevel: p.fees,
            accounts: [...s.accounts.filter((a) => normaliseLogin(a.login) !== adminLogin), adminAccount],
            sessionAccountId: adminAccount.id,
          };
        }),

      startBlank: () => setState(buildBlankState()),

      /* ---------------- school ---------------- */
      setSchool: (p) => patch((s) => ({ ...s, school: { ...s.school, ...p } })),

      /* ---------------- structure ---------------- */
      upsertClass: (c) =>
        patch((s) => {
          if (c.id && s.classes.some((x) => x.id === c.id)) {
            return { ...s, classes: s.classes.map((x) => (x.id === c.id ? ({ ...x, ...c } as ClassRoom) : x)) };
          }
          return { ...s, classes: [...s.classes, { ...c, id: newId("cls") } as ClassRoom] };
        }),

      deleteClass: (id) =>
        patch((s) => ({
          ...s,
          classes: s.classes.filter((c) => c.id !== id),
          staff: s.staff.map((st) => ({ ...st, classIds: st.classIds.filter((c) => c !== id) })),
          students: s.students.filter((st) => st.classId !== id),
        })),

      upsertSubject: (sub) =>
        patch((s) => {
          if (sub.id && s.subjects.some((x) => x.id === sub.id)) {
            return { ...s, subjects: s.subjects.map((x) => (x.id === sub.id ? { ...x, ...sub } as Subject : x)) };
          }
          return { ...s, subjects: [...s.subjects, { ...sub, id: newId("sub") } as Subject] };
        }),

      deleteSubject: (id) =>
        patch((s) => {
          const scores = { ...s.scores };
          Object.keys(scores).forEach((sid) => {
            if (scores[sid]?.[id]) {
              const copy = { ...scores[sid] };
              delete copy[id];
              scores[sid] = copy;
            }
          });
          return { ...s, subjects: s.subjects.filter((x) => x.id !== id), scores };
        }),

      upsertTerm: (term) =>
        patch((s) => {
          if (term.id && s.terms.some((x) => x.id === term.id)) {
            return { ...s, terms: s.terms.map((x) => (x.id === term.id ? ({ ...x, ...term } as Term) : x)) };
          }
          const created = { ...term, id: newId("term") } as Term;
          return { ...s, terms: [...s.terms, created], currentTermId: s.currentTermId ?? created.id };
        }),

      deleteTerm: (id) =>
        patch((s) => {
          const terms = s.terms.filter((t) => t.id !== id);
          return { ...s, terms, currentTermId: s.currentTermId === id ? terms[0]?.id ?? null : s.currentTermId };
        }),

      setCurrentTerm: (id) => patch((s) => ({ ...s, currentTermId: id })),

      setFee: (level, amount) => patch((s) => ({ ...s, feeByLevel: { ...s.feeByLevel, [level]: amount } })),

      setGrading: (bands) => patch((s) => ({ ...s, grading: normaliseBands(bands) })),

      /* ---------------- people ---------------- */
      upsertStudent: (input) =>
        patch((s) => {
          let guardianId = "";
          let guardians = s.guardians;
          if (input.id) {
            const existing = s.students.find((x) => x.id === input.id);
            guardianId = existing?.guardianId ?? "";
          }
          const g: Guardian = {
            id: guardianId || newId("grd"),
            name: input.guardianName,
            phone: input.guardianPhone,
            email: input.guardianEmail,
            relation: input.guardianRelation,
            occupation: "",
          };
          guardians = guardians.some((x) => x.id === g.id)
            ? guardians.map((x) => (x.id === g.id ? { ...x, ...g } : x))
            : [...guardians, g];

          const student: Student = {
            id: input.id ?? newId("stu"),
            admissionNo:
              s.students.find((x) => x.id === input.id)?.admissionNo ??
              `ADM/${String(new Date().getFullYear()).slice(2)}/${String(s.students.length + 1).padStart(3, "0")}`,
            firstName: input.firstName,
            lastName: input.lastName,
            gender: input.gender,
            dob: input.dob,
            classId: input.classId,
            guardianId: g.id,
            address: input.address,
            enrolledOn:
              s.students.find((x) => x.id === input.id)?.enrolledOn ?? new Date().toISOString().slice(0, 10),
            house: input.house,
            status: input.status,
          };

          return {
            ...s,
            guardians,
            students: s.students.some((x) => x.id === student.id)
              ? s.students.map((x) => (x.id === student.id ? student : x))
              : [...s.students, student],
          };
        }),

      deleteStudent: (id) =>
        patch((s) => {
          const scores = { ...s.scores };
          delete scores[id];
          return {
            ...s,
            students: s.students.filter((x) => x.id !== id),
            payments: s.payments.filter((p) => p.studentId !== id),
            scores,
          };
        }),

      upsertStaff: (staff) =>
        patch((s) => {
          if (staff.id && s.staff.some((x) => x.id === staff.id)) {
            return { ...s, staff: s.staff.map((x) => (x.id === staff.id ? ({ ...x, ...staff } as Staff) : x)) };
          }
          return { ...s, staff: [...s.staff, { ...staff, id: newId("stf") } as Staff] };
        }),

      deleteStaff: (id) =>
        patch((s) => ({
          ...s,
          staff: s.staff.filter((x) => x.id !== id),
          classes: s.classes.map((c) => (c.formTeacherId === id ? { ...c, formTeacherId: null } : c)),
        })),

      /* ---------------- academics ---------------- */
      saveAttendance: (date, records) =>
        patch((s) => ({
          ...s,
          attendance: { ...s.attendance, [date]: { ...(s.attendance[date] ?? {}), ...records } },
        })),

      saveScores: (rows) =>
        patch((s) => {
          const scores = { ...s.scores };
          rows.forEach((r) => {
            scores[r.studentId] = {
              ...(scores[r.studentId] ?? {}),
              [r.subjectId]: { class: r.classScore, exam: r.examScore },
            };
          });
          return { ...s, scores };
        }),

      togglePublish: (classId) =>
        patch((s) => {
          const key = `${classId}::${s.currentTermId}`;
          return {
            ...s,
            published: s.published.includes(key) ? s.published.filter((k) => k !== key) : [...s.published, key],
          };
        }),

      /* ---------------- money ---------------- */
      recordPayment: (studentId, amount, method) =>
        patch((s) => {
          const receiptNo = `RCT-${1041 + s.payments.length}`;
          return {
            ...s,
            payments: [
              ...s.payments,
              {
                id: newId("pmt"),
                studentId,
                termId: s.currentTermId ?? "",
                amount,
                date: new Date().toISOString().slice(0, 10),
                method: method as "Cash",
                receiptNo,
                recordedBy: "Bursary",
              },
            ],
          };
        }),

      deletePayment: (id) => patch((s) => ({ ...s, payments: s.payments.filter((p) => p.id !== id) })),

      /* ---------------- comms ---------------- */
      upsertAnnouncement: (a) =>
        patch((s) => {
          if (a.id && s.announcements.some((x) => x.id === a.id)) {
            return {
              ...s,
              announcements: s.announcements.map((x) => (x.id === a.id ? { ...x, ...a, pinned: a.pinned ?? x.pinned } : x)),
            };
          }
          return {
            ...s,
            announcements: [
              {
                id: newId("ann"),
                title: a.title,
                body: a.body,
                audience: a.audience,
                author: s.school.headTeacher || "Administration",
                date: new Date().toISOString().slice(0, 10),
                pinned: a.pinned ?? false,
              },
              ...s.announcements,
            ],
          };
        }),

      deleteAnnouncement: (id) =>
        patch((s) => ({ ...s, announcements: s.announcements.filter((a) => a.id !== id) })),

      /* ---------------- auth ---------------- */
      signIn: (login, key) => {
        const id = normaliseLogin(login);
        const account = state.accounts.find((a) => normaliseLogin(a.login) === id);
        if (!account) return { ok: false, error: "No account with that login" };
        if (account.keyHash !== hashKey(account.login, key)) return { ok: false, error: "That key doesn't match" };
        patch((s) => ({
          ...s,
          sessionAccountId: account.id,
          accounts: s.accounts.map((a) => (a.id === account.id ? { ...a, lastSeen: new Date().toISOString() } : a)),
        }));
        return { ok: true };
      },

      signOut: () => patch((s) => ({ ...s, sessionAccountId: null })),

      createLogin: ({ role, name, login, staffId, guardianId }) => {
        const clean = normaliseLogin(login);
        if (clean.length < 3) return { ok: false, error: "Enter an email, phone or username" };
        if (state.accounts.some((a) => normaliseLogin(a.login) === clean))
          return { ok: false, error: "That login is already in use" };
        const key = generateKey();
        const account: Account = {
          id: newId("acc"),
          role,
          name,
          login: clean,
          keyHash: hashKey(clean, key),
          staffId,
          guardianId,
          createdAt: new Date().toISOString(),
        };
        patch((s) => ({ ...s, accounts: [...s.accounts, account] }));
        return { ok: true, key };
      },

      resetLogin: (accountId) => {
        const account = state.accounts.find((a) => a.id === accountId);
        if (!account) return { ok: false, error: "Account not found" };
        const key = generateKey();
        patch((s) => ({
          ...s,
          accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, keyHash: hashKey(a.login, key) } : a)),
        }));
        return { ok: true, key };
      },

      revokeLogin: (accountId) =>
        patch((s) => ({
          ...s,
          accounts: s.accounts.filter((a) => a.id !== accountId),
          sessionAccountId: s.sessionAccountId === accountId ? null : s.sessionAccountId,
        })),

      changeOwnKey: (currentKey, newKey) => {
        if (!session) return { ok: false, error: "Not signed in" };
        if (session.keyHash !== hashKey(session.login, currentKey)) return { ok: false, error: "Current key is wrong" };
        if (newKey.trim().length < 6) return { ok: false, error: "Use at least 6 characters" };
        patch((s) => ({
          ...s,
          accounts: s.accounts.map((a) =>
            a.id === session.id ? { ...a, keyHash: hashKey(a.login, newKey) } : a,
          ),
        }));
        return { ok: true };
      },
    };
  }, [state, persona, ready, session, toasts, toast]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
