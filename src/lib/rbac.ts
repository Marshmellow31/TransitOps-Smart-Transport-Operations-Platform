import { DomainError } from "./errors";
import type { Role } from "./constants";
import type { Session } from "./auth";

export type Module =
  | "vehicles"
  | "drivers"
  | "trips"
  | "maintenance"
  | "expenses"
  | "reports";

/**
 * Write-permission matrix (SRS §2.2). Every role can READ every module —
 * operational visibility is the product's point. Writes are role-owned.
 */
export const WRITE_ACCESS: Record<Module, Role[]> = {
  vehicles: ["FLEET_MANAGER"],
  drivers: ["SAFETY_OFFICER"],
  trips: ["FLEET_MANAGER", "DRIVER"],
  maintenance: ["FLEET_MANAGER"],
  expenses: ["FLEET_MANAGER", "DRIVER", "FINANCIAL_ANALYST"],
  reports: ["FLEET_MANAGER", "DRIVER", "SAFETY_OFFICER", "FINANCIAL_ANALYST"], // export = read-only data
};

export function canWrite(role: Role, module: Module): boolean {
  return WRITE_ACCESS[module].includes(role);
}

/** Server-side gate used by every mutating action. */
export function requireWrite(session: Session, module: Module) {
  if (!canWrite(session.role, module)) {
    throw new DomainError(
      `Your role does not have permission to modify ${module}. This action is restricted.`
    );
  }
}
