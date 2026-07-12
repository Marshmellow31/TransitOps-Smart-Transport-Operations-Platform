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
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Operational Cost by Vehicle</h2>
        {costData.length === 0 ? <p className="text-sm text-zinc-400">No cost data yet.</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number, name: string) => [`₹${v.toLocaleString("en-IN")}`, name]} />
              <Legend iconSize={10} />
              <Bar dataKey="fuel" name="Fuel" fill="#6366f1" stackId="a" />
              <Bar dataKey="maintenance" name="Maintenance" fill="#f59e0b" stackId="a" />
              <Bar dataKey="other" name="Other" fill="#10b981" stackId="a" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fuel efficiency */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 mb-4">Fuel Efficiency (km/L)</h2>
        {effData.length === 0 ? <p className="text-sm text-zinc-400">No trips completed yet.</p> : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={effData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`${v} km/L`, "Efficiency"]} />
              <Bar dataKey="efficiency" name="km/L" radius={[4,4,0,0]}>
                {effData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
