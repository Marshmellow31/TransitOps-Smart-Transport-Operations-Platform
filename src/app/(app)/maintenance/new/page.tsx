import { requireSession } from "@/lib/auth";
import { canWrite } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { NewMaintenanceForm } from "./NewMaintenanceForm";

export default async function NewMaintenancePage() {
  const session = await requireSession();
  if (!canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "maintenance")) redirect("/maintenance");

  const vehicles = await prisma.vehicle.findMany({
    where: { status: { in: ["AVAILABLE", "IN_SHOP"] } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">New Maintenance Record</h1>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <NewMaintenanceForm vehicles={vehicles} />
      </div>
    </div>
  );
}
