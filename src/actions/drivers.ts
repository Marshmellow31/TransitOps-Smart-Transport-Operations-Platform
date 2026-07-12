"use server";

import { revalidatePath } from "next/cache";
import { toActionResult } from "@/lib/errors";
import * as domain from "@/lib/domain";
import { authz, field } from "./util";
import type { ActionState } from "./vehicles";

function driverInput(fd: FormData): domain.DriverInput {
  return {
    name: field(fd, "name"),
    licenseNo: field(fd, "licenseNo"),
    licenseCategory: field(fd, "licenseCategory"),
    licenseExpiry: field(fd, "licenseExpiry"),
    phone: field(fd, "phone"),
    safetyScore: field(fd, "safetyScore"),
  };
}

const done = () => {
  revalidatePath("/", "layout");
  return { ok: true as const };
};

export async function createDriverAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("drivers");
    await domain.createDriver(driverInput(fd));
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function updateDriverAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("drivers");
    await domain.updateDriver(field(fd, "id"), driverInput(fd));
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function setDriverStatusAction(id: string, status: string): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("drivers");
    await domain.setDriverStatus(id, status as "AVAILABLE" | "OFF_DUTY" | "SUSPENDED");
  });
  return r.ok ? done() : { ok: false, error: r.error };
}
