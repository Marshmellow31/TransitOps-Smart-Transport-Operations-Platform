import { requireSession } from "@/lib/auth";
import { canWrite } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { dispatchableVehicles, assignableDrivers } from "@/lib/domain";
import { NewTripForm } from "./NewTripForm";

export default async function NewTripPage() {
  const session = await requireSession();
  if (!canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "trips")) redirect("/trips");

  const [vehicles, drivers] = await Promise.all([dispatchableVehicles(), assignableDrivers()]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">New Trip</h1>
        <p className="text-sm text-zinc-500">Only available vehicles and drivers with valid licenses are shown.</p>
      </div>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <NewTripForm vehicles={vehicles} drivers={drivers} />
      </div>
    </div>
  );
}
