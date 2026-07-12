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

  const summaryCards = [
    { label: "Total Revenue", value: fmtMoney(totalRevenue), gradient: "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/5", color: "text-emerald-600 dark:text-emerald-400", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 2v18"/><path d="M7 6h6a2.5 2.5 0 110 5H7"/><path d="M7 11h7a2.5 2.5 0 110 5H7"/></svg> },
    { label: "Operational Cost", value: fmtMoney(totalCost), gradient: "from-red-500/10 to-red-600/5 dark:from-red-500/15 dark:to-red-600/5", color: "text-red-600 dark:text-red-400", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 17V7l4 4 3-6 4 3 3-5"/><path d="M3 17h16"/></svg> },
    { label: "Total Distance", value: `${totalKm.toLocaleString()} km`, gradient: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/15 dark:to-blue-600/5", color: "text-blue-600 dark:text-blue-400", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 18h14"/><path d="M4 18l3-8h8l3 8"/><circle cx="11" cy="6" r="3"/></svg> },
    { label: "Net Profit", value: fmtMoney(totalRevenue - totalCost), gradient: totalRevenue - totalCost >= 0 ? "from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/15 dark:to-emerald-600/5" : "from-red-500/10 to-red-600/5 dark:from-red-500/15 dark:to-red-600/5", color: totalRevenue - totalCost >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400", icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M11 7v4l2.5 2.5"/></svg> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Reports &amp; Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Per-vehicle operational KPIs</p>
        </div>
        <Link
          href="/reports/export"
          target="_blank"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.97] shadow-md shadow-emerald-600/20"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v8M5 7l3 3 3-3"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"/></svg>
          Export CSV
        </Link>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryCards.map((t, i) => (
          <div key={t.label} className={`animate-slide-up stagger-${i + 1} bg-gradient-to-br ${t.gradient} bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/60 dark:border-[#20263a] p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}>
            <span className={t.color}>{t.icon}</span>
            <p className={`text-xl font-extrabold mt-2 ${t.color} tracking-tight`}>{t.value}</p>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <ReportCharts rows={rows} />

      {/* Per-vehicle table */}
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-[#20263a] text-left text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/50 dark:bg-[#0d1017]/50">
              <th className="px-4 py-3.5">Vehicle</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Distance</th>
              <th className="px-4 py-3.5">Fuel (L)</th>
              <th className="px-4 py-3.5">Efficiency</th>
              <th className="px-4 py-3.5">Fuel Cost</th>
              <th className="px-4 py-3.5">Maint. Cost</th>
              <th className="px-4 py-3.5">Other Exp.</th>
              <th className="px-4 py-3.5">Op. Cost</th>
              <th className="px-4 py-3.5">Revenue</th>
              <th className="px-4 py-3.5">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-[#20263a]">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#161b26]/50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{r.name}</p>
                  <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">{r.regNo}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{VEHICLE_TYPE_LABELS[r.type] ?? r.type}</p>
                </td>
                <td className="px-4 py-3.5"><Badge status={r.status} /></td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{r.distanceKm.toLocaleString()} km</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{r.fuelLiters} L</td>
                <td className="px-4 py-3.5 font-semibold">
                  {r.fuelEfficiencyKmPerL !== null
                    ? <span className={r.fuelEfficiencyKmPerL >= 10 ? "text-emerald-600 dark:text-emerald-400" : r.fuelEfficiencyKmPerL >= 7 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}>{r.fuelEfficiencyKmPerL} km/L</span>
                    : <span className="text-zinc-400">—</span>}
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{fmtMoney(r.fuelCost)}</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{fmtMoney(r.maintenanceCost)}</td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-300">{fmtMoney(r.otherExpenses)}</td>
                <td className="px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-200">{fmtMoney(r.operationalCost)}</td>
                <td className="px-4 py-3.5 font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(r.revenue)}</td>
                <td className="px-4 py-3.5 font-bold">
                  {r.roiPct !== null
                    ? <span className={r.roiPct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{r.roiPct}%</span>
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
