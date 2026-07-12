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
    { name: { contains: sp.q } },
    { licenseNo: { contains: sp.q } },
  ];

  const drivers = await prisma.driver.findMany({
    where,
    orderBy: sp.sort === "expiry" ? { licenseExpiry: "asc" } : sp.sort === "score" ? { safetyScore: "desc" } : { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Driver Management</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            <span className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-[#161b26] text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md text-xs font-semibold">{drivers.length}</span> drivers
          </p>
        </div>
        {canEdit && (
          <Link href="/drivers/new" className="bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] hover:brightness-[1.06] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-indigo-600/20">
            + Add Driver
          </Link>
        )}
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2 bg-zinc-50/50 dark:bg-[#12151d]/50 rounded-2xl p-3 border border-zinc-200/50 dark:border-[#20263a]/50">
        <input name="q" defaultValue={sp.q} placeholder="Search name or license…" className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3.5 py-2 text-zinc-700 dark:text-zinc-200 w-52 placeholder-zinc-400 transition-colors focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
        <select name="status" defaultValue={sp.status ?? ""} className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3 py-2 text-zinc-700 dark:text-zinc-200">
          <option value="">All Statuses</option>
          {["AVAILABLE","ON_TRIP","OFF_DUTY","SUSPENDED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
        </select>
        <select name="sort" defaultValue={sp.sort ?? ""} className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3 py-2 text-zinc-700 dark:text-zinc-200">
          <option value="">Sort: Name</option>
          <option value="expiry">Sort: License Expiry</option>
          <option value="score">Sort: Safety Score</option>
        </select>
        <button type="submit" className="text-sm bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] text-white px-4 py-2 rounded-xl hover:bg-indigo-500 transition-all font-semibold active:scale-[0.97]">Apply</button>
        <Link href="/drivers" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2 self-center transition-colors">Clear</Link>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-[#20263a] text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-[#0d1017]/50">
              <th className="px-4 py-3.5">Driver</th>
              <th className="px-4 py-3.5">License</th>
              <th className="px-4 py-3.5">Expiry</th>
              <th className="px-4 py-3.5">Score</th>
              <th className="px-4 py-3.5">Status</th>
              {canEdit && <th className="px-4 py-3.5">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#20263a]">
            {drivers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3"><circle cx="18" cy="12" r="6"/><path d="M6 32c0-6 5.4-10 12-10s12 4 12 10"/></svg>
                <p className="text-sm font-medium text-zinc-400">No drivers found</p>
                <p className="text-xs text-zinc-400 mt-1">Try adjusting your filters</p>
              </td></tr>
            )}
            {drivers.map((d) => {
              const expired = licenseExpired(d.licenseExpiry);
              const expiringSoon = !expired && new Date(d.licenseExpiry).getTime() - Date.now() < 30 * 86400000;
              return (
                <tr key={d.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#161b26]/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{d.name}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{d.phone}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{d.licenseNo}</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">{d.licenseCategory}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className={`text-sm font-medium ${expired ? "text-red-600 dark:text-red-400" : expiringSoon ? "text-amber-600 dark:text-amber-400" : "text-zinc-600 dark:text-zinc-300"}`}>
                      {fmtDate(d.licenseExpiry)}
                    </p>
                    {expired && <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse-dot" />EXPIRED</p>}
                    {expiringSoon && <p className="text-[10px] text-amber-500 dark:text-amber-400 font-medium mt-0.5">Expiring soon</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${d.safetyScore >= 80 ? "bg-emerald-500" : d.safetyScore >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${d.safetyScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 min-w-[2ch]">{d.safetyScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Badge status={d.status} /></td>
                  {canEdit && (
                    <td className="px-4 py-3.5">
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
