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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Maintenance Log</h1>
          <p className="text-sm text-zinc-500">{logs.length} records</p>
        </div>
        {canEdit && (
          <Link href="/maintenance/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Create Record
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["", "OPEN", "CLOSED"].map(s => (
          <Link key={s} href={s ? `/maintenance?status=${s}` : "/maintenance"}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${(sp.status ?? "") === s ? "bg-indigo-600 text-white" : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-indigo-300"}`}>
            {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Closed</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {logs.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">No records found.</td></tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{log.vehicle.name}</p>
                  <p className="text-xs font-mono text-zinc-400">{log.vehicle.regNo}</p>
                </td>
                <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">{log.type}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs max-w-xs truncate">{log.description || "—"}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(log.cost)}</td>
                <td className="px-4 py-3 text-xs text-zinc-400">{fmtDate(log.startDate)}</td>
                <td className="px-4 py-3 text-xs text-zinc-400">{log.endDate ? fmtDate(log.endDate) : "—"}</td>
                <td className="px-4 py-3"><Badge status={log.status} /></td>
                {canEdit && (
                  <td className="px-4 py-3">
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
