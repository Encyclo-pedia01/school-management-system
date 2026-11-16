# Deploying to Vercel

The app is a plain Next.js 16 project with **no required environment variables** — it
runs entirely from `localStorage`, so a fresh deploy boots into the setup wizard with
no backend. Supabase can be switched on later without touching the UI code.

- **Runtime** — Next.js 16.4.6, React 19, Node 20.9+ (`engines` is set in `package.json`).
- **Build command** — `next build` (auto-detected). Output — Next default, nothing custom.
- **Dependencies** — only `next`, `react`, `react-dom`. No native modules, no postinstall.
- **Env vars** — none required. Optional:

  | Key | When |
  | --- | --- |
  | `NEXT_PUBLIC_SUPABASE_URL` | once you wire Supabase |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | once you wire Supabase |
  | `SUPABASE_SERVICE_ROLE_KEY` | server-side scripts only, never `NEXT_PUBLIC_` |

---

## Option A — Vercel CLI (fastest, no Git needed)

```bash
cd school-ms
npm i -g vercel          # or: npx vercel@latest
vercel login
vercel link              # create a new project, accept the defaults (name: school-ms)
vercel --prod            # builds on Vercel and prints the production URL
```

The first `vercel --prod` prints something like
`https://school-ms-<hash>.vercel.app` — that is the live school system.

Re-deploy after changes: `vercel --prod` again. Pull production env into `.env.local`
with `vercel env pull` if you add Supabase keys.

## Option B — GitHub → Vercel (auto-deploy on every push)

The project is already a git repo with one commit on `main` (`55e49db`) and a CI
workflow that runs `tsc --noEmit` + `next build` on every push
(`.github/workflows/ci.yml`). If you downloaded `school-ms-deploy.tar.gz`, unzip it and
`cd school-ms` — the history is inside.

```bash
# with the GitHub CLI (easiest)
gh repo create school-ms --private --source=. --remote=origin --push

# or by hand, after creating an empty repo on github.com
git remote add origin https://github.com/<your-username>/school-ms.git
git branch -M main
git push -u origin main
```

Then in Vercel: **Add New → Project → Import** the repo → framework preset is detected
as Next.js, leave the build settings untouched → **Deploy**.

From then on every push to `main` is a production deploy, and every branch or PR gets a
preview URL you can show a head teacher without touching the live school.

`node_modules/`, `.next/`, `*.tsbuildinfo`, local env files and `*.tar.gz` are already
git-ignored, so nothing heavy or secret is committed.

---

## After the first deploy

1. Open the URL → you land on `/setup`.
2. Walk the 4-step wizard: school details and your own owner login + security **key**,
   levels and classes, subjects, then the term and fees per level.
3. You are signed in as that owner account straight away. Any further logins (staff,
   parents) are created from inside the app, and roles come from the login — there is no
   role switcher, and no demo credentials ship with the build.
4. Print a report card once to confirm the A4 page (`/reports` → a pupil → Print).

### Things worth knowing

- **Nothing ships pre-filled.** A fresh deploy is an empty school: no pupils, no staff, no
  accounts except the owner you create in the wizard. There is no sample-data button.
- **Data is per browser.** Until Supabase is connected, everything lives in that
  browser's `localStorage` (`school-ms-state-v1`). Each phone or laptop has its own copy;
  clearing site data resets the school. Use **School setup → Backups** (export JSON) to
  move a school between devices.
- **Supabase.** `supabase/migrations/0001_init.sql` and `0002_accounts.sql` hold the
  schema. Create a project, run the migrations, then add the two `NEXT_PUBLIC_` vars in
  Vercel → Settings → Environment Variables and redeploy.
- **Custom domain.** Vercel → Project → Settings → Domains → add e.g.
  `app.yourschool.edu.gh`, then point the DNS record at Vercel.
- **Previews.** Every non-production deploy is a preview URL with its own empty
  browser storage, so you can hand it to a head teacher for a look without touching the
  live school.
