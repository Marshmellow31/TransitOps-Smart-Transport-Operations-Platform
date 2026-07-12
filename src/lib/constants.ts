export const ROLES = ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  FLEET_MANAGER: "Fleet Manager",
  DRIVER: "Driver (Dispatcher)",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

export const VEHICLE_TYPES = ["TRUCK", "VAN", "MINI_TRUCK", "BIKE"] as const;
export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  TRUCK: "Truck",
  VAN: "Van",
  MINI_TRUCK: "Mini Truck",
  BIKE: "Bike",
};

export const VEHICLE_STATUSES = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"] as const;
export const DRIVER_STATUSES = ["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"] as const;
export const TRIP_STATUSES = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"] as const;
export const EXPENSE_CATEGORIES = ["TOLL", "REPAIR", "INSURANCE", "OTHER"] as const;

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
  DRAFT: "Draft",
  DISPATCHED: "Dispatched",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  OPEN: "Open",
  CLOSED: "Closed",
  TOLL: "Toll",
  REPAIR: "Repair",
  INSURANCE: "Insurance",
  OTHER: "Other",
};

/** Tailwind classes per status badge — single source of truth for the whole UI. */
export const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ON_TRIP: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_SHOP: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  RETIRED: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  OFF_DUTY: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
  SUSPENDED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  DRAFT: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  DISPATCHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  OPEN: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  CLOSED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export const fmtMoney = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
