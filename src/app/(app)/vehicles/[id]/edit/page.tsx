import { requireSession } from "@/lib/auth";
import { canWrite } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { VehicleForm } from "../../VehicleForm";
import Link from "next/link";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (!canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "vehicles")) redirect("/vehicles");
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) notFound();
  return (
    <div className="space-y-5">
      <div>
        <Link href="/vehicles" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1 mb-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 2L4 7l5 5"/></svg>
          Back to Vehicles
        </Link>
        <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Edit Vehicle</h1>
      </div>
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] shadow-sm p-6">
        <VehicleForm vehicle={vehicle} />
      </div>
    </div>
  );
}
