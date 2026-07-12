import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canWrite } from "@/lib/rbac";
import { Badge } from "@/components/ui/Badge";
import { fmtDate, fmtMoney } from "@/lib/constants";
import { TripActions } from "./TripActions";
import Link from "next/link";

type SP = Promise<{ status?: string; q?: string }>;

export default async function TripsPage({ searchParams }: { searchParams: SP }) {
  const session = await requireSession();
  const sp = await searchParams;
  const canEdit = canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "trips");

  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.q) where.OR = [
    { source: { contains: sp.q } },
    { destination: { contains: sp.q } },
  ];

  const trips = await prisma.trip.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Trips</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-[#161b26] text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md text-xs font-semibold">{trips.length}</span> records
          </p>
        </div>
        {canEdit && (
          <Link href="/trips/new" className="bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] hover:brightness-[1.06] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-indigo-600/20">
            + New Trip
          </Link>
        )}
      </div>

      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {["","DRAFT","DISPATCHED","COMPLETED","CANCELLED"].map(s => {
          const active = (sp.status ?? "") === s;
          const label = s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase();
          return (
            <Link key={s} href={s ? `/trips?status=${s}` : "/trips"}
              className={`text-xs px-4 py-2 rounded-xl font-semibold transition-all duration-150 ${active ? "bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] text-white shadow-md shadow-indigo-600/20" : "bg-white dark:bg-[#12151d] border border-zinc-200 dark:border-[#20263a] text-zinc-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-[#20263a] text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-[#0d1017]/50">
              <th className="px-4 py-3.5">Route</th>
              <th className="px-4 py-3.5">Vehicle</th>
              <th className="px-4 py-3.5">Driver</th>
              <th className="px-4 py-3.5">Cargo</th>
              <th className="px-4 py-3.5">Km</th>
              <th className="px-4 py-3.5">Revenue</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Date</th>
              {canEdit && <th className="px-4 py-3.5">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#20263a]">
            {trips.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-12 text-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3"><path d="M8 18h20M20 10l8 8-8 8"/></svg>
                <p className="text-sm font-medium text-zinc-400">No trips found</p>
                <p className="text-xs text-zinc-400 mt-1">Create a new trip or change the filter</p>
              </td></tr>
            )}
            {trips.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#161b26]/50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{t.source}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">→ {t.destination}</p>
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 text-xs">
                  <p className="font-medium">{t.vehicle.name}</p>
                  <p className="text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{t.vehicle.regNo}</p>
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{t.driver.name}</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{t.cargoKg} kg</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">
                  {t.actualKm ? `${t.actualKm} km` : `${t.plannedKm} km *`}
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(t.revenue)}</td>
                <td className="px-4 py-3.5"><Badge status={t.status} /></td>
                <td className="px-4 py-3.5 text-xs text-zinc-400">{fmtDate(t.createdAt)}</td>
                {canEdit && (
                  <td className="px-4 py-3.5">
                    <TripActions trip={{ id: t.id, status: t.status }} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
