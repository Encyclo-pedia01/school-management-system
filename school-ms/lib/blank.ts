import { DEFAULT_GRADE_BANDS } from "./grading";
import type { AppState, Level, SchoolProfile, Subject } from "./types";

export const EMPTY_SCHOOL: SchoolProfile = {
  name: "",
  shortName: "",
  motto: "",
  address: "",
  phone: "",
  email: "",
  headTeacher: "",
  currencyCode: "GHS",
  currencySymbol: "GH₵",
  timezone: "Africa/Accra",
};

/** Suggested curriculums — schools tick / edit these during setup. */
export const DEFAULT_SUBJECTS: Record<Level, string[]> = {
  Preschool: [
    "Language & Literacy",
    "Numeracy",
    "Creative Arts",
    "Our World Our People",
    "Physical Development",
  ],
  Primary: [
    "English Language",
    "Mathematics",
    "Science",
    "Our World Our People",
    "Creative Arts",
    "Ghanaian Language",
    "Computing",
    "Physical Education",
  ],
  JHS: [
    "English Language",
    "Mathematics",
    "Integrated Science",
    "Social Studies",
    "Computing",
    "Ghanaian Language",
    "Career Technology",
    "Physical Education",
  ],
};

/** Class names suggested per level — all editable. */
export const DEFAULT_CLASS_NAMES: Record<Level, string[]> = {
  Preschool: ["Crèche", "Nursery 1", "Nursery 2", "KG 1", "KG 2"],
  Primary: ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6"],
  JHS: ["JHS 1", "JHS 2", "JHS 3"],
};

export const CURRENCIES = [
  { code: "GHS", symbol: "GH₵", label: "Ghana Cedi" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "GBP", symbol: "£", label: "Pound Sterling" },
  { code: "EUR", symbol: "€", label: "Euro" },
];

export const HOUSES_DEFAULT = ["Osei Tutu", "Yaa Asantewaa", "Anokye", "Akwamu"];

let seq = 1;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`;

export function buildBlankState(): AppState {
  return {
    version: 3,
    setupComplete: false,
    school: { ...EMPTY_SCHOOL },
    levels: [],
    classes: [],
    subjects: [],
    terms: [],
    currentTermId: null,
    feeByLevel: { Preschool: 0, Primary: 0, JHS: 0 },
    grading: DEFAULT_GRADE_BANDS.map((b) => ({ ...b })),
    staff: [],
    guardians: [],
    students: [],
    attendance: {},
    scores: {},
    payments: [],
    announcements: [],
    published: [],
    accounts: [],
    sessionAccountId: null,
  };
}

export function subjectSet(levels: Level[], names: Record<Level, string[]> = DEFAULT_SUBJECTS): Subject[] {
  const out: Subject[] = [];
  levels.forEach((level) => {
    (names[level] ?? []).forEach((name) => out.push({ id: newId("sub"), name, level }));
  });
  return out;
}
