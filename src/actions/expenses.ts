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

export async function createFuelLogAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("expenses");
    await domain.createFuelLog({
      vehicleId: field(fd, "vehicleId"),
      liters: field(fd, "liters"),
      cost: field(fd, "cost"),
      date: field(fd, "date") || undefined,
    });
  });
  return r.ok ? done() : { ok: false, error: r.error };
}

export async function createExpenseAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await toActionResult(async () => {
    await authz("expenses");
    await domain.createExpense({
      vehicleId: field(fd, "vehicleId"),
      category: field(fd, "category"),
      amount: field(fd, "amount"),
      date: field(fd, "date") || undefined,
      note: field(fd, "note"),
    });
  });
  return r.ok ? done() : { ok: false, error: r.error };
}
