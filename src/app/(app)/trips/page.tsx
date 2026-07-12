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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Trips</h1>
          <p className="text-sm text-zinc-500">{trips.length} records</p>
        </div>
        {canEdit && (
          <Link href="/trips/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
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
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${active ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-300"}`}>
              {label}
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Km</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              {canEdit && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {trips.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-zinc-400">No trips found.</td></tr>
            )}
            {trips.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{t.source}</p>
                  <p className="text-xs text-zinc-400">→ {t.destination}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 text-xs">
                  <p>{t.vehicle.name}</p>
                  <p className="text-zinc-400 font-mono">{t.vehicle.regNo}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{t.driver.name}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{t.cargoKg} kg</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                  {t.actualKm ? `${t.actualKm} km` : `${t.plannedKm} km *`}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtMoney(t.revenue)}</td>
                <td className="px-4 py-3"><Badge status={t.status} /></td>
                <td className="px-4 py-3 text-xs text-zinc-400">{fmtDate(t.createdAt)}</td>
                {canEdit && (
                  <td className="px-4 py-3">
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
