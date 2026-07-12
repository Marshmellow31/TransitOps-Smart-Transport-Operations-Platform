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

/**
 * Tailwind classes per status badge — single source of truth for the whole UI.
 * Tones from the TransitOps Redesign design doc:
 * green #e7f6ee/#1f8a5b · blue #e8f0fe/#2a6fdb · amber #fdf1dd/#a9701a · red #fdeaea/#c33636
 */
const TONE = {
  green: "bg-[#e7f6ee] text-[#1f8a5b] dark:bg-[#22965e29] dark:text-[#4cd08a]",
  blue: "bg-[#e8f0fe] text-[#2a6fdb] dark:bg-[#2a6fdb2e] dark:text-[#6ea8ff]",
  amber: "bg-[#fdf1dd] text-[#a9701a] dark:bg-[#a9701a33] dark:text-[#e3b465]",
  red: "bg-[#fdeaea] text-[#c33636] dark:bg-[#c83c3c29] dark:text-[#f38b8b]",
  gray: "bg-zinc-100 text-zinc-500 dark:bg-[#161b26] dark:text-[#98a0b0]",
};

export const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: TONE.green,
  ON_TRIP: TONE.blue,
  IN_SHOP: TONE.amber,
  RETIRED: TONE.gray,
  OFF_DUTY: TONE.gray,
  SUSPENDED: TONE.red,
  DRAFT: TONE.amber,
  DISPATCHED: TONE.blue,
  COMPLETED: TONE.green,
  CANCELLED: TONE.red,
  OPEN: TONE.amber,
  CLOSED: TONE.green,
};

export const fmtMoney = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
