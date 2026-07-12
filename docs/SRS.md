# Software Requirements Specification (SRS)

## TransitOps — Smart Transport Operations Platform

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | 2026-07-12 |
| **Source** | Hackathon brief "TransitOps – Smart Transport Operations Platform" (8-hour build) |
| **Status** | Baseline for implementation |

---

## 1. Introduction

### 1.1 Purpose
This document specifies the complete functional and non-functional requirements for **TransitOps**, a centralized web platform that digitizes a logistics company's transport operations: vehicle registry, driver management, trip dispatching, maintenance, fuel & expense tracking, and operational analytics. It is the single source of truth for what the hackathon build must deliver and how it will be judged (acceptance criteria in §9).

### 1.2 Scope
TransitOps replaces spreadsheets and manual logbooks with a role-aware web application that:

- Manages the full lifecycle of **vehicles** (registration → operation → maintenance → retirement) and **drivers** (onboarding → duty → suspension).
- Handles **trip creation and dispatch** with hard validation of business rules (capacity, license validity, availability).
- Automates **status transitions** across vehicles, drivers, trips, and maintenance so records can never disagree with each other.
- Tracks **fuel and expenses** and computes per-vehicle operational cost.
- Surfaces **KPIs and analytics** (fleet utilization, fuel efficiency, operational cost, vehicle ROI) with CSV export.

Out of scope: real GPS tracking, external integrations, payments, mobile native apps.

### 1.3 Definitions
| Term | Meaning |
|---|---|
| **RBAC** | Role-Based Access Control |
| **Dispatch** | Transition of a trip from Draft to Dispatched; locks vehicle + driver |
| **Fleet Utilization** | % of non-retired vehicles currently On Trip |
| **Operational Cost** | Fuel cost + maintenance cost (+ other logged expenses) per vehicle |
| **ROI** | (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost |

---

## 2. Overall Description

### 2.1 Product Perspective
A self-contained, responsive web application with a server-side rule engine. All business rules (§4) are enforced **on the server** inside transactions — the UI additionally prevents invalid selections, but the server is the authority.

### 2.2 User Classes and Roles
Four roles, per the brief:

| Role | Responsibility |
|---|---|
| **Fleet Manager** | Fleet assets, maintenance, vehicle lifecycle, operational efficiency |
| **Driver (Dispatcher)** | Creates trips, assigns vehicles and drivers, monitors active deliveries |
| **Safety Officer** | Driver compliance, license validity, safety scores |
| **Financial Analyst** | Expenses, fuel consumption, maintenance costs, profitability |

**Permission matrix** (R = read, W = read+write):

| Module | Fleet Manager | Driver | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Dashboard | R | R | R | R |
| Vehicles | **W** | R | R | R |
| Drivers | R | R | **W** | R |
| Trips | **W** | **W** | R | R |
| Maintenance | **W** | R | R | R |
| Fuel & Expenses | **W** | **W** | R | **W** |
| Reports | R | R | R | **W** (export) |

*All roles may view everything (operational visibility is the point); write access is restricted to the owning role. Fleet Manager is the administrative superset for assets.*

### 2.3 Operating Environment
- Modern evergreen browsers, desktop and mobile widths (responsive).
- Single-node deployment; SQLite persistence (hackathon constraint — swappable later).

### 2.4 Assumptions
- Seeded accounts exist for each role (no self-registration; account creation is an admin concern out of scope).
- Trip revenue is entered on the trip (needed for ROI).
- Distances in km, fuel in liters, currency in ₹ (display-only concern).

---

## 3. Functional Requirements

Requirements are numbered `FR-<module>.<n>`. **[M]** = mandatory deliverable, **[B]** = bonus.

### 3.1 Authentication & RBAC (AUTH)
- **FR-AUTH.1 [M]** Users sign in with email + password. Passwords stored hashed (bcrypt).
- **FR-AUTH.2 [M]** Sessions persist via secure, httpOnly cookie; logout invalidates the session.
- **FR-AUTH.3 [M]** Every application route and API endpoint rejects unauthenticated access (redirect to login / 401).
- **FR-AUTH.4 [M]** Every mutating endpoint enforces the role permission matrix (§2.2); unauthorized mutations return 403 and are hidden/disabled in the UI.

### 3.2 Dashboard (DASH)
- **FR-DASH.1 [M]** KPI cards: Active Vehicles, Available Vehicles, Vehicles in Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization (%).
  - *Active Vehicles* = non-retired vehicles; *Active Trips* = Dispatched; *Pending Trips* = Draft; *Drivers On Duty* = Available + On Trip; *Fleet Utilization* = On Trip ÷ non-retired.
- **FR-DASH.2 [M]** Filters by vehicle type and status recompute the vehicle KPIs.
- **FR-DASH.3 [B]** Charts: trips per day, cost breakdown, status distribution.

### 3.3 Vehicle Registry (VEH)
- **FR-VEH.1 [M]** CRUD for vehicles with fields: Registration Number (**unique**), Name/Model, Type (Truck / Van / Mini Truck / Bike…), Max Load Capacity (kg), Odometer (km), Acquisition Cost, Status.
- **FR-VEH.2 [M]** Status ∈ {Available, On Trip, In Shop, Retired}. On Trip / In Shop are **system-managed** (set by dispatch/maintenance flows, not directly editable); Retired is a manual lifecycle action.
- **FR-VEH.3 [M]** Duplicate registration numbers rejected server-side with a clear error (BR-1).
- **FR-VEH.4 [B]** Search by registration/name; filter by type/status; sortable columns.

### 3.4 Driver Management (DRV)
- **FR-DRV.1 [M]** CRUD for drivers with fields: Name, License Number, License Category, License Expiry Date, Contact Number, Safety Score (0–100), Status.
- **FR-DRV.2 [M]** Status ∈ {Available, On Trip, Off Duty, Suspended}. On Trip is system-managed; Off Duty/Suspended are set by the Safety Officer.
- **FR-DRV.3 [M]** Expired licenses are visually flagged (list + selection pools).
- **FR-DRV.4 [B]** Expiring-soon (≤30 days) warning; search/filter/sort.

### 3.5 Trip Management (TRIP)
- **FR-TRIP.1 [M]** Create trip: source, destination, vehicle, driver, cargo weight (kg), planned distance (km), expected revenue.
- **FR-TRIP.2 [M]** Vehicle selector lists **only** vehicles with status Available (BR-2, BR-4). Driver selector lists **only** drivers with status Available *and* unexpired license (BR-3, BR-4).
- **FR-TRIP.3 [M]** Cargo weight must be ≤ selected vehicle's max load capacity; violation blocks creation/dispatch with an explanatory error (BR-5).
- **FR-TRIP.4 [M]** Lifecycle: **Draft → Dispatched → Completed**, with **Cancelled** reachable from Draft and Dispatched. No other transitions permitted.
- **FR-TRIP.5 [M]** Dispatch re-validates all rules atomically, then sets vehicle + driver to On Trip (BR-6).
- **FR-TRIP.6 [M]** Complete requires final odometer (≥ start odometer) and fuel consumed; updates vehicle odometer, restores vehicle + driver to Available (BR-7), records actual distance.
- **FR-TRIP.7 [M]** Cancelling a Dispatched trip restores vehicle + driver to Available (BR-8).
- **FR-TRIP.8 [B]** Trip list filterable by status; badge-coded lifecycle.

### 3.6 Maintenance (MNT)
- **FR-MNT.1 [M]** Create maintenance records: vehicle, type/description, cost, start date, status (Open/Closed).
- **FR-MNT.2 [M]** Creating an **open** record sets the vehicle to In Shop, removing it from dispatch pools (BR-9). Vehicles currently On Trip cannot enter maintenance.
- **FR-MNT.3 [M]** Closing the record restores the vehicle to Available unless it is Retired (BR-10).
- **FR-MNT.4 [M]** Maintenance cost feeds per-vehicle operational cost (§3.7, §3.8).

### 3.7 Fuel & Expense Management (FUEL)
- **FR-FUEL.1 [M]** Record fuel logs per vehicle: liters, cost, date (auto-created from trip completion, and manually).
- **FR-FUEL.2 [M]** Record other expenses per vehicle: category (Toll, Repair, Insurance, Other), amount, date, note.
- **FR-FUEL.3 [M]** System computes per-vehicle **total operational cost = fuel + maintenance (+ other expenses)**, always current.

### 3.8 Reports & Analytics (RPT)
- **FR-RPT.1 [M]** Per-vehicle report: Fuel Efficiency = distance ÷ liters (km/L), Operational Cost, ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost, Fleet Utilization.
- **FR-RPT.2 [M]** CSV export of the report table.
- **FR-RPT.3 [B]** PDF export.
- **FR-RPT.4 [B]** Charts (cost per vehicle, efficiency trend).

---

## 4. Mandatory Business Rules

The rule engine enforces these server-side, atomically, regardless of what the UI shows:

| ID | Rule |
|---|---|
| **BR-1** | Vehicle registration number is unique. |
| **BR-2** | Retired or In Shop vehicles never appear in dispatch selection. |
| **BR-3** | Drivers with expired licenses or Suspended status cannot be assigned to trips. |
| **BR-4** | A driver or vehicle already On Trip cannot be assigned to another trip. |
| **BR-5** | Cargo weight ≤ vehicle max load capacity. |
| **BR-6** | Dispatching a trip sets vehicle and driver status to On Trip. |
| **BR-7** | Completing a trip restores vehicle and driver to Available. |
| **BR-8** | Cancelling a dispatched trip restores vehicle and driver to Available. |
| **BR-9** | Creating an active maintenance record sets the vehicle to In Shop. |
| **BR-10** | Closing maintenance restores the vehicle to Available (unless Retired). |

*Derived guards:* BR-2/3/4/5 are validated **both** at trip creation and again at dispatch (state may have changed in between); trip completion also re-checks the trip is currently Dispatched.

---

## 5. Data Model

Entities per the brief: **Users, Roles, Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, Expenses.**

```
User(id, name, email UNIQUE, passwordHash, role ENUM[FLEET_MANAGER, DRIVER, SAFETY_OFFICER, FINANCIAL_ANALYST])

Vehicle(id, regNo UNIQUE, name, type, maxLoadKg, odometerKm, acquisitionCost,
        status ENUM[AVAILABLE, ON_TRIP, IN_SHOP, RETIRED], region, createdAt)

Driver(id, name, licenseNo, licenseCategory, licenseExpiry DATE, phone,
       safetyScore INT, status ENUM[AVAILABLE, ON_TRIP, OFF_DUTY, SUSPENDED], createdAt)

Trip(id, source, destination, vehicleId→Vehicle, driverId→Driver, cargoKg,
     plannedKm, actualKm?, revenue, startOdometer?, endOdometer?, fuelConsumedL?,
     status ENUM[DRAFT, DISPATCHED, COMPLETED, CANCELLED],
     createdAt, dispatchedAt?, completedAt?)

MaintenanceLog(id, vehicleId→Vehicle, type, description, cost, startDate, endDate?,
               status ENUM[OPEN, CLOSED])

FuelLog(id, vehicleId→Vehicle, tripId?→Trip, liters, cost, date)

Expense(id, vehicleId→Vehicle, category ENUM[TOLL, REPAIR, INSURANCE, OTHER], amount, date, note?)
```

Role is stored as an enum on User (a separate Roles table adds nothing at this scale while still satisfying the "Users, Roles" entity requirement semantically).

---

## 6. Non-Functional Requirements

- **NFR-1 Responsive:** usable at 375 px (mobile) through desktop; sidebar collapses on small screens.
- **NFR-2 Integrity:** all multi-record status transitions run in DB transactions; concurrent dispatch of the same vehicle/driver cannot double-book (row status re-checked inside the transaction).
- **NFR-3 Security:** hashed passwords, httpOnly signed session cookie, server-side authorization on every mutation, input validation on every endpoint.
- **NFR-4 Usability:** every blocked action explains *why* (e.g., "Cargo 620 kg exceeds Van-05 capacity 500 kg").
- **NFR-5 Performance:** dashboard and lists load in <2 s with seeded data volumes.
- **NFR-6 Demo-readiness:** seeded data covers every state (expired license, suspended driver, vehicle in shop, trips in all four states) so every rule is demonstrable without setup.

---

## 7. User Interface

Screens: Login · Dashboard · Vehicles (list + form) · Drivers (list + form) · Trips (list + create + detail/actions) · Maintenance (list + form) · Fuel & Expenses (list + forms) · Reports.
Shared shell: sidebar navigation (role-aware), top bar with user/role and logout, status badges color-coded consistently across modules. Bonus: dark mode toggle.
Reference mockup: https://link.excalidraw.com/l/65VNwvy7c4X/1FHGDNgD2td

---

## 8. Analytics Formulas

| Metric | Formula |
|---|---|
| Fuel Efficiency (vehicle) | Σ actual trip distance ÷ Σ fuel liters (km/L) |
| Fleet Utilization | vehicles On Trip ÷ non-retired vehicles × 100 |
| Operational Cost (vehicle) | Σ fuel cost + Σ maintenance cost (+ Σ other expenses) |
| Vehicle ROI | (Σ trip revenue − (Σ maintenance + Σ fuel)) ÷ acquisition cost |

---

## 9. Acceptance Criteria (Demo Script)

The brief's example workflow, used as the end-to-end acceptance test:

1. Register vehicle **Van-05**, capacity 500 kg → appears with status *Available*.
2. Register driver **Alex** with valid license → *Available*.
3. Create trip with cargo **450 kg** → system validates 450 ≤ 500, trip saved as *Draft*.
4. Attempt cargo **620 kg** → creation **blocked** with capacity error. *(negative test)*
5. Dispatch the 450 kg trip → vehicle & driver flip to *On Trip*; both disappear from new-trip selectors.
6. Complete trip with final odometer + fuel consumed → both restored to *Available*; odometer updated; fuel log created.
7. Create maintenance record (Oil Change) for Van-05 → status *In Shop*; hidden from dispatch.
8. Close maintenance → *Available* again.
9. Reports show updated operational cost and fuel efficiency; dashboard KPIs reflect every step.
10. Log in as each role → module write access matches the permission matrix.

## 10. Deliverables Checklist

| Deliverable | Covered by |
|---|---|
| Responsive web interface | NFR-1, §7 |
| Authentication with RBAC | FR-AUTH.1–4 |
| CRUD for Vehicles and Drivers | FR-VEH, FR-DRV |
| Trip management with validations | FR-TRIP.1–7 |
| Automatic status transitions | BR-6–BR-10 |
| Maintenance workflow | FR-MNT |
| Fuel & expense tracking | FR-FUEL |
| Dashboard with KPIs | FR-DASH.1–2 |
| **Bonus:** charts, CSV/PDF export, search/filter/sort, dark mode | FR-DASH.3, FR-RPT.2–4, FR-VEH.4, FR-DRV.4 |
