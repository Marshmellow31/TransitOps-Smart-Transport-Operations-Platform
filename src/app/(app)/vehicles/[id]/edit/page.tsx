import { requireSession } from "@/lib/auth";
import { canWrite } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { VehicleForm } from "../../VehicleForm";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "vehicles")) redirect("/vehicles");
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) notFound();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Edit Vehicle</h1>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
        <VehicleForm vehicle={vehicle} />
      </div>
    </div>
  );
}
