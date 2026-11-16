# School Management System — blank & fully editable

A warm, friendly school management system that **starts empty**. Any school — basic, primary,
secondary or a small training centre — sets itself up in four steps, then runs pupils, staff,
attendance, scores, report cards and fees from its own data.

Built with **Next.js 16 + React 19**; ready to run on **Supabase + Vercel**.

---

## How the blank system works

1. **First run → setup wizard** (`/setup`). Collects:
   - school name, initials, motto, address, contact, head teacher, currency
   - which levels you run (Preschool / Primary / JHS) and how many classes per level
   - the subject list per level
   - the current term and the fee per level
2. Everything created is **fully editable afterwards** in **School setup** — rename classes,
   add a stream, delete subjects, add Term 2, change fees.
3. Dashboards show a **setup checklist** until there are pupils, then fill in automatically.
4. There is **no demo or sample data anywhere** — the build ships empty, and everything is
   stored locally in the browser. **School setup → Data → Clear all records** returns to a
   blank system at any time.

Nothing is hard-coded to a particular school. Currency, grading bands, term names, class
names and subject lists are all data.

**School setup is administrator-only.** The nav item disappears for teachers, parents and
pupils, and visiting `/settings` directly shows an "administrators only" notice — so a
school can hand out teacher and parent access without exposing its structure or fees.

### Grading scale

Score entry, rankings, report cards and the aggregate all read from one editable scale
(`AppState.grading`). Each band has a label, a cut-off score, a remark and a colour tone:

```
1  80–100  Excellent   (green)
2  75–79   Very Good   (green)
…
9  0–44    Fail        (red)
```

A school can switch to A–F or Pass/Fail in one click, rename bands however it grades, and
the aggregate keeps working because it counts band *order* (best band = 1) rather than the
label. Students' stored scores never change — only how they are graded.

---

## What's editable

| Area | Editable |
|---|---|
| School profile | name, initials, motto, address, phone, email, head teacher, currency, time zone |
| Classes / streams | add, rename, change level, capacity, room, assign or change form teacher, delete |
| Subjects | add / rename / delete per level (drives score entry & report cards) |
| Terms | add a term, edit names and dates, mark which term is current, delete |
| Fees | fee per level per term (used for invoicing & balances) |
| Grading scale | add / rename / delete bands, change cut-offs, remarks and colours; presets for 1–9, A–F and Pass–Fail |
| Pupils | admit, edit, change class, withdraw (status), delete; guardian details inline |
| Staff | add, edit, assign classes, mark on leave, delete |
| Attendance | register per class per date — present / late / absent, saved |
| Scores | class score (30) + exam (70) per subject, auto grade 1–9 and remark, plus a search box to find a pupil in the class |
| Report cards | publish / unpublish per class, true A4 (210 × 297 mm) print sheet |
| Payments | record payment → receipt; balances and arrears update instantly |
| Announcements | compose, edit, pin, delete; audience = everyone / parents / staff |

---

## Roles & access

There is **no role switcher**. Each person has their own login and security key, and the login
decides everything they can reach. The school's owner (administrator) creates logins from
**School setup → Access & security keys**; keys are shown once and can be reset at any time.

| Login role | Sees |
|---|---|
| **Administrator** | everything: records, money, access keys and the whole School setup area |
| **Teacher** | only the classes assigned to them: register, score entry, reports, pupils in those classes (no School setup) |
| **Parent** | only their children: results, fees, attendance, notices (no School setup) |

The owner's key is created during the setup wizard and is never readable in the UI — only
resettable by an administrator. A signed-in person can change their own key on `/account`.

Pupils are *records*, not logins — the school manages them in a register, and families see them
through a guardian's account.

---

## Design

Warm & friendly: rounded cards, crayon-inspired mark, generous spacing.

```
Orange   #f97316   primary actions, active nav, highlights
Blue     #2563eb   data, links, secondary charts
Ink      #14161a   sidebar, headings
Cream    #fffbf6   page background
Radius   18–22px cards · 12px inputs · pill buttons
```

All styling lives in `app/globals.css`; charts are hand-rolled SVG (`components/Charts.tsx`),
so there are zero UI/chart dependencies.

---

## Data

- **Now:** every record lives in browser `localStorage` (key `school-ms-state-v1`), so the app
  behaves like the real thing with no backend.
- **Next:** `supabase/migrations/0001_init.sql` has the matching schema — 16 tables, two views,
  row-level security (admins all · teachers their classes · parents their children) and an auth trigger. `supabase/seed.sql` is optional starter data.
