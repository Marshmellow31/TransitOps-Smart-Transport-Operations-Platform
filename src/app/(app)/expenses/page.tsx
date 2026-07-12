import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canWrite } from "@/lib/rbac";
import { fmtDate, fmtMoney, STATUS_LABELS } from "@/lib/constants";
import { ExpenseModals } from "./ExpenseModals";

type SP = Promise<{ tab?: string }>;

export default async function ExpensesPage({ searchParams }: { searchParams: SP }) {
  const session = await requireSession();
  const sp = await searchParams;
  const tab = sp.tab === "expenses" ? "expenses" : "fuel";
  const canEdit = canWrite(session.role as "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST", "expenses");

  const [vehicles, fuelLogs, expenses] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
    prisma.fuelLog.findMany({ include: { vehicle: true, trip: true }, orderBy: { date: "desc" } }),
    prisma.expense.findMany({ include: { vehicle: true }, orderBy: { date: "desc" } }),
  ]);

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Fuel &amp; Expenses</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Total fuel: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{fmtMoney(totalFuel)}</span> · Other expenses: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{fmtMoney(totalExpenses)}</span>
          </p>
        </div>
        {canEdit && <ExpenseModals vehicles={vehicles} />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-[#20263a]">
        {[["fuel","Fuel Logs"],["expenses","Other Expenses"]].map(([t,label]) => (
          <a key={t} href={`?tab=${t}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${tab === t ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400" : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"}`}>
            {t === "fuel" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 13V5a2 2 0 012-2h3a2 2 0 012 2v8"/><path d="M10 7l2-1.5V3M10 7v3a2 2 0 002 2h.5"/><path d="M3 13h7"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="12" height="9" rx="2"/><path d="M2 7h12"/><path d="M5 10h3"/></svg>
            )}
            {label}
          </a>
        ))}
      </div>

      {tab === "fuel" ? (
        <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-[#20263a] text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-[#0d1017]/50">
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Liters</th>
                <th className="px-4 py-3.5">Cost</th>
                <th className="px-4 py-3.5">Trip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#20263a]">
              {fuelLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3"><path d="M10 28V12a4 4 0 014-4h4a4 4 0 014 4v16"/><path d="M22 16l3-2.5V9M22 16v6a3 3 0 003 3h1"/><path d="M10 28h12"/></svg>
                <p className="text-sm font-medium text-zinc-400">No fuel logs yet</p>
                <p className="text-xs text-zinc-400 mt-1">Fuel logs are created automatically on trip completion or manually</p>
              </td></tr>}
              {fuelLogs.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#161b26]/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{f.vehicle.name}</p>
                    <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{f.vehicle.regNo}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-400">{fmtDate(f.date)}</td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{f.liters} L</td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(f.cost)}</td>
                  <td className="px-4 py-3.5 text-xs text-zinc-400">{f.trip ? `${f.trip.source} → ${f.trip.destination}` : <span className="text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-[#161b26] px-1.5 py-0.5 rounded text-[10px] font-medium">Manual</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] overflow-x-auto shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-[#20263a] text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-[#0d1017]/50">
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#20263a]">
              {expenses.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-zinc-300 dark:text-zinc-600 mb-3"><rect x="6" y="10" width="24" height="18" rx="3"/><path d="M6 16h24"/><path d="M12 22h6"/></svg>
                <p className="text-sm font-medium text-zinc-400">No expenses recorded</p>
                <p className="text-xs text-zinc-400 mt-1">Track tolls, repairs, insurance and more</p>
              </td></tr>}
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#161b26]/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{e.vehicle.name}</p>
                    <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{e.vehicle.regNo}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-400">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{STATUS_LABELS[e.category] ?? e.category}</td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(e.amount)}</td>
                  <td className="px-4 py-3.5 text-xs text-zinc-400">{e.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
