# School Management System

A blank, fully editable school management system. Any school sets itself up in four steps and
then runs pupils, staff, attendance, scores, report cards and fees on its own data.

Built with **Next.js 16 · React 19 · TypeScript**, ready for **Supabase + Vercel**.
See [BRIEF.md](./BRIEF.md) for the full feature/design brief.

---

## Run it

```bash
cd school-ms
npm install
npm run dev          # http://localhost:3000
```

First visit opens the **setup wizard** (`/setup`). No environment variables needed.

Signing in: the wizard collects **your administrator sign-in and security key** on step 1 — that
account owns the school. Afterwards everyone signs in at `/login` with their own login + key,
and the login decides what they see (there is no role switcher anywhere in the UI).

Production build:

```bash
npm run build && npm start
```

---

## First run

1. **School details** — name, initials, motto, address, phone, email, head teacher, currency,
   plus **your administrator sign-in** (name, login and security key).
2. **Classes & levels** — pick Preschool / Primary / JHS (or your own mix); suggested class names
   are editable, add or remove freely.
3. **Subjects** — a list per level; these drive score entry and report cards.
4. **Term & fees** — current term dates and the fee charged per level.

Then add staff (assign form teachers), admit pupils, mark registers, enter scores, publish
report cards and record payments. Create logins for teachers and parents in
**School setup → Access & security keys** — each new key is shown once and can be reset there.

### Who can see what

| Login role | Sees |
|---|---|
| Administrator | everything, including School setup and access keys |
| Teacher | only the classes assigned to them (register, scores, reports, pupils) |
| Parent | only their own children (results, attendance, fees) |

Keys are stored as hashes only (`lib/auth.ts`, FNV-1a over login + key). Any key can be reset by an
administrator from School setup; a signed-in user can change their own on `/account`.

The app starts **completely blank** — there is no demo school and no seeded accounts. Every
record you see is one you created, held in this browser's `localStorage` only.
**School setup → Data → Clear all records** wipes it and reopens the wizard.

---

## On a phone

The small-screen layout is app-shaped rather than a shrunk desktop:

- a **bottom tab bar** — Home · Pupils · Register · Fees · **More**. The four front tabs are
  picked per login, so a teacher (no fees access) gets Home · Pupils · Register · Reports · More
  and a parent gets Home · Register · Fees · Reports · More. "More" opens a bottom sheet with
  Classes, Staff, Exams & Scores, Report Cards, Announcements, School setup, My account and Sign out
- **sheets** for More, search and every form — they slide up from the bottom with a grip handle
- a **story-style rail** of module circles on the dashboard instead of a grid of tiles
- on phones **Fees opens on the balance register** — search, Owing/Part paid/Paid/All chips and a
  Record button on every row — with the totals and charts below it; forms open as bottom sheets
- **skeleton frames** on first paint and between routes (never a spinner), see `components/Skeleton.tsx`
- **optimistic writes** — attendance toggles, payments and publishing apply instantly, the row flashes
  and a hairline progress bar runs across the top while it commits (`components/TopProgress.tsx`)

Desktop keeps the sidebar and full-width tables; everything below 720px switches to the app shell.

---

## Screens

Captures from a blank install live in `docs/screens/` — the wizard, the empty dashboard on
desktop and phone, an empty register, the A4 report card and School setup.

---

## Where things live

```
app/setup/                     setup wizard (4 steps)
app/(app)/dashboard/           role-aware home + setup checklist
app/login/                     sign in with login + security key
app/(app)/students/            pupil register: search, admit/edit/delete
app/(app)/classes/             class cards + create/edit/delete
app/(app)/staff/               staff directory + create/edit/delete
app/(app)/attendance/          daily register
app/(app)/exams/               score entry (30 / 70) with live grades
app/(app)/reports/             ranking, publish, printable A4 report card (210 × 297 mm)
app/(app)/account/             change your own access key
app/(app)/fees/                invoices, arrears, receipts
app/(app)/announcements/       notices with audiences
app/(app)/settings/            ← the editing hub (admin only): profile, classes, subjects, terms, fees, access keys, grading, data
lib/store.tsx                  state + every mutation (localStorage persistence)
lib/blank.ts                   blank state, default subject/class suggestions, currencies
lib/derive.ts                  selectors: balances, rankings, attendance, formatting
lib/grading.ts                 editable grading scale (default 1–9, presets, score → grade)
lib/auth.ts                    key hashing, key generation, login normalisation
components/                    shell (sidebar + phone tab bar), UI kit, forms, skeletons, progress
supabase/migrations/0001_init.sql   schema + views + RLS policies
supabase/seed.sql                   optional starter data for Supabase
```

---

## Editing anything

| To change… | Go to |
|---|---|
| School name, contact, currency | School setup → School profile |
| Classes, rooms, capacity, form teachers | School setup → Classes & streams (inline editing) |
| Subjects per level | School setup → Subjects |
| Terms and which one is current | School setup → Academic calendar |
| Fees per level | School setup → Fees per term |
| Grading scale (bands, cut-offs, remarks, colours) | School setup → Grading scale |
| A pupil (class, guardian, status) | Students → Edit |
| Who can sign in, reset a key | School setup → Access & security keys |
| Staff and their classes | Staff → Edit |
| Report card release | Report cards → Publish / Unpublish |

School setup is **administrator-only**: the nav entry is hidden for other roles, and opening
`/settings` with a teacher or parent login shows an "administrators only" card. Teachers only ever
see the classes assigned to them — the class list, registers, score sheets and report cards are all
filtered by their assignments.

---

## Data layer

Everything is stored in the browser (`localStorage`, key `school-ms-state-v1`) so the app works
with zero backend. The Supabase schema mirrors it exactly:

```bash
supabase link --project-ref <your-ref>
supabase db push               # applies 0001_init.sql
# optional starter data:
supabase db execute -f supabase/seed.sql
```

The scale lives in `school_settings.grading_scale` (jsonb), so a school's bands follow it to
the database.

Ship includes 16 tables (`school_settings`, `classes`, `subjects`, `terms`, `students`,
`guardians`, `staff`, `attendance`, `scores`, `report_cards`, `invoices`, `payments`,
`announcements`, …), two views (`v_student_balance`, `v_class_results`), RLS policies
(`is_admin()`, `teaches_class()`, `can_see_student()`) and an auth trigger that creates a
`profiles` row per user. To switch the UI over, replace the mutations in `lib/store.tsx` with
`supabase.from(...)` calls — the shapes match `lib/types.ts`.

Deploy:

```bash
vercel          # preview
vercel --prod   # production
```

Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel when you go live.

---

## Notes

- Grading defaults to a 1–9 scale (1 highest) but is fully editable per school; class score 30% + exam 70%, aggregate = best six bands.
- Roles: Administrator (everything), Teacher (own classes), Parent (own children). Pupils are
  records the school maintains — they don't sign in.
- All dates/currency are formatted by hand so server and client render identically.
