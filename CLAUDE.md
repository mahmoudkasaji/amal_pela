# Serene Studio - Project Guidelines

## Project Overview
Training portal (React 18 + TypeScript + Vite + Supabase + Zustand + Tailwind v4 + shadcn/ui).
Three user roles: admin, trainer, trainee. Arabic-first UI.

## Tech Stack
- **Frontend:** React 18, TypeScript strict, Vite, React Router 7
- **Backend:** Supabase (Auth, DB, RLS, RPC functions)
- **State:** Zustand (single store in `src/app/store/useDataStore.ts`)
- **UI:** Tailwind CSS v4, shadcn/ui (Radix), Lucide icons
- **Fonts:** IBM Plex Sans Arabic (primary), Cairo (headings)

## Architecture
```
src/app/
  api/           # DB queries (entities.ts) + RPC calls (rpc.ts)
  components/    # Shared UI (shadcn/ui, ProtectedRoute, ErrorBoundary)
  context/       # AuthContext (React Context for auth state)
  data/          # TypeScript types (types.ts), constants (constants.ts)
  layouts/       # Role-specific layouts (Admin, Trainer, Trainee)
  lib/           # Utilities (supabase client, date helpers)
  pages/         # Pages organized by role (admin/, trainer/, trainee/)
  store/         # Zustand store
  routes.tsx     # Route definitions with role guards
```

## Conventions

### Naming
- DB columns: `snake_case`
- TypeScript interfaces/props: `camelCase`
- Mapper functions in `entities.ts` convert between the two
- Files: PascalCase for components, camelCase for utilities

### Data Flow
- **Read:** `entities.ts` fetches from Supabase views/tables -> maps to UI types
- **Write:** `rpc.ts` calls Supabase RPC functions -> Store refreshes affected data
- **State:** Single Zustand store is the source of truth for UI
- Always use `rpc.ts` for mutations, never direct `.insert()/.update()` on tables

### Date Handling
- Always use `today()` from `lib/date.ts` - never `new Date()` directly
- Arabic formatting via `formatShortArabic()` and `formatLongArabic()`
- Work week: Sunday-Thursday (Saudi calendar)

### Auth
- Login via username (resolved to email) or email
- Roles: admin, trainer, trainee
- RLS on Supabase enforces data access - frontend guards are secondary
- Never store passwords in frontend types or state

### Security Rules
- Never hardcode credentials in source code
- Never expose user emails to unauthenticated users
- Unify error messages to prevent user enumeration
- All form inputs must be validated before submission

### Error Handling
- Use `{ ok: boolean, reason?: string }` pattern for operation results
- Use `translateError()` from `rpc.ts` for Arabic error messages from PostgreSQL
- Show toast notifications for user-facing errors
- Use `Promise.allSettled` for parallel fetches to handle partial failures

### Performance
- Use partial refresh (only affected entities) after mutations
- Memoize expensive computations with `useMemo`
- Lazy load page components with `React.lazy()`
- Add pagination for large data sets

## Database
- Migrations in `supabase/migrations/` (sequential, never modify existing ones)
- RLS policies enforce row-level security
- SQL functions use `SECURITY DEFINER` with explicit `search_path`
- Views prefixed with `v_` (e.g., `v_sessions_detail`, `v_bookings_detail`)

## Commands
```bash
bun run dev       # Start dev server (Vite)
bun run build     # Production build
bun run typecheck # TypeScript check (tsc --noEmit)
```
