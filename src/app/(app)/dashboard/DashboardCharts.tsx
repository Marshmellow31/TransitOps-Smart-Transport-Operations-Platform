"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function DashboardCharts({ trend }: { trend: { date: string; trips: number }[] }) {
  return (
    <div className="bg-white dark:bg-[#12151d] rounded-2xl border border-zinc-200/80 dark:border-[#20263a] shadow-sm p-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-5">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-500"><path d="M2 15V6l4 4 3-6 4 3 3-5"/><path d="M2 15h14"/></svg>
        <h2 className="font-semibold text-[15px] text-zinc-800 dark:text-zinc-100">Trip Activity</h2>
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Last 14 days</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-100 dark:text-[#20263a]" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              fontSize: 12,
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
              backgroundColor: 'rgba(255,255,255,0.95)',
            }}
            formatter={(v: number) => [v, "Trips"]}
          />
          <Area type="monotone" dataKey="trips" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad)" dot={false} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
