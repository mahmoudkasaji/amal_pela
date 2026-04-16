# Serene Studio (Amal Pilates) — Developer Guide

بوابة إدارة وتشغيل نادي تدريب بيلاتس. Production-ready React + Supabase app.

---

## Stack

- **Frontend:** React 18, TypeScript 5.6, Vite 6, React Router 7
- **Backend:** Supabase (PostgreSQL + Auth + RLS + RPCs)
- **State:** Zustand
- **UI:** Tailwind CSS v4 + shadcn/ui (Radix) + Lucide icons
- **Charts:** Recharts (code-split in a separate chunk)
- **Fonts:** IBM Plex Sans Arabic + Cairo (Arabic-first)
- **Deployment:** Vercel

---

## Quick start

```bash
bun install            # install deps
cp .env.local.example .env.local   # fill in Supabase URL + anon key
bun run dev            # start dev server at http://localhost:5173
bun run typecheck      # TypeScript check
bun run lint           # ESLint
bun run format         # Prettier
bun run build          # production build
```

---

## Project structure

```
src/app/
├── api/                       # طبقة الـ API (domain-split)
│   ├── _shared.ts             # RpcResult + translateError
│   ├── auth.api.ts            # resolveLoginEmail
│   ├── branches.api.ts        # Branch CRUD
│   ├── session-types.api.ts   # SessionType CRUD
│   ├── club-settings.api.ts   # ClubSettings
│   ├── trainees.api.ts        # كل RPCs المتدربات
│   ├── trainers.api.ts        # كل RPCs المدربات
│   ├── sessions.api.ts        # جلسات
│   ├── bookings.api.ts        # حجوزات
│   ├── packages.api.ts        # باقات
│   ├── ledger.api.ts          # سجل رصيد
│   └── index.ts               # barrel re-exports
├── components/                # UI مشترك
│   ├── ErrorBoundary.tsx      # top-level boundary
│   ├── RouteErrorBoundary.tsx # per-route (admin/trainer/trainee) boundary
│   ├── ProtectedRoute.tsx     # role-based route guard
│   ├── skeletons/Skeleton.tsx # loading placeholders
│   └── ui/                    # shadcn components
├── context/
│   └── AuthContext.tsx
├── data/
│   ├── types.ts               # TypeScript interfaces
│   └── constants.ts           # ACCOUNT_STATUS_CONFIG, LEVEL_MAP, STATUS_CONFIG
├── layouts/                   # Admin/Trainer/Trainee layouts
├── lib/
│   ├── supabase.ts            # Supabase client (fails gracefully on missing env)
│   ├── date.ts                # دوال التاريخ (تستخدم today() دائماً)
│   ├── csv.ts                 # تصدير CSV
│   ├── retry.ts               # exponential-backoff retry helper
│   └── log.ts                 # centralized logger (wired for Sentry later)
├── pages/
│   ├── landing/               # Hero, About, Sessions, Packages, ...
│   ├── login/                 # VisualPanel, RoleSelector, LoginForm
│   ├── admin/
│   │   ├── trainees/          # TraineesTable/Cards/Filters + Modals
│   │   └── sessions/          # SessionsList + Add/EditSessionModal
│   ├── trainer/
│   └── trainee/
├── store/
│   ├── useDataStore.ts        # الـ Zustand store الرئيسي
│   └── loaders.ts             # role-based data loaders
├── routes.tsx                 # تعريف المسارات (lazy-loaded)
└── App.tsx
```

---

## Conventions

### Naming
- DB columns: `snake_case`
- TS interfaces/props: `camelCase`
- Mappers in `*.api.ts` handle the conversion

### Data flow
- **Read:** Supabase view/table → `mapX` in `*.api.ts` → Zustand store → UI
- **Write:** UI → RPC wrapper in `*.api.ts` → DB → partial store refresh
- **Never** call `supabase.from().update()` directly outside `api/`
- All writes go through RPCs wherever possible (security + idempotency)

### AccountStatus (Phase 2 fix)
- DB enum: `'active' | 'suspended' | 'inactive'`
- UI matches exactly. Use `ACCOUNT_STATUS_CONFIG` from `data/constants.ts`
- Historical bug: mappers used to silently collapse `suspended → active` for trainers. Fixed.

### Role-based loading (Phase 3)
- `initialize(role)` in the store picks the right loader:
  - **Admin:** 6 queries (full refresh)
  - **Trainer:** 3 queries (sessions, bookings, trainees)
  - **Trainee:** 4 queries (sessions, bookings, packages, ledger)
- Never assume a store entity is loaded unless the current role loads it.

### Dates
- Always use `today()` from `lib/date.ts` — never `new Date()` directly.
- Arabic formatting via `formatShortArabic()` / `formatLongArabic()`.
- Work week: Sunday–Thursday (Saudi calendar).

### Auth
- Login via username (resolved to email by `resolve_login_email` RPC) or email directly.
- Roles: `admin`, `trainer`, `trainee`.
- RLS in Supabase is the real security boundary. Frontend guards are defense-in-depth.
- Never store passwords in frontend types/state beyond form-local drafts.

### Security rules
- No hardcoded credentials in source (Phase 1 fix).
- Unified error messages ("اسم المستخدم أو كلمة المرور غير صحيحة") — prevents user enumeration.
- `resolve_login_email` returns a fake email on miss to prevent enumeration via direct RPC.
- All form inputs validated (min length, price > 0, no past session dates, etc.).

### Error handling
- Use `{ ok: boolean, reason?: string }` for operation results.
- `translateError()` in `api/_shared.ts` passes through P0001 Arabic messages.
- Every route is wrapped in `RouteErrorBoundary` so errors are scoped.
- Use `log.error(msg, err, ctx)` instead of `console.error`. Register a Sentry reporter via `setErrorReporter()`.
- Use `withRetry(() => fn())` for transient network operations.

### Performance
- Bundle split via `vite.config.ts` manualChunks: `react-vendor`, `supabase`, `charts`, `radix`, `motion`, `icons`, `vendor`.
- `index.js` is ~80 KB (down from 635 KB pre-Phase 3).
- `charts` (Recharts) loaded lazily only for Dashboard/Reports.
- Images on Landing/Login use `loading="lazy"` + `decoding="async"`; hero images use `fetchpriority="high"`.
- Partial refreshes after mutations (`refreshBookings`, etc.) — never a full 6-query reload.

### Page size rule
- Any `.tsx` > 300 lines should be split into focused components.
- Current maxima (Phase 5):
  - `LandingPage.tsx`: 23 lines (composition)
  - `LoginPage.tsx`: 126 lines
  - `admin/Trainees.tsx`: 133 lines
  - `admin/Sessions.tsx`: 261 lines

---

## Database

- Migrations in `supabase/migrations/` (see `migrations/README.md`).
- **Never modify existing migration files** — only add new ones.
- All RPCs are `SECURITY DEFINER` with explicit `search_path`.
- Views prefixed with `v_` (e.g., `v_sessions_detail`).
- Idempotency: every migration after 001_schema uses `CREATE OR REPLACE`, `IF NOT EXISTS`, etc.

### Applied production-hardening migrations
| # | File | Purpose |
|---|------|---------|
| 011 | `security_hardening.sql` | Anti-enumeration + STABLE hours_until + mark_attendance guard |
| 012 | `db_integrity_fixes.sql` | CASCADE→RESTRICT, missing indexes, sessions.type FK |
| 013 | `subscription_expiry.sql` | `expire_subscriptions()` for pg_cron |
| 014 | `admin_update_rpcs.sql` | admin_update_trainee/trainer (replaces direct writes) |

---

## Deployment

The project is configured for **Vercel** (`vercel.json`):

1. Import the GitHub repo on Vercel.
2. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Build command auto-detected: `bun run build`.
4. Output: `dist/`.
5. SPA rewrites handled by `vercel.json`.

After deploy, update Supabase Auth → URL Configuration:
- Site URL: `https://<app>.vercel.app`
- Redirect URLs: `https://<app>.vercel.app/**`

---

## Production-readiness checklist

- [x] No hardcoded credentials
- [x] Anti-user-enumeration in login
- [x] RLS on every table
- [x] AccountStatus enum unified (3 states) across DB + UI
- [x] Role-based data loading (min 3 queries on trainer/trainee)
- [x] Manual chunks — index.js < 100 KB
- [x] Lazy image loading
- [x] Unused deps removed (react-slick, react-dnd, canvas-confetti, ...)
- [x] Direct DB writes removed from store — all writes via RPC
- [x] Large pages split (Landing, Login, Trainees, Sessions)
- [x] API layer split into 11 domain modules
- [x] Migrations documented (`migrations/README.md`)
- [x] RouteErrorBoundary per role
- [x] `withRetry` + `log` helpers
- [x] Skeleton loaders
- [x] ESLint + Prettier + EditorConfig

---

## Contributing

1. Start from `main`.
2. Run `bun run typecheck && bun run lint && bun run format:check` before commit.
3. Follow the file-size rule (no `.tsx` > 300 lines).
4. Keep Arabic text exact — no "improvements" to copy.
5. For new RPCs, always create a migration file; never modify an existing one.
