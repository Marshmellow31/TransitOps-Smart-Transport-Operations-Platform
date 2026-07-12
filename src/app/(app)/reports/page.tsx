import { requireSession } from "@/lib/auth";
import { getVehicleReport } from "@/lib/analytics";
import { Badge } from "@/components/ui/Badge";
import { fmtMoney, VEHICLE_TYPE_LABELS } from "@/lib/constants";
import { ReportCharts } from "./ReportCharts";
import Link from "next/link";

export default async function ReportsPage() {
  await requireSession();
  const rows = await getVehicleReport();

  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.operationalCost, 0);
  const totalKm = rows.reduce((s, r) => s + r.distanceKm, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Reports &amp; Analytics</h1>
          <p className="text-sm text-zinc-500">Per-vehicle operational KPIs</p>
        </div>
        <Link
          href="/reports/export"
          target="_blank"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          ⬇ Export CSV
        </Link>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue", value: fmtMoney(totalRevenue), icon: "💰", color: "text-emerald-600" },
          { label: "Total Operational Cost", value: fmtMoney(totalCost), icon: "📉", color: "text-red-600" },
          { label: "Total Distance", value: `${totalKm.toLocaleString()} km`, icon: "🛣️", color: "text-blue-600" },
          { label: "Net Profit", value: fmtMoney(totalRevenue - totalCost), icon: "📊", color: totalRevenue - totalCost >= 0 ? "text-emerald-600" : "text-red-600" },
        ].map(t => (
          <div key={t.label} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <span className="text-2xl">{t.icon}</span>
            <p className={`text-xl font-bold mt-1 ${t.color}`}>{t.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <ReportCharts rows={rows} />

      {/* Per-vehicle table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Distance</th>
              <th className="px-4 py-3">Fuel (L)</th>
              <th className="px-4 py-3">Efficiency</th>
              <th className="px-4 py-3">Fuel Cost</th>
              <th className="px-4 py-3">Maint. Cost</th>
              <th className="px-4 py-3">Other Exp.</th>
              <th className="px-4 py-3">Op. Cost</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{r.name}</p>
                  <p className="text-xs font-mono text-zinc-400">{r.regNo}</p>
                  <p className="text-xs text-zinc-400">{VEHICLE_TYPE_LABELS[r.type] ?? r.type}</p>
                </td>
                <td className="px-4 py-3"><Badge status={r.status} /></td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.distanceKm.toLocaleString()} km</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{r.fuelLiters} L</td>
                <td className="px-4 py-3 font-medium">
                  {r.fuelEfficiencyKmPerL !== null
                    ? <span className={r.fuelEfficiencyKmPerL >= 10 ? "text-emerald-600" : r.fuelEfficiencyKmPerL >= 7 ? "text-amber-600" : "text-red-600"}>{r.fuelEfficiencyKmPerL} km/L</span>
                    : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtMoney(r.fuelCost)}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtMoney(r.maintenanceCost)}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{fmtMoney(r.otherExpenses)}</td>
                <td className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-200">{fmtMoney(r.operationalCost)}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{fmtMoney(r.revenue)}</td>
                <td className="px-4 py-3 font-semibold">
                  {r.roiPct !== null
                    ? <span className={r.roiPct >= 0 ? "text-emerald-600" : "text-red-600"}>{r.roiPct}%</span>
                    : <span className="text-zinc-400">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
