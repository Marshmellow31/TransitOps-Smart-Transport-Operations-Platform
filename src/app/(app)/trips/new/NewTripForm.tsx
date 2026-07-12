"use client";
import { useActionState, useState } from "react";
import { createTripAction } from "@/actions/trips";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ActionState } from "@/actions/vehicles";

type Vehicle = { id: string; name: string; regNo: string; maxLoadKg: number };
type Driver = { id: string; name: string; licenseNo: string };

export function NewTripForm({ vehicles, drivers }: { vehicles: Vehicle[]; drivers: Driver[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createTripAction, null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/trips");
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <ErrorBanner message={!state?.ok ? (state as { error?: string })?.error : undefined} />

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Source *">
          <Input name="source" placeholder="Mumbai" required />
        </FormField>
        <FormField label="Destination *">
          <Input name="destination" placeholder="Pune" required />
        </FormField>
      </div>

      <FormField label="Vehicle *">
        <Select name="vehicleId" required onChange={e => setSelectedVehicle(vehicles.find(v => v.id === e.target.value) ?? null)}>
          <option value="">— Select vehicle —</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.name} ({v.regNo}) — max {v.maxLoadKg} kg
            </option>
          ))}
        </Select>
        {vehicles.length === 0 && <p className="text-xs text-amber-600 mt-1">No available vehicles right now.</p>}
      </FormField>

      <FormField label="Driver *">
        <Select name="driverId" required>
          <option value="">— Select driver —</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.licenseNo})
            </option>
          ))}
        </Select>
        {drivers.length === 0 && <p className="text-xs text-amber-600 mt-1">No eligible drivers available.</p>}
      </FormField>

      <div className="grid grid-cols-3 gap-4">
        <FormField label={`Cargo (kg) *${selectedVehicle ? ` — max ${selectedVehicle.maxLoadKg}` : ""}`}>
          <Input name="cargoKg" type="number" min="0.1" step="0.1" placeholder="450"
            max={selectedVehicle?.maxLoadKg} required />
        </FormField>
        <FormField label="Planned Distance (km) *">
          <Input name="plannedKm" type="number" min="1" step="1" placeholder="150" required />
        </FormField>
        <FormField label="Expected Revenue (₹) *">
          <Input name="revenue" type="number" min="0" step="1" placeholder="18000" required />
        </FormField>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={pending}>Save as Draft</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/trips")}>Cancel</Button>
      </div>
    </form>
  );
}
