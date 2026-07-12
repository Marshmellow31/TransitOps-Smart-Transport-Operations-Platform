import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canWrite } from "@/lib/rbac";
import { Badge } from "@/components/ui/Badge";
import { fmtMoney, VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { VehicleActions } from "./VehicleActions";
import Link from "next/link";

type SP = Promise<{ q?: string; type?: string; status?: string; sort?: string }>;

/* Row avatar icons per vehicle type (design doc) */
const TYPE_ICONS: Record<string, React.ReactNode> = {
  TRUCK: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 16V7a1 1 0 0 1 1-1h8v10M12 9h4l3 3.5V16h-7"/><circle cx="7" cy="16.5" r="1.6"/><circle cx="16" cy="16.5" r="1.6"/></svg>,
  VAN: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 15V7a1 1 0 0 1 1-1h9v9M13 9h4l3 3.5V15h-7"/><circle cx="7" cy="15.5" r="1.5"/><circle cx="16" cy="15.5" r="1.5"/></svg>,
  MINI_TRUCK: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="6" width="12" height="9" rx="1.5"/><path d="M16 10h3l1 2.5V15h-4"/><circle cx="8" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/></svg>,
  BIKE: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="16" r="3.2"/><circle cx="18" cy="16" r="3.2"/><path d="M6 16 9.5 8h3M18 16l-3-8h-2.5M9.5 8 13 16"/></svg>,
};

export default async function VehiclesPage({ searchParams }: { searchParams: SP }) {
  const session = await requireSession();
  const sp = await searchParams;
  const canEdit = canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "vehicles");

  const where: Record<string, unknown> = {};
  if (sp.type) where.type = sp.type;
  if (sp.status) where.status = sp.status;
  if (sp.q) where.OR = [
    { regNo: { contains: sp.q } },
    { name: { contains: sp.q } },
  ];

  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: sp.sort === "cost" ? { acquisitionCost: "desc" } : sp.sort === "odometer" ? { odometerKm: "desc" } : { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[11.5px] font-bold tracking-[.1em] uppercase text-[#4f46e5] dark:text-[#a5b0ff] mb-1">Fleet · Assets</p>
          <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Vehicle Registry</h1>
          <p className="text-[13px] text-[#6b7280] dark:text-[#98a0b0] mt-1">
            {vehicles.length} vehicles · {vehicles.filter(v => v.status === "AVAILABLE").length} available · {vehicles.filter(v => v.status === "ON_TRIP").length} on trip · {vehicles.filter(v => v.status === "IN_SHOP").length} in shop
          </p>
        </div>
        {canEdit && (
          <Link href="/vehicles/new" className="bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] hover:brightness-[1.06] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-indigo-600/20">
            + Add Vehicle
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 items-center bg-zinc-50/50 dark:bg-[#12151d]/50 rounded-2xl p-3 border border-zinc-200/50 dark:border-[#20263a]/50">
        <input name="q" defaultValue={sp.q} placeholder="Search reg. no. or name…" className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3.5 py-2 text-zinc-700 dark:text-zinc-200 w-52 placeholder-zinc-400 transition-colors focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
        <select name="type" defaultValue={sp.type ?? ""} className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3 py-2 text-zinc-700 dark:text-zinc-200">
          <option value="">All Types</option>
          {Object.entries(VEHICLE_TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3 py-2 text-zinc-700 dark:text-zinc-200">
          <option value="">All Statuses</option>
          {["AVAILABLE","ON_TRIP","IN_SHOP","RETIRED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3 py-2 text-zinc-700 dark:text-zinc-200">
          <option value="">Sort: Name</option>
          <option value="odometer">Sort: Odometer</option>
          <option value="cost">Sort: Acq. Cost</option>
        </select>
        <button type="submit" className="text-sm bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] text-white px-4 py-2 rounded-xl hover:bg-indigo-500 transition-all font-semibold active:scale-[0.97]">Apply</button>
        <Link href="/vehicles" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2 transition-colors">Clear</Link>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-[#20263a] text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-[#0d1017]/50">
              <th className="px-4 py-3.5">Reg. No.</th>
              <th className="px-4 py-3.5">Name / Type</th>
              <th className="px-4 py-3.5">Max Load</th>
              <th className="px-4 py-3.5">Odometer</th>
              <th className="px-4 py-3.5">Acq. Cost</th>
              <th className="px-4 py-3.5">Status</th>
              {canEdit && <th className="px-4 py-3.5">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#20263a]">
            {vehicles.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3"><rect x="4" y="10" width="28" height="16" rx="3"/><circle cx="11" cy="26" r="3"/><circle cx="25" cy="26" r="3"/><path d="M14 26h8"/></svg>
                <p className="text-sm font-medium text-zinc-400">No vehicles found</p>
                <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters</p>
              </td></tr>
            )}
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#161b26]/50 transition-colors">
                <td className="px-4 py-3.5">
                  <span className="flex items-center gap-2.5">
                    <span className="w-[34px] h-[34px] rounded-[10px] grid place-items-center bg-[#eef0f4] dark:bg-[#1c2233] text-[#6b7280] dark:text-[#98a0b0] shrink-0">
                      {TYPE_ICONS[v.type] ?? TYPE_ICONS.TRUCK}
                    </span>
                    <span className="font-mono text-[13px] font-semibold text-[#14161e] dark:text-[#e8eaf0] tracking-tight">{v.regNo}</span>
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{v.name}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{VEHICLE_TYPE_LABELS[v.type] ?? v.type} · {v.region}</p>
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{v.maxLoadKg.toLocaleString()} kg</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{v.odometerKm.toLocaleString()} km</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(v.acquisitionCost)}</td>
                <td className="px-4 py-3.5"><Badge status={v.status} /></td>
                {canEdit && (
                  <td className="px-4 py-3.5">
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
