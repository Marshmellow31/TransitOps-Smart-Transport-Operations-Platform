import { requireSession } from "@/lib/auth";
import { canWrite } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { VehicleForm } from "../VehicleForm";

export default async function NewVehiclePage() {
  const session = await requireSession();
  if (!canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "vehicles")) redirect("/vehicles");
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Add Vehicle</h1>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <VehicleForm />
      </div>
    </div>
  );
}
