"use client";
import { useState, useActionState, useEffect } from "react";
import { createFuelLogAction, createExpenseAction } from "@/actions/expenses";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useRouter } from "next/navigation";
import type { ActionState } from "@/actions/vehicles";

type Vehicle = { id: string; name: string; regNo: string };

export function ExpenseModals({ vehicles }: { vehicles: Vehicle[] }) {
  const [which, setWhich] = useState<null | "fuel" | "expense">(null);
  const router = useRouter();

  const [fuelState, fuelAction, fuelPending] = useActionState<ActionState, FormData>(createFuelLogAction, null);
  const [expState, expAction, expPending] = useActionState<ActionState, FormData>(createExpenseAction, null);

  useEffect(() => { if (fuelState?.ok) { setWhich(null); router.refresh(); } }, [fuelState, router]);
  useEffect(() => { if (expState?.ok) { setWhich(null); router.refresh(); } }, [expState, router]);

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setWhich("fuel")}>+ Fuel Log</Button>
        <Button size="sm" onClick={() => setWhich("expense")}>+ Expense</Button>
      </div>

      <Modal open={which === "fuel"} title="Add Fuel Log" onClose={() => setWhich(null)}>
        <form action={fuelAction} className="flex flex-col gap-4">
          <ErrorBanner message={!fuelState?.ok ? (fuelState as { error?: string })?.error : undefined} />
          <FormField label="Vehicle *">
            <Select name="vehicleId" required>
              <option value="">— Select vehicle —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.regNo})</option>)}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Liters *"><Input name="liters" type="number" min="0.1" step="0.1" placeholder="14.5" required /></FormField>
            <FormField label="Cost (₹) *"><Input name="cost" type="number" min="0" step="1" placeholder="1450" required /></FormField>
          </div>
          <FormField label="Date"><Input name="date" type="date" /></FormField>
          <div className="flex gap-3">
            <Button type="submit" loading={fuelPending}>Save</Button>
            <Button type="button" variant="outline" onClick={() => setWhich(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>

      <Modal open={which === "expense"} title="Add Expense" onClose={() => setWhich(null)}>
        <form action={expAction} className="flex flex-col gap-4">
          <ErrorBanner message={!expState?.ok ? (expState as { error?: string })?.error : undefined} />
          <FormField label="Vehicle *">
            <Select name="vehicleId" required>
              <option value="">— Select vehicle —</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.regNo})</option>)}
            </Select>
          </FormField>
          <FormField label="Category *">
            <Select name="category" required>
              <option value="">— Select —</option>
              <option value="TOLL">Toll</option>
              <option value="REPAIR">Repair</option>
              <option value="INSURANCE">Insurance</option>
              <option value="OTHER">Other</option>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Amount (₹) *"><Input name="amount" type="number" min="1" step="1" placeholder="1850" required /></FormField>
            <FormField label="Date"><Input name="date" type="date" /></FormField>
          </div>
          <FormField label="Note">
            <Input name="note" placeholder="Mumbai–Nashik expressway toll…" />
          </FormField>
          <div className="flex gap-3">
            <Button type="submit" loading={expPending}>Save</Button>
            <Button type="button" variant="outline" onClick={() => setWhich(null)}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
