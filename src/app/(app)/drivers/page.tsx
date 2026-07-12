import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canWrite } from "@/lib/rbac";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/lib/constants";
import { licenseExpired } from "@/lib/domain";
import { DriverActions } from "./DriverActions";
import Link from "next/link";

type SP = Promise<{ q?: string; status?: string; sort?: string }>;

export default async function DriversPage({ searchParams }: { searchParams: SP }) {
  const session = await requireSession();
  const sp = await searchParams;
  const canEdit = canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "drivers");

  const where: Record<string, unknown> = {};
  if (sp.status) where.status = sp.status;
  if (sp.q) where.OR = [
    { name: { contains: sp.q, mode: "insensitive" } },
    { licenseNo: { contains: sp.q, mode: "insensitive" } },
  ];

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: sp.sort === "expiry" ? { licenseExpiry: "asc" } : sp.sort === "score" ? { safetyScore: "desc" } : { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Driver Management</h1>
          <p className="text-sm text-zinc-500">{drivers.length} drivers</p>
        </div>
        {canEdit && (
          <Link href="/drivers/new" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            + Add Driver
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search name or license…" className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1.5 text-zinc-700 dark:text-zinc-200 w-52" />
        <select name="status" defaultValue={sp.status ?? ""} className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200">
          <option value="">All Statuses</option>
          {["AVAILABLE","ON_TRIP","OFF_DUTY","SUSPENDED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200">
          <option value="">Sort: Name</option>
          <option value="expiry">Sort: License Expiry</option>
          <option value="score">Sort: Safety Score</option>
        </select>
        <button type="submit" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">Apply</button>
        <Link href="/drivers" className="text-sm text-zinc-500 hover:underline self-center">Clear</Link>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <th className="px-4 py-3">Driver</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              {canEdit && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {drivers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-zinc-400">No drivers found.</td></tr>
            )}
            {drivers.map((d) => {
              const expired = licenseExpired(d.licenseExpiry);
              const expiringSoon = !expired && new Date(d.licenseExpiry).getTime() - Date.now() < 30 * 86400000;
              return (
                <tr key={d.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{d.name}</p>
                    <p className="text-xs text-zinc-400">{d.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{d.licenseNo}</p>
                    <p className="text-xs text-zinc-400">{d.licenseCategory}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-medium ${expired ? "text-red-600" : expiringSoon ? "text-amber-600" : "text-zinc-600 dark:text-zinc-300"}`}>
                      {fmtDate(d.licenseExpiry)}
                    </p>
                    {expired && <p className="text-xs text-red-500 font-semibold">EXPIRED</p>}
                    {expiringSoon && <p className="text-xs text-amber-500">Expiring soon</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className={`h-full rounded-full ${d.safetyScore >= 80 ? "bg-emerald-500" : d.safetyScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${d.safetyScore}%` }}
                        />
                      </div>
                      <span className="text-xs text-zinc-600 dark:text-zinc-300">{d.safetyScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge status={d.status} /></td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <DriverActions driver={{ id: d.id, name: d.name, status: d.status }} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
