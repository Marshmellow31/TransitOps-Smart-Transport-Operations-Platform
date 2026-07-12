"use server";

import { revalidatePath } from "next/cache";
import { toActionResult } from "@/lib/errors";
import * as domain from "@/lib/domain";
import { authz, field } from "./util";
import type { ActionState } from "./vehicles";

const done = () => {
  revalidatePath("/", "layout");
  return { ok: true as const };
};

export async function createTripAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("trips");
    await domain.createTrip({
      source: field(fd, "source"),
      destination: field(fd, "destination"),
      vehicleId: field(fd, "vehicleId"),
      driverId: field(fd, "driverId"),
      cargoKg: field(fd, "cargoKg"),
      plannedKm: field(fd, "plannedKm"),
      revenue: field(fd, "revenue"),
    });
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function dispatchTripAction(id: string): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("trips");
    await domain.dispatchTrip(id);
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function completeTripAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("trips");
    await domain.completeTrip(field(fd, "id"), {
      endOdometer: field(fd, "endOdometer"),
      fuelConsumedL: field(fd, "fuelConsumedL"),
      fuelCost: field(fd, "fuelCost"),
    });
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function cancelTripAction(id: string): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("trips");
    await domain.cancelTrip(id);
  });
  return r.ok ? done() : { ok: false, error: r.error };
}
