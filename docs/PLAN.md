# TransitOps — Build Plan (8-hour hackathon)

Derived from [SRS.md](SRS.md). Ordered by demo criticality: the business-rule engine and trip lifecycle are what judges test hardest, so they land before polish.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router, TS)** | One codebase for UI + API, server actions, fast to demo |
| DB | **SQLite via Prisma** | Zero-install persistence, typed client, transactions for status rules |
| Auth | **jose JWT in httpOnly cookie + bcryptjs** | No third-party service, full RBAC control |
| Styling | **Tailwind CSS v4** | Responsive fast; class-based dark mode |
| Charts | **Recharts** | Dashboard/report bonus charts |

## Phases & Timebox

| # | Phase | Time | SRS coverage | Exit criteria |
|---|---|---|---|---|
| 0 | Scaffold + install | 0:20 | — | `next dev` boots |
| 1 | Prisma schema + seed | 0:30 | §5, NFR-6 | All entities; seed covers every state incl. expired-license & suspended drivers |
| 2 | Auth + RBAC | 0:45 | FR-AUTH.1–4 | Login/logout works; middleware blocks anonymous; permission helper enforces matrix |
| 3 | Rule engine + domain APIs | 1:30 | §4 BR-1–10, FR-TRIP/MNT server side | Every BR enforced in transactions; invalid ops return explanatory errors |
| 4 | App shell + Dashboard | 0:45 | FR-DASH.1–2, NFR-1 | KPIs live from DB; type/status filters work; responsive sidebar |
| 5 | Vehicles + Drivers UI | 1:00 | FR-VEH, FR-DRV | CRUD + search/filter/sort; unique-regNo & expiry surfaced |
| 6 | Trips UI | 1:00 | FR-TRIP.1–8 | Eligible-only selectors; dispatch/complete/cancel with auto transitions visible |
| 7 | Maintenance + Fuel/Expense UI | 0:45 | FR-MNT, FR-FUEL | Open/close maintenance flips vehicle status; logs feed costs |
| 8 | Reports + CSV + charts + dark mode | 0:45 | FR-RPT, FR-DASH.3 | km/L, cost, ROI table; CSV downloads; charts render |
| 9 | E2E verify + adversarial rule audit | 0:40 | §9 acceptance script | Full demo script passes in browser; every BR probed adversarially |

## Risk register

- **Windows + native deps** → avoided better-sqlite3; Prisma ships prebuilt engines.
- **Clock overrun** → phases 0–7 are the mandatory deliverables; 8 is bonus scope and can shrink to a plain report table + CSV.
- **Concurrent double-dispatch** → status re-checked inside the Prisma transaction, not just in the form.
- **Demo data gaps** → seed script deliberately creates one of everything (NFR-6).

## Demo accounts (seeded)

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleet@transitops.io | fleet123 |
| Driver (Dispatcher) | driver@transitops.io | driver123 |
| Safety Officer | safety@transitops.io | safety123 |
| Financial Analyst | finance@transitops.io | finance123 |
