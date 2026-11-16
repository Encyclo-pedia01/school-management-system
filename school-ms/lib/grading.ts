import type { GradeBand, GradeInfo, GradeTone } from "./types";

/* ------------------------------------------------------------------ */
/* the school's grading scale — editable in School setup              */
/* ------------------------------------------------------------------ */

const band = (label: string, min: number, remark: string, tone: GradeTone): GradeBand => ({
  id: `g-${label.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${min}`,
  label,
  min,
  remark,
  tone,
});

/** Ghanaian basic-school default: 1 (highest) → 9. */
export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  band("1", 80, "Excellent", "green"),
  band("2", 75, "Very Good", "green"),
  band("3", 70, "Good", "blue"),
  band("4", 65, "Credit", "blue"),
  band("5", 60, "Credit", "blue"),
  band("6", 55, "Pass", "amber"),
  band("7", 50, "Pass", "amber"),
  band("8", 45, "Weak", "red"),
  band("9", 0, "Fail", "red"),
];

const A_F: GradeBand[] = [
  band("A", 80, "Excellent", "green"),
  band("B", 70, "Very Good", "green"),
  band("C", 60, "Good", "blue"),
  band("D", 50, "Credit", "amber"),
  band("E", 40, "Pass", "amber"),
  band("F", 0, "Fail", "red"),
];

const PASS_FAIL: GradeBand[] = [
  band("Pass", 50, "Satisfactory", "green"),
  band("Fail", 0, "Below standard", "red"),
];

export const GRADE_PRESETS: { id: string; name: string; sub: string; bands: GradeBand[] }[] = [
  { id: "1-9", name: "1 – 9 scale", sub: "Ghana basic school", bands: DEFAULT_GRADE_BANDS },
  { id: "a-f", name: "A – F letters", sub: "Six bands", bands: A_F },
  { id: "pass-fail", name: "Pass / Fail", sub: "Two bands", bands: PASS_FAIL },
];

/** Sort high → low, clamp to 0–100, drop duplicate cut-offs, keep ids unique. */
export const normaliseBands = (bands: GradeBand[]): GradeBand[] => {
  const seen = new Set<number>();
  const cleaned = bands
    .map((b, i) => ({
      ...b,
      label: (b.label ?? "").trim() || "—",
      min: Math.max(0, Math.min(100, Math.round(Number(b.min) || 0))),
      remark: (b.remark ?? "").trim(),
      id: b.id || `g-${Date.now()}-${i}`,
    }))
    .sort((a, b) => b.min - a.min)
    .filter((b) => {
      if (seen.has(b.min)) return false;
      seen.add(b.min);
      return true;
    });
  return cleaned.length ? cleaned : DEFAULT_GRADE_BANDS;
};

/* ------------------------------------------------------------------ */
/* current scale — set by the provider so plain helpers can read it    */
/* ------------------------------------------------------------------ */
let BANDS: GradeBand[] = DEFAULT_GRADE_BANDS;

export const setGradeBands = (bands: GradeBand[] | undefined) => {
  BANDS = normaliseBands(bands && bands.length ? bands : DEFAULT_GRADE_BANDS);
};

export const gradeBands = () => BANDS;

/** Score → grade. Rank 1 is the best band; ranks drive the aggregate. */
export function gradeFor(total: number, bands: GradeBand[] = BANDS): GradeInfo {
  const scale = bands.length ? bands : DEFAULT_GRADE_BANDS;
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  const idx = sorted.findIndex((b) => total >= b.min);
  const i = idx === -1 ? sorted.length - 1 : idx;
  const row = sorted[i];
  return { label: row.label, rank: i + 1, remark: row.remark, tone: row.tone };
}

export const gradeBadge = (tone: GradeTone) =>
  tone === "green" ? "badge-green" : tone === "blue" ? "badge-blue" : tone === "amber" ? "badge-amber" : "badge-red";

/** "80 – 100" style range label for a band within its scale. */
export const bandRange = (bands: GradeBand[], index: number) => {
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  const upper = index === 0 ? 100 : sorted[index - 1].min - 1;
  return `${sorted[index].min} – ${upper}`;
};
