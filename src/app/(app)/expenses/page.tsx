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
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Fuel &amp; Expenses</h1>
          <p className="text-sm text-zinc-500">
            Total fuel: {fmtMoney(totalFuel)} · Other expenses: {fmtMoney(totalExpenses)}
          </p>
        </div>
        {canEdit && <ExpenseModals vehicles={vehicles} />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-700">
        {[["fuel","⛽ Fuel Logs"],["expenses","💳 Other Expenses"]].map(([t,label]) => (
          <a key={t} href={`?tab=${t}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}>
            {label}
          </a>
        ))}
      </div>

      {tab === "fuel" ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Trip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {fuelLogs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400">No fuel logs.</td></tr>}
              {fuelLogs.map((f) => (
                <tr key={f.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{f.vehicle.name}</p>
                    <p className="text-xs font-mono text-zinc-400">{f.vehicle.regNo}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{fmtDate(f.date)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{f.liters} L</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(f.cost)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{f.trip ? `${f.trip.source} → ${f.trip.destination}` : "Manual"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {expenses.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400">No expenses.</td></tr>}
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{e.vehicle.name}</p>
                    <p className="text-xs font-mono text-zinc-400">{e.vehicle.regNo}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{fmtDate(e.date)}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{STATUS_LABELS[e.category] ?? e.category}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300 font-medium">{fmtMoney(e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{e.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
