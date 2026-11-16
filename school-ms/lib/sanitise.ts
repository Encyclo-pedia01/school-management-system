import { DEFAULT_GRADE_BANDS } from "./grading";
import { buildBlankState } from "./blank";
import type { Account, AppState, Level, Role } from "./types";

const ROLES: Role[] = ["admin", "teacher", "parent"];
const LEVELS: Level[] = ["Preschool", "Primary", "JHS"];

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asRecord = (v: unknown): Record<string, Record<string, { class: number; exam: number }>> =>
  isObj(v) ? (v as never) : {};

/**
 * Takes whatever was found in localStorage and returns a state the app can always
 * render. Anything unrecognised is dropped rather than allowed to crash a memo —
 * a half-written or pre-auth blob must never brick the dashboard.
 *
 * Returns null when there is nothing usable to restore.
 */
export function sanitiseState(raw: unknown): AppState | null {
  if (!isObj(raw)) return null;
  if (raw.version !== 3 && raw.version !== 4) return null;

  const blank = buildBlankState();
  const s = raw as unknown as Partial<AppState>;

  /* ---- accounts: only well-formed rows with a role we understand ---- */
  const accounts: Account[] = asArray<Account>(s.accounts).filter(
    (a) =>
      isObj(a) &&
      typeof a.id === "string" &&
      a.id.length > 0 &&
      ROLES.includes(a.role) &&
      typeof a.login === "string" &&
      typeof a.keyHash === "string",
  ).map((a) => ({ ...a, name: typeof a.name === "string" ? a.name : a.login }));

  const sessionAccountId =
    typeof s.sessionAccountId === "string" && accounts.some((a) => a.id === s.sessionAccountId)
      ? s.sessionAccountId
      : null;

  /* ---- grading: fall back to the default scale ---- */
  const grading = Array.isArray(s.grading) && s.grading.length ? s.grading : DEFAULT_GRADE_BANDS.map((b) => ({ ...b }));

  /* ---- terms / currentTermId must agree ---- */
  const terms = asArray<AppState["terms"][number]>(s.terms).filter(
    (t) => isObj(t) && typeof t.id === "string",
  );
  const currentTermId = terms.some((t) => t.id === s.currentTermId) ? (s.currentTermId as string) : terms[0]?.id ?? null;

  const classes = asArray<AppState["classes"][number]>(s.classes).filter(
    (c) => isObj(c) && typeof c.id === "string",
  );

  const state: AppState = {
    version: 3,
    setupComplete: Boolean(s.setupComplete),
    school: isObj(s.school) ? { ...blank.school, ...(s.school as AppState["school"]) } : blank.school,
    levels: asArray<Level>(s.levels).filter((l) => LEVELS.includes(l)),
    classes,
    subjects: asArray<AppState["subjects"][number]>(s.subjects).filter((x) => isObj(x) && typeof x.id === "string"),
    terms,
    currentTermId,
    feeByLevel: isObj(s.feeByLevel) ? { ...blank.feeByLevel, ...(s.feeByLevel as AppState["feeByLevel"]) } : blank.feeByLevel,
    grading,
    staff: asArray<AppState["staff"][number]>(s.staff).filter((x) => isObj(x) && typeof x.id === "string"),
    guardians: asArray<AppState["guardians"][number]>(s.guardians).filter((x) => isObj(x) && typeof x.id === "string"),
    students: asArray<AppState["students"][number]>(s.students).filter((x) => isObj(x) && typeof x.id === "string"),
    attendance: isObj(s.attendance) ? (s.attendance as AppState["attendance"]) : {},
    scores: asRecord(s.scores),
    payments: asArray<AppState["payments"][number]>(s.payments).filter((x) => isObj(x) && typeof x.id === "string"),
    announcements: asArray<AppState["announcements"][number]>(s.announcements).filter(
      (x) => isObj(x) && typeof x.id === "string",
    ),
    published: asArray<string>(s.published).filter((x) => typeof x === "string"),
    accounts,
    sessionAccountId,
  };

  /* a school with classes but no profile can't render a report card — treat it as unset up */
  if (!state.school.name && !state.classes.length && !state.students.length) state.setupComplete = false;

  return state;
}
