import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canWrite } from "@/lib/rbac";
import { Badge } from "@/components/ui/Badge";
import { fmtMoney, VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { VehicleActions } from "./VehicleActions";
import Link from "next/link";

type SP = Promise<{ q?: string; type?: string; status?: string; sort?: string }>;

export default async function VehiclesPage({ searchParams }: { searchParams: SP }) {
  const session = await requireSession();
  const sp = await searchParams;
  const canEdit = canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "vehicles");

  const where: Record<string, unknown> = {};
  if (sp.type) where.type = sp.type;
  if (sp.status) where.status = sp.status;
  if (sp.q) where.OR = [
    { regNo: { contains: sp.q, mode: "insensitive" } },
    { name: { contains: sp.q, mode: "insensitive" } },
  ];

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: sp.sort === "cost" ? { acquisitionCost: "desc" } : sp.sort === "odometer" ? { odometerKm: "desc" } : { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Vehicle Registry</h1>
          <p className="text-sm text-zinc-500">{vehicles.length} vehicles</p>
        </div>
        {canEdit && (
          <Link href="/vehicles/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Add Vehicle
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 items-center">
        <input name="q" defaultValue={sp.q} placeholder="Search reg. no. or name…" className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-700 dark:text-zinc-200 w-52" />
        <select name="type" defaultValue={sp.type ?? ""} className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200">
          <option value="">All Types</option>
          {Object.entries(VEHICLE_TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200">
          <option value="">All Statuses</option>
          {["AVAILABLE","ON_TRIP","IN_SHOP","RETIRED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200">
          <option value="">Sort: Name</option>
          <option value="odometer">Sort: Odometer</option>
          <option value="cost">Sort: Acq. Cost</option>
        </select>
        <button type="submit" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">Apply</button>
        <Link href="/vehicles" className="text-sm text-zinc-500 hover:underline">Clear</Link>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <th className="px-4 py-3">Reg. No.</th>
              <th className="px-4 py-3">Name / Type</th>
              <th className="px-4 py-3">Max Load</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Acq. Cost</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {vehicles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400">No vehicles found.</td></tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">{v.regNo}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{v.name}</p>
                  <p className="text-xs text-zinc-400">{VEHICLE_TYPE_LABELS[v.type] ?? v.type} · {v.region}</p>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{v.maxLoadKg.toLocaleString()} kg</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{v.odometerKm.toLocaleString()} km</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtMoney(v.acquisitionCost)}</td>
                <td className="px-4 py-3"><Badge status={v.status} /></td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <VehicleActions vehicle={v} />
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
