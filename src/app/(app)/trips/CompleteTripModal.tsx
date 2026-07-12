"use client";
import { useActionState } from "react";
import { completeTripAction } from "@/actions/trips";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useEffect } from "react";
import type { ActionState } from "@/actions/vehicles";

export function CompleteTripModal({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(completeTripAction, null);

  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <Modal open title="Complete Trip" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={tripId} />
        <ErrorBanner message={!state?.ok ? (state as { error?: string })?.error : undefined} />
        <FormField label="Final Odometer (km) *">
          <Input name="endOdometer" type="number" min="0" step="1" placeholder="43000" required />
        </FormField>
        <FormField label="Fuel Consumed (liters) *">
          <Input name="fuelConsumedL" type="number" min="0.1" step="0.1" placeholder="14.5" required />
        </FormField>
        <FormField label="Fuel Cost (₹) *">
          <Input name="fuelCost" type="number" min="0" step="1" placeholder="1450" required />
        </FormField>
        <div className="flex gap-3">
          <Button type="submit" variant="success" loading={pending}>Mark Completed</Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
