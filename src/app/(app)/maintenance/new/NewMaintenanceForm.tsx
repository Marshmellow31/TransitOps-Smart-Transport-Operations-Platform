"use client";
import { useActionState } from "react";
import { createMaintenanceAction } from "@/actions/maintenance";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ActionState } from "@/actions/vehicles";

type Vehicle = { id: string; name: string; regNo: string; status: string };

export function NewMaintenanceForm({ vehicles }: { vehicles: Vehicle[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createMaintenanceAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/maintenance");
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <ErrorBanner message={!state?.ok ? (state as { error?: string })?.error : undefined} />
      <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
        ⚠️ Opening a maintenance record will automatically set the vehicle status to <strong>In Shop</strong>.
      </p>

      <FormField label="Vehicle *">
        <Select name="vehicleId" required>
          <option value="">— Select vehicle —</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.name} ({v.regNo}) — {v.status.replace("_"," ")}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Maintenance Type *">
        <Select name="type" required>
          <option value="">— Select type —</option>
          {["Oil Change","Brake Service","Tyre Replacement","Gearbox Overhaul","Engine Repair","AC Service","Battery Replacement","Body Work","Scheduled Service","Other"].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Select>
      </FormField>

      <FormField label="Description">
        <Textarea name="description" placeholder="Details about the maintenance work…" />
      </FormField>

      <FormField label="Estimated Cost (₹) *">
        <Input name="cost" type="number" min="0" step="1" placeholder="5000" required />
      </FormField>

      <div className="flex gap-3">
        <Button type="submit" loading={pending}>Open Record</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/maintenance")}>Cancel</Button>
      </div>
    </form>
  );
}
