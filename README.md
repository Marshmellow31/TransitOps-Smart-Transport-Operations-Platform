# 🚌 TransitOps — Smart Transport Operations Platform

> A complete fleet-operations platform built in a single 8-hour hackathon: vehicles, drivers, dispatch, maintenance, fuel & expenses, live KPIs and analytics — with **every business rule enforced server-side in transactions** and **proven by a 33-check adversarial test suite (33/33 passing)**.

---

## ⚡ Quick Start

```bash
npm install
npx prisma db push && npx prisma db seed   # creates + seeds SQLite (already done in this repo)
npm run dev                                # → http://localhost:3001
```

### Demo accounts (one per role)

| Role | Email | Password |
|---|---|---|
| 🚛 Fleet Manager | `fleet@transitops.io` | `fleet123` |
| 🗺️ Driver (Dispatcher) | `driver@transitops.io` | `driver123` |
| 🛡️ Safety Officer | `safety@transitops.io` | `safety123` |
| 💰 Financial Analyst | `finance@transitops.io` | `finance123` |

Log in as different roles to watch the UI reshape itself — buttons, forms and actions appear only for the role that owns them, and the server independently enforces the same matrix.

---

## ✅ What was built (100% of mandatory deliverables + 5 bonus features)

### Mandatory
| Deliverable | Status | Where to see it |
|---|---|---|
| Responsive web interface | ✅ | Collapsible sidebar, mobile-first tables, works at 375px |
| Authentication + RBAC | ✅ | Email/password login, JWT httpOnly cookie, 4-role write matrix |
| Vehicle CRUD | ✅ | `/vehicles` — unique reg. no., retire/reactivate lifecycle |
| Driver CRUD | ✅ | `/drivers` — license expiry flags, safety-score bars, suspend/off-duty |
| Trip management + validations | ✅ | `/trips` — eligible-only selectors, capacity check, full lifecycle |
| Automatic status transitions | ✅ | Dispatch/complete/cancel/maintenance all cascade automatically |
| Maintenance workflow | ✅ | `/maintenance` — open → vehicle In Shop, close → Available |
| Fuel & expense tracking | ✅ | `/expenses` — fuel logs (auto + manual), tolls/insurance/repairs |
| Dashboard with KPIs | ✅ | 7 live KPIs + type/status filters + license-expiry alerts |

### Bonus
| Feature | Status |
|---|---|
| 📊 Charts & visual analytics (trip trend, cost breakdown, fuel efficiency) | ✅ Recharts |
| ⬇️ CSV export of the full analytics report | ✅ `/reports/export` |
| 🔍 Search, filters & sorting on every registry | ✅ |
| 🌙 Dark mode (persisted, no flash-of-wrong-theme) | ✅ |
| ⚠️ License-expiry early-warning (≤30-day flags + dashboard alert panel) | ✅ |

---

## 🧠 How it works — the architecture

```
Browser ──► Next.js middleware (JWT check on EVERY route)
              │
              ▼
        Server Components (read)          Server Actions (write)
              │                                  │
              │                          authz() = session + RBAC gate
              │                                  │
              ▼                                  ▼
        analytics.ts  ◄──────────────  domain.ts  ← THE RULE ENGINE
        (KPIs, ROI, efficiency)        (BR-1..BR-10, Prisma transactions)
              │                                  │
              └──────────────► SQLite via Prisma ◄┘
```

**The key design decision:** all 10 mandatory business rules live in **one file — [`src/lib/domain.ts`](src/lib/domain.ts)** — and every mutation goes through it inside a **database transaction**. The UI *also* filters (you never even see an ineligible vehicle in a dropdown), but the UI is treated as a convenience, never as the authority. You cannot bypass a rule with a crafted request, a stale form, or a race condition.

### The rule engine (BR-1 … BR-10)

| # | Rule | How it's enforced |
|---|---|---|
| BR-1 | Registration number unique | Checked in domain layer **and** DB unique constraint |
| BR-2 | Retired / In-Shop vehicles never dispatchable | Excluded from selection pool + re-rejected at dispatch |
| BR-3 | Expired-license / suspended drivers unassignable | Pool filter + hard server check with the expiry date in the error |
| BR-4 | No double-booking of vehicle/driver | Only `AVAILABLE` status passes eligibility |
| BR-5 | Cargo ≤ max load capacity | Validated at creation **and again at dispatch** |
| BR-6 | Dispatch ⇒ vehicle + driver `On Trip` | Single transaction: trip + vehicle + driver update together |
| BR-7 | Complete ⇒ both `Available`, odometer rolls forward, fuel logged | One transaction: status + odometer + auto fuel-log + actual km |
| BR-8 | Cancel dispatched ⇒ both restored | Transaction; draft-cancel skips the restore correctly |
| BR-9 | Open maintenance ⇒ vehicle `In Shop` | Transaction; On-Trip vehicles are refused maintenance |
| BR-10 | Close maintenance ⇒ `Available` (unless retired) | Also checks for *other* still-open records before releasing |

**Why re-validate at dispatch when creation already validated?** Because state changes between draft and dispatch: the driver's license may have expired, the vehicle may have entered the shop. The engine re-runs the *entire* eligibility check inside the dispatch transaction — a stale draft can never sneak an invalid dispatch through.

### Why these choices

- **Next.js 15 App Router** — one codebase serves UI and API; server components read the DB directly (no API boilerplate), server actions mutate through the rule engine. Fastest possible path from rule to pixel in 8 hours.
- **Prisma + SQLite** — zero-setup persistence with real **transactions**, which the status-cascade rules genuinely need. Swapping to Postgres later is a one-line datasource change.
- **jose JWT in an httpOnly cookie** — stateless sessions verified in Edge middleware on *every* request; no session table, no third-party auth service, nothing for a judge's network tab to steal.
- **RBAC as a declarative matrix** ([`src/lib/rbac.ts`](src/lib/rbac.ts)) — every role can *read* everything (operational visibility is the product's point), writes are role-owned. One `requireWrite()` call guards every action; the same matrix drives which buttons render.
- **`DomainError` pattern** — rules throw human-readable errors ("Cargo 620 kg exceeds Van-05's maximum load capacity of 500 kg") that surface directly in the form banner. Every blocked action explains *why*.

---

## 🔬 How I know it works — adversarial verification

Instead of hoping the rules hold, the repo ships **[`scripts/verify-rules.ts`](scripts/verify-rules.ts)**: a 33-check adversarial suite that actively tries to *break* every rule against the real database — duplicate registrations, overweight cargo, expired licenses, double-bookings, odometer rollbacks, cancelling completed trips, maintenance on moving vehicles, forbidden role writes.

```bash
NODE_OPTIONS="--conditions=react-server" npx tsx scripts/verify-rules.ts
# ===== 33 passed, 0 failed =====
npx prisma db seed   # restore demo data afterwards
```

On top of that, the full SRS §9 acceptance script was walked end-to-end in the browser: create → dispatch → complete → maintenance → reports, plus RBAC spot-checks per role, CSV export, dark mode and responsive layout.

## 📚 Engineering process

This wasn't code-first. The build followed a spec-driven pipeline, all committed in-repo:

1. **[docs/SRS.md](docs/SRS.md)** — full Software Requirements Specification: numbered functional requirements (FR-*), the 10 business rules (BR-*), data model, NFRs, permission matrix, and an acceptance-test script derived from the brief's example workflow.
2. **[docs/PLAN.md](docs/PLAN.md)** — timeboxed 8-hour build plan mapped to SRS IDs, with a risk register (each risk in it actually materialized and was pre-mitigated — e.g. avoiding native SQLite bindings on Windows).
3. **Seed data engineered for demonstrability** ([prisma/seed.ts](prisma/seed.ts)) — deliberately contains one of *everything*: an expired-license driver, a suspended driver, a vehicle in the shop with an open work order, a retired van, trips in all four lifecycle states. Every rule can be demonstrated in seconds without setup.
4. **[STATUS.md](STATUS.md)** — running build-state handoff doc.

## 🗂️ Project structure

```
docs/SRS.md, docs/PLAN.md      # spec & plan (read these first)
prisma/schema.prisma, seed.ts  # 7 entities + demo-ready seed
scripts/verify-rules.ts        # 33-check adversarial rule suite
src/middleware.ts              # JWT gate on every route
src/lib/domain.ts              # ⭐ the rule engine (BR-1..BR-10, transactional)
src/lib/rbac.ts                # role → write-permission matrix
src/lib/auth.ts                # login/logout/session (jose + bcrypt)
src/lib/analytics.ts           # KPIs, fuel efficiency, op-cost, ROI
src/actions/*.ts               # server actions (all gated by authz())
src/app/(auth)/login           # login page
src/app/(app)/…                # dashboard, vehicles, drivers, trips,
                               # maintenance, expenses, reports (+ CSV route)
src/components/…               # reusable UI kit (badges, modals, forms)
```

## 📈 Analytics formulas (Reports page)

| Metric | Formula |
|---|---|
| Fuel Efficiency | Σ actual trip distance ÷ Σ fuel liters (km/L) |
| Fleet Utilization | vehicles On Trip ÷ non-retired vehicles × 100 |
| Operational Cost | fuel + maintenance + other expenses, per vehicle |
| Vehicle ROI | (revenue − (maintenance + fuel)) ÷ acquisition cost |

---

**Stack:** Next.js 15 · TypeScript · Prisma + SQLite · Tailwind CSS v4 · jose (JWT) · bcryptjs · Recharts

Built in 8 hours, spec-first, rule-engine-first, verified adversarially. 🏁
