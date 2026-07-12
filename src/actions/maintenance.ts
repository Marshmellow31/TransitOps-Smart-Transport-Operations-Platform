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

export async function createMaintenanceAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("maintenance");
    await domain.createMaintenance({
      vehicleId: field(fd, "vehicleId"),
      type: field(fd, "type"),
      description: field(fd, "description"),
      cost: field(fd, "cost"),
    });
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function closeMaintenanceAction(id: string): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("maintenance");
    await domain.closeMaintenance(id);
  });
  return r.ok ? done() : { ok: false, error: r.error };
}
