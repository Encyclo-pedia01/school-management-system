export type Role = "admin" | "teacher" | "parent";
export type Level = "Preschool" | "Primary" | "JHS";
export type AttStatus = "present" | "absent" | "late";

export interface SchoolProfile {
  name: string;
  shortName: string;
  motto: string;
  address: string;
  phone: string;
  email: string;
  headTeacher: string;
  currencyCode: string;
  currencySymbol: string;
  timezone: string;
}

export interface Subject {
  id: string;
  name: string;
  level: Level;
}

export interface ClassRoom {
  id: string;
  name: string;
  level: Level;
  formTeacherId: string | null;
  capacity: number;
  room: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female";
  dob: string;
  classId: string;
  guardianId: string;
  address: string;
  enrolledOn: string;
  house: string;
  status: "Active" | "Left";
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  email: string;
  relation: "Mother" | "Father" | "Guardian";
  occupation: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  classIds: string[];
  status: "Active" | "On leave";
}

export interface Payment {
  id: string;
  studentId: string;
  termId: string;
  amount: number;
  date: string;
  method: "Cash" | "Mobile Money" | "Bank Transfer" | "Cheque";
  receiptNo: string;
  recordedBy: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: "all" | "parents" | "staff";
  author: string;
  date: string;
  pinned: boolean;
}

export interface Term {
  id: string;
  name: string;
  year: string;
  start: string;
  end: string;
}

/** A sign-in record. The role comes from the account, never from a switcher. */
export interface Account {
  id: string;
  role: Role;
  name: string;
  login: string;      // email, phone or username the person types
  keyHash: string;    // SHA-256 of their key — never stored in clear
  staffId?: string;
  guardianId?: string;
  createdAt: string;
  lastSeen?: string;
}

export interface AppState {
  version: number;
  setupComplete: boolean;
  school: SchoolProfile;
  levels: Level[];
  classes: ClassRoom[];
  subjects: Subject[];
  terms: Term[];
  currentTermId: string | null;
  feeByLevel: Record<string, number>;
  grading: GradeBand[];
  staff: Staff[];
  guardians: Guardian[];
  students: Student[];
  attendance: Record<string, Record<string, AttStatus>>;
  scores: Record<string, Record<string, { class: number; exam: number }>>;
  payments: Payment[];
  announcements: Announcement[];
  published: string[];
  accounts: Account[];
  sessionAccountId: string | null;
}

export interface Persona {
  role: Role;
  name: string;
  title: string;
  staffId?: string;
  guardianId?: string;
  classIds: string[];
  childrenIds: string[];
}

export type GradeTone = "green" | "blue" | "amber" | "red";

/** One editable band of the school's grading scale. */
export interface GradeBand {
  id: string;
  label: string;   // "1", "A", "B+", "D7"…
  min: number;     // lowest score (0–100) that earns this grade
  remark: string;  // "Excellent"
  tone: GradeTone;
}

/** What a score resolves to — rank 1 is the best band. */
export interface GradeInfo {
  label: string;
  rank: number;
  remark: string;
  tone: GradeTone;
}

export const LEVEL_LABEL: Record<Level, string> = {
  Preschool: "Preschool",
  Primary: "Primary",
  JHS: "Junior High",
};
