"use client";
import { useActionState } from "react";
import { createDriverAction, updateDriverAction } from "@/actions/drivers";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select } from "@/components/ui/FormField";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ActionState } from "@/actions/vehicles";

type Driver = { id: string; name: string; licenseNo: string; licenseCategory: string; licenseExpiry: Date; phone: string; safetyScore: number };

function dateStr(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

export function DriverForm({ driver }: { driver?: Driver }) {
  const action = driver ? updateDriverAction : createDriverAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok) router.push("/drivers");
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-lg">
      <ErrorBanner message={!state?.ok ? (state as { error?: string })?.error : undefined} />
      {driver && <input type="hidden" name="id" value={driver.id} />}
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Full Name *">
          <Input name="name" defaultValue={driver?.name} placeholder="Alex Kumar" required />
        </FormField>
        <FormField label="Contact Number *">
          <Input name="phone" defaultValue={driver?.phone} placeholder="+91 98200 11001" required />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="License Number *">
          <Input name="licenseNo" defaultValue={driver?.licenseNo} placeholder="DL-2019-0012345" required />
        </FormField>
        <FormField label="License Category *">
          <Select name="licenseCategory" defaultValue={driver?.licenseCategory ?? "LMV"} required>
            <option value="LMV">LMV (Light Motor)</option>
            <option value="HMV">HMV (Heavy Motor)</option>
            <option value="MCWG">MCWG (Motorcycle)</option>
            <option value="TRANS">Transport</option>
          </Select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="License Expiry Date *">
          <Input name="licenseExpiry" type="date" defaultValue={driver ? dateStr(driver.licenseExpiry) : ""} required />
        </FormField>
        <FormField label="Safety Score (0–100)">
          <Input name="safetyScore" type="number" min="0" max="100" defaultValue={driver?.safetyScore ?? 80} />
        </FormField>
      </div>
      <div className="flex gap-3">
        <Button type="submit" loading={pending}>{driver ? "Update Driver" : "Add Driver"}</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/drivers")}>Cancel</Button>
      </div>
    </form>
  );
}
