# Muhammad Walid — Portfolio + Admin Dashboard

Personal portfolio website for **Muhammad Walid** with a full admin dashboard, powered by
**React + Vite + PrimeReact + Supabase**, deployed to **GitHub Pages** at [mwalid.me](https://mwalid.me).

- **Design system:** KitKat-inspired red (`#E31837`) / black / white, Nunito typography
- **Public site:** Home, About, Skills, Projects (+ detail pages), Services, Contact, 404
- **Admin dashboard:** projects, skills, services, experience/education, profile, site settings, message inbox
- **Backend:** Supabase (PostgreSQL + RLS, Auth, Storage) — the static site holds no secrets

---

## 1. Quick start

```bash
npm install
cp .env.example .env      # then fill in your Supabase values (see below)
npm run dev               # http://localhost:5173
```

The site runs in **setup mode** until Supabase env vars are set: pages render normally with
friendly "database not connected" notices instead of crashing.

---

## 2. Supabase setup (one time, ~10 minutes)

### 2.1 Create the project
1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Choose a name (e.g. `mwalid-portfolio`), a strong database password, and a region near you.

### 2.2 Run the schema
1. Open **SQL Editor** → **New query**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**.
   - Creates all tables (`site_settings`, `projects`, `skills`, `services`, `timeline_items`,
     `contact_messages`, `admin_users`), RLS policies, the `portfolio-media` storage bucket,
     an anti-spam trigger, and starter services.
   - Safe to re-run (idempotent).

### 2.3 Add environment variables
Copy the values from **Project Settings → API** into `.env` (locally) **and** into the
repository secrets (for deployment):

```ini
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

> Only the **anon** key goes in the frontend. Never put the service-role key in `.env`,
> source files, or GitHub secrets used by the site — it bypasses RLS entirely.

### 2.4 Create your admin account
Supabase's free tier has no server-side "sign up first admin" API, so authorization uses a
**database allowlist** (`admin_users` table) + Auth. Two supported ways:

**Option A — dashboard invite (recommended):**
1. Supabase dashboard → **Authentication → Users → Add user → Create new user**.
   Enter your email + password, check *Auto Confirm User*.
2. SQL Editor → run:
   ```sql
   insert into public.admin_users (email) values ('you@example.com');
   ```
   (Use the exact email you created.)

**Option B — enable email confirmation** in **Authentication → Providers → Email** if you
prefer confirmation flows; the allowlist step is still required.

Now sign in at `/#/admin/login`. Any account **not** in `admin_users` can authenticate but
sees "Access denied" — and RLS blocks all admin data server-side regardless of the UI.

To add/remove admins later:
```sql
insert into public.admin_users (email) values ('second-admin@example.com');
delete from public.admin_users where email = 'someone@example.com';
```

---

## 3. What to fill in first (content checklist)

Sign in at `/#/admin` and work through:

| Where | What |
|---|---|
| **Profile** | Display name, hero heading/description, about text, profile photo, availability |
| **Site Settings** | Contact email, GitHub/LinkedIn URLs, resume link, footer text, meta description |
| **Projects** | Add real projects (start as drafts, publish when ready) |
| **Skills** | Add your stack per category |
| **Experience & Education** | BBIT studies, experience, milestones — nothing is public until visible |
| **Messages** | The contact form inbox |

The site hides sections that have no content yet (no fake data anywhere).

---

## 4. Deployment — GitHub Pages + mwalid.me

The repo is `MuhammadWaleed6.github.io` (user site → served at the domain root), so the Vite
`base` is `/`. [`CNAME`](CNAME) is preserved (`mwalid.me`), and
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys on every push to `main`.

### One-time GitHub settings
1. **Repository → Settings → Secrets and variables → Actions → New repository secret**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. **Repository → Settings → Pages → Build and deployment → Source: GitHub Actions.**
   (Not "Deploy from a branch" — the workflow deploys the built artifact.)

### Deploy
```bash
git add -A
git commit -m "Portfolio v1"
git push origin main
```
Watch the **Actions** tab → "Deploy to GitHub Pages" → then check https://mwalid.me.

### DNS (already connected — normally nothing to do)
Apex `A` records point to GitHub Pages servers and `www` is a `CNAME` to
`MuhammadWaleed6.github.io`. First-time HTTPS provisioning can take up to ~24 h
(Settings → Pages shows the certificate status); "Enforce HTTPS" appears once issued.

---

## 5. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| **Blank page after deploy** | Check the workflow ran (Actions tab); check `base: '/'` in `vite.config.js`; open DevTools console for the failing asset path |
| **404 on CSS/JS** | Stale cache or wrong base — hard-refresh (Ctrl+F5); verify `base` matches the deployment root |
| **"Database not connected" notice** | Missing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (locally in `.env`, remotely in GitHub secrets) |
| **Supabase errors in console (401/403)** | Schema not run, or RLS policy missing — re-run `supabase/schema.sql` |
| **Login works but "Access denied"** | Your email isn't in `admin_users` — run the insert from §2.4 (exact email match) |
| **Image upload fails** | Storage policies are in the schema; re-run it and confirm you're signed in as an allowlisted admin |
| **Contact form fails** | The rate-limit trigger allows 5 messages / 10 min per email; check Network tab for the exact error |
| **HTTPS shows old certificate warning** | Wait for provisioning (up to 24 h), then toggle Enforce HTTPS |
| **Custom domain resets to github.io** | Ensure `CNAME` file (root and `public/`) is committed and Pages source is GitHub Actions |

### Static-site SEO note
Meta tags in `index.html` are served to every crawler. Client-side title/description updates
(via the dashboard) apply after JavaScript runs — Google indexes this fine, but some social
scrapers only read raw HTML, so keep `index.html` metadata current for link previews.

---

## 6. Project structure

```
├── .github/workflows/deploy.yml   # build + deploy to GitHub Pages
├── supabase/schema.sql            # tables, RLS, storage, triggers, seed
├── public/
│   ├── CNAME                      # mwalid.me (custom domain)
│   ├── favicon.svg
│   └── fonts/                     # legacy assets (unused)
├── src/
│   ├── main.jsx                   # entry: theme, styles, providers, HashRouter
│   ├── App.jsx                    # public routes + lazy-loaded admin
│   ├── app/                       # AdminApp (route tree), ProtectedAdminRoute
│   ├── components/
│   │   ├── common/                # SetupNotice, EmptyState, Toggle, ImageUploader…
│   │   ├── layout/                # PublicLayout (navbar + footer)
│   │   ├── portfolio/             # Hero, About, Skills, Project/Service cards, Contact
│   │   └── admin/                 # AdminLayout (sidebar, topbar, unread badge)
│   ├── hooks/                     # useAuth, useSiteSettings, useReveal, useDocumentMeta
│   ├── lib/                       # supabase.js client, constants, utils
│   ├── pages/
│   │   ├── public/                # Home, About, Skills, Projects, ProjectDetail,
│   │   │                          # Services, Contact, NotFound
│   │   └── admin/                 # Dashboard, Projects list/editor, Skills, Services,
│   │                              # Timeline, Messages, Profile, Settings, Login
│   ├── services/contentService.js # every Supabase query (public + admin)
│   └── styles/                    # main.css (design system), portfolio.css, admin.css
├── index.html
├── vite.config.js                 # base: '/' (domain root)
├── CNAME                          # mwalid.me
└── package.json
```

## 7. Scripts

```bash
npm run dev       # Vite dev server
npm run build     # production build → dist/
npm run preview   # serve the production build locally
```

## 8. Security model (summary)

- RLS on every table; **anon** role can only: read published/visible content, read settings,
  and INSERT contact messages (length-validated + rate-limited by trigger).
- Messages: public users can **write only** — no read/update/delete.
- `admin_users` allowlist drives `is_admin()` (SECURITY DEFINER function) used by all admin
  policies; storage uploads/deletes are restricted to admins, public read is allowed for media.
- Frontend never holds a service-role key; admin status is verified server-side, not by UI.
