import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canWrite } from "@/lib/rbac";
import { Badge } from "@/components/ui/Badge";
import { fmtDate, fmtMoney } from "@/lib/constants";
import { MaintenanceActions } from "./MaintenanceActions";
import Link from "next/link";

type SP = Promise<{ status?: string }>;

export default async function MaintenancePage({ searchParams }: { searchParams: SP }) {
  const session = await requireSession();
  const sp = await searchParams;
  const canEdit = canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "maintenance");

  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;

  const logs = await prisma.maintenanceLog.findMany({
    where,
    include: { vehicle: true },
    orderBy: { startDate: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Maintenance Log</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-[#161b26] text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md text-xs font-semibold">{logs.length}</span> records
          </p>
        </div>
        {canEdit && (
          <Link href="/maintenance/new" className="bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] hover:brightness-[1.06] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-indigo-600/20">
            + Create Record
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "OPEN", "CLOSED"].map(s => (
          <Link key={s} href={s ? `/maintenance?status=${s}` : "/maintenance"}
            className={`text-xs px-4 py-2 rounded-xl font-semibold transition-all duration-150 ${(sp.status ?? "") === s ? "bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] text-white shadow-md shadow-indigo-600/20" : "bg-white dark:bg-[#12151d] border border-zinc-200 dark:border-[#20263a] text-zinc-600 dark:text-zinc-300 hover:border-indigo-300 dark:hover:border-indigo-600/50 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
            {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-[#20263a] text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-[#0d1017]/50">
              <th className="px-4 py-3.5">Vehicle</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Description</th>
              <th className="px-4 py-3.5">Cost</th>
              <th className="px-4 py-3.5">Started</th>
              <th className="px-4 py-3.5">Closed</th>
              <th className="px-4 py-3.5">Status</th>
              {canEdit && <th className="px-4 py-3.5">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#20263a]">
            {logs.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3"><path d="M22 6L16 12l2 4-4 2-6 6a3.5 3.5 0 005 5L19 23l2-4 4 2 6-6c1-3.5-1-7-4.5-8.5z"/><path d="M6 30l5-5"/></svg>
                <p className="text-sm font-medium text-zinc-400">No maintenance records</p>
                <p className="text-xs text-zinc-400 mt-1">All vehicles are in good shape</p>
              </td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#161b26]/50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{log.vehicle.name}</p>
                  <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{log.vehicle.regNo}</p>
                </td>
                <td className="px-4 py-3.5 font-medium text-zinc-700 dark:text-zinc-300">{log.type}</td>
                <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400 text-xs max-w-xs truncate">{log.description || "—"}</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(log.cost)}</td>
                <td className="px-4 py-3.5 text-xs text-zinc-400">{fmtDate(log.startDate)}</td>
                <td className="px-4 py-3.5 text-xs text-zinc-400">{log.endDate ? fmtDate(log.endDate) : "—"}</td>
                <td className="px-4 py-3.5"><Badge status={log.status} /></td>
                {canEdit && (
                  <td className="px-4 py-3.5">
                    <MaintenanceActions log={{ id: log.id, status: log.status }} />
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
