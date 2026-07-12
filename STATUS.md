# TransitOps — Project Status & Handoff

> Purpose: complete state-of-the-build reference so any model/agent can pick up work
> without re-reading the whole conversation. Read this + [docs/SRS.md](docs/SRS.md) first.
> Last updated: 2026-07-12.

## 1. What this project is

8-hour hackathon build: fleet/transport operations platform (vehicles, drivers, trips,
maintenance, fuel/expenses, dashboards, reports) with RBAC and hard business rules.
Requirements: [docs/SRS.md](docs/SRS.md) (FR-* requirements, BR-1..BR-10 rules, acceptance script in §9).
Plan/timebox: [docs/PLAN.md](docs/PLAN.md).

## 2. Stack & how to run

- **Next.js 15 (App Router, TS, src dir), Tailwind v4, Prisma + SQLite, jose JWT cookie auth, bcryptjs, recharts.**
- App lives at the **repo root** (package name `transitops`).
- Run: `npm run dev` → **http://localhost:3001** (port 3000 is occupied by another node process on this machine; dev script is `next dev -p 3001`; `.claude/launch.json` config name: `transitops-dev`).
- DB: `prisma/dev.db` already pushed + seeded. Reseed anytime: `npx prisma db seed` (idempotent, wipes+recreates).
- `npm run build` **passes clean** (17 routes) as of last change.

### Demo accounts (all seeded)
| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleet@transitops.io | fleet123 |
| Driver/Dispatcher | driver@transitops.io | driver123 |
| Safety Officer | safety@transitops.io | safety123 |
| Financial Analyst | finance@transitops.io | finance123 |

## 3. Architecture (where everything lives)

- `src/lib/domain.ts` — **rule engine**: ALL business rules BR-1..BR-10 enforced here in Prisma transactions. Trip create/dispatch/complete/cancel, maintenance open/close, vehicle/driver CRUD guards, `dispatchableVehicles()` / `assignableDrivers()` selection pools.
- `src/lib/auth.ts` — login/logout/getSession/requireSession (jose JWT in httpOnly cookie `transitops_session`, secret in `.env`).
- `src/lib/rbac.ts` — `WRITE_ACCESS` matrix + `canWrite`/`requireWrite`. All roles read everything; writes role-owned (vehicles=FM, drivers=SO, trips=FM+Driver, maintenance=FM, expenses=FM+Driver+FA).
- `src/lib/analytics.ts` — `getKpis(filter)`, `getVehicleReport()` (efficiency/opcost/ROI), `getTripTrend()`.
- `src/lib/constants.ts` — role/status enums, labels, badge colors, `fmtMoney`/`fmtDate`.
- `src/lib/errors.ts` — `DomainError` (user-safe message) + `toActionResult` wrapper.
- `src/actions/*.ts` — server actions per module; every mutation calls `authz(module)` (session + RBAC), returns `{ok:true}|{ok:false,error}`. `useActionState`-compatible signatures.
- `src/middleware.ts` — JWT check on every route, redirects to `/login`.
- `src/app/(auth)/login` — login page. `src/app/(app)/*` — dashboard, vehicles, drivers, trips, maintenance, expenses, reports (+ `/reports/export` CSV route handler).
- `src/components/ui/*` — Badge, Button, Card, Modal, ErrorBanner, FormField/Input/Select/Textarea. `Sidebar.tsx`, `DarkModeToggle.tsx`.
- Seed (`prisma/seed.ts`) deliberately covers every state: expired-license driver (John D'Souza), suspended (Sunita), off-duty (Vikram), expiring-soon (Ravi), vehicle IN_SHOP (Truck-04 w/ open maintenance), RETIRED (Van-09), one DISPATCHED trip (Truck-01 + Priya are ON_TRIP), one DRAFT, one CANCELLED, 6 COMPLETED with fuel logs, expenses.

## 4. Status — DONE

- [x] SRS ([docs/SRS.md](docs/SRS.md)) and plan ([docs/PLAN.md](docs/PLAN.md))
- [x] Scaffold, deps installed, DB pushed + seeded
- [x] Auth (email/password, JWT cookie), middleware protection, RBAC matrix enforced server-side
- [x] Rule engine: BR-1..BR-10 all implemented transactionally in `domain.ts`
- [x] All UI pages: dashboard (KPIs + filters + chart + license alerts), vehicles CRUD (+search/filter/sort/retire/reactivate/delete), drivers CRUD (+status actions, expiry flags, safety score bars), trips (create w/ eligible-only selectors, dispatch/complete/cancel), maintenance (open/close), fuel & expenses (tabs + modals), reports (summary tiles, 2 charts, per-vehicle table, CSV export)
- [x] Dark mode, responsive sidebar (bonus items)
- [x] `npm run build` passes with zero type errors
- [x] Verified in browser so far: login works (fleet manager), dashboard KPIs correct vs seed (7 active / 5 available / 1 in-shop / 1 dispatched / 1 draft / 4 on duty / 14.3% utilization), license alerts correct, **BR-2/3/4 confirmed** — trip form selectors exclude On-Trip/In-Shop/Retired vehicles and expired/suspended/on-trip drivers

## 5. Status — VERIFICATION COMPLETE ✅

All 12 planned tasks are done. Verification results (2026-07-12):

- **`scripts/verify-rules.ts` — 33/33 PASS** (run: `NODE_OPTIONS="--conditions=react-server" npx tsx scripts/verify-rules.ts`, then reseed with `npx prisma db seed` since it mutates data). Covers BR-1..BR-10 adversarially: duplicate regNo, in-shop/retired vehicles blocked, expired/suspended drivers blocked, 620kg-in-500kg rejected, dispatch locks both, double-booking blocked, odometer rollback blocked, complete/cancel restore statuses, maintenance open→IN_SHOP/close→AVAILABLE, on-trip vehicle can't enter maintenance, RBAC matrix (analyst blocked from vehicles, dispatcher from drivers, both allowed where intended).
- **In-browser (UI) verified**: login/logout; dashboard KPIs match seed; trip-form selectors exclude ineligible vehicles/drivers (BR-2/3/4); Dispatch button → vehicle On Trip everywhere; Complete modal → vehicle+driver Available, odometer 23,370, actualKm 270, fuel log auto-created; duplicate regNo shows friendly error banner; CSV export returns proper text/csv attachment with live data; dark mode toggles + persists; sidebar collapses to hamburger below lg.
- **Bug found & fixed during verification**: Prisma SQLite doesn't support `mode: "insensitive"` — removed from search filters in vehicles/drivers/trips pages (SQLite LIKE is case-insensitive anyway). `npm run build` re-verified clean after fix… (rerun if further edits are made).

## Remaining (optional, only if time)

- PDF export of report, email-reminder stub for expiring licenses, vehicle document upload, README for judges.
- Git commit of the build (nothing committed this session; repo had 2 prior commits).

## 6. Known quirks / gotchas

- Port 3000 is taken by an unrelated node process — always use 3001.
- Browser-pane screenshots time out on this machine; use `read_page`/`get_page_text` instead (they work fine).
- `revalidatePath("/", "layout")` is used after every mutation → whole app refreshes; cheap at this scale, don't "optimize" during the hackathon.
- Vehicle statuses ON_TRIP/IN_SHOP are system-managed; never add UI that sets them directly.
- `assignableDrivers()` filters expired licenses in JS (not SQL) — fine at this scale.
- The Excalidraw mockup link in the brief never rendered in the browser pane (timed out); UI was built to the SRS instead.
