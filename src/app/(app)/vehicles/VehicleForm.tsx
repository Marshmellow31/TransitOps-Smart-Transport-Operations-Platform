"use client";
import { useActionState } from "react";
import { createVehicleAction, updateVehicleAction, type ActionState } from "@/actions/vehicles";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Vehicle = { id: string; regNo: string; name: string; type: string; maxLoadKg: number; odometerKm: number; acquisitionCost: number; region: string };

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const action = vehicle ? updateVehicleAction : createVehicleAction;
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/vehicles");
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <ErrorBanner message={!state?.ok ? (state as { error?: string })?.error : undefined} />
      {vehicle && <input type="hidden" name="id" value={vehicle.id} />}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Registration Number *">
          <Input name="regNo" defaultValue={vehicle?.regNo} placeholder="MH-12-AB-1234" required />
        </FormField>
        <FormField label="Name / Model *">
          <Input name="name" defaultValue={vehicle?.name} placeholder="Van-05 (Tata Ace)" required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Type *">
          <Select name="type" defaultValue={vehicle?.type ?? "VAN"} required>
            <option value="TRUCK">Truck</option>
            <option value="VAN">Van</option>
            <option value="MINI_TRUCK">Mini Truck</option>
            <option value="BIKE">Bike</option>
          </Select>
        </FormField>
        <FormField label="Region *">
          <Input name="region" defaultValue={vehicle?.region ?? "Central"} placeholder="West, North…" required />
        </FormField>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <FormField label="Max Load (kg) *">
          <Input name="maxLoadKg" type="number" min="1" step="0.1" defaultValue={vehicle?.maxLoadKg} placeholder="500" required />
        </FormField>
        <FormField label="Odometer (km)">
          <Input name="odometerKm" type="number" min="0" step="1" defaultValue={vehicle?.odometerKm ?? 0} placeholder="0" />
        </FormField>
        <FormField label="Acquisition Cost (₹) *">
          <Input name="acquisitionCost" type="number" min="0" step="1" defaultValue={vehicle?.acquisitionCost} placeholder="850000" required />
        </FormField>
      </div>
      <div className="flex gap-3">
        <Button type="submit" loading={pending}>{vehicle ? "Update Vehicle" : "Add Vehicle"}</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/vehicles")}>Cancel</Button>
      </div>
    </form>
  );
}
