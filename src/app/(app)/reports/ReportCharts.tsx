"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from "recharts";
import type { VehicleReportRow } from "@/lib/analytics";

const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#3b82f6","#14b8a6","#ec4899"];

export function ReportCharts({ rows }: { rows: VehicleReportRow[] }) {
  const costData = rows
    .filter(r => r.operationalCost > 0)
    .map((r, i) => ({ name: r.name.split(" ")[0], fuel: r.fuelCost, maintenance: r.maintenanceCost, other: r.otherExpenses, fill: COLORS[i % COLORS.length] }));

  const effData = rows
    .filter(r => r.fuelEfficiencyKmPerL !== null)
    .map(r => ({ name: r.name.split(" ")[0], efficiency: r.fuelEfficiencyKmPerL }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cost breakdown */}
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-500"><rect x="2" y="4" width="3" height="12" rx="1"/><rect x="7.5" y="2" width="3" height="14" rx="1"/><rect x="13" y="7" width="3" height="9" rx="1"/></svg>
          <h2 className="font-semibold text-[15px] text-zinc-800 dark:text-zinc-100">Operational Cost by Vehicle</h2>
        </div>
        {costData.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-zinc-400">No cost data yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={costData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-[#20263a]" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN")}`, name]}
              />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="fuel" name="Fuel" fill="#6366f1" stackId="a" />
              <Bar dataKey="maintenance" name="Maintenance" fill="#f59e0b" stackId="a" />
              <Bar dataKey="other" name="Other" fill="#10b981" stackId="a" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fuel efficiency */}
      <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-emerald-500"><path d="M5 15V7a2.5 2.5 0 012.5-2.5h3A2.5 2.5 0 0113 7v8"/><path d="M13 9l2-1.5V5M5 15h8"/></svg>
          <h2 className="font-semibold text-[15px] text-zinc-800 dark:text-zinc-100">Fuel Efficiency (km/L)</h2>
        </div>
        {effData.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-zinc-400">No trips completed yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={effData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-[#20263a]" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)', backgroundColor: 'rgba(255,255,255,0.95)' }}
                formatter={(v: number) => [`${v} km/L`, "Efficiency"]}
              />
              <Bar dataKey="efficiency" name="km/L" radius={[6,6,0,0]}>
                {effData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
