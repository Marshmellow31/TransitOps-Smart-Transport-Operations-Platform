"use server";

import { revalidatePath } from "next/cache";
import { toActionResult } from "@/lib/errors";
import * as domain from "@/lib/domain";
import { authz, field } from "./util";

export type ActionState = { ok: true } | { ok: false; error: string } | null;

function vehicleInput(fd: FormData): domain.VehicleInput {
  return {
    regNo: field(fd, "regNo"),
    name: field(fd, "name"),
    type: field(fd, "type"),
    maxLoadKg: field(fd, "maxLoadKg"),
    odometerKm: field(fd, "odometerKm"),
    acquisitionCost: field(fd, "acquisitionCost"),
    region: field(fd, "region"),
  };
}

const done = () => {
  revalidatePath("/", "layout");
  return { ok: true as const };
};

export async function createVehicleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("vehicles");
    await domain.createVehicle(vehicleInput(fd));
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function updateVehicleAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("vehicles");
    await domain.updateVehicle(field(fd, "id"), vehicleInput(fd));
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function retireVehicleAction(id: string): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("vehicles");
    await domain.retireVehicle(id);
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function reactivateVehicleAction(id: string): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("vehicles");
    await domain.reactivateVehicle(id);
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function deleteVehicleAction(id: string): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("vehicles");
    await domain.deleteVehicle(id);
  });
  return r.ok ? done() : { ok: false, error: r.error };
}
