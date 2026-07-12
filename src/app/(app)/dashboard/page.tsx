import { requireSession } from "@/lib/auth";
import { getKpis, getTripTrend } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/lib/constants";
import { DashboardCharts } from "./DashboardCharts";
import Link from "next/link";

type SearchParams = Promise<{ type?: string; status?: string; region?: string }>;

/* ─── KPI SVG icons ─── */
const kpiIcons: Record<string, React.ReactNode> = {
  activeVehicles: <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="18" height="10" rx="2.5"/><circle cx="6.5" cy="17" r="2"/><circle cx="15.5" cy="17" r="2"/><path d="M8.5 17h5"/></svg>,
  available: <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M8 11l2 2 4-4"/></svg>,
  maintenance: <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5L11 7l1 2-2 1-3.5 3.5a2.12 2.12 0 003 3L13 13l1-2 2 1 3.5-3.5c.5-2-.5-4-2.5-5z"/><path d="M3 19l3-3"/></svg>,
  activeTrips: <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h12M12 5l7 7-7 7"/></svg>,
  pending: <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M11 7v4l3 2"/></svg>,
  drivers: <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="7" r="3.5"/><path d="M4 19c0-3.5 3.1-6 7-6s7 2.5 7 6"/></svg>,
  utilization: <svg width="17" height="17" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 3a8 8 0 110 16 8 8 0 010-16z"/><path d="M11 3a8 8 0 014.9 14.3" strokeDasharray="3 3"/><path d="M11 7v4l2.5 2.5"/></svg>,
};

/* Icon-chip tones from the design doc: indigo/green/blue/amber/violet */
const KPI_CONFIG = [
  { key: "activeVehicles", label: "Active Vehicles", icon: "activeVehicles", chipBg: "bg-[#eef0fe] text-[#4f46e5] dark:bg-[#6d5cf629] dark:text-[#a5b0ff]" },
  { key: "available", label: "Available Now", icon: "available", chipBg: "bg-[#e7f6ee] text-[#1f8a5b] dark:bg-[#22965e29] dark:text-[#4cd08a]" },
  { key: "maintenance", label: "In Shop", icon: "maintenance", chipBg: "bg-[#fdf1dd] text-[#a9701a] dark:bg-[#a9701a33] dark:text-[#e3b465]" },
  { key: "activeTrips", label: "Active Trips", icon: "activeTrips", chipBg: "bg-[#e8f0fe] text-[#2a6fdb] dark:bg-[#2a6fdb2e] dark:text-[#6ea8ff]" },
  { key: "pending", label: "Pending Dispatch", icon: "pending", chipBg: "bg-[#fdf1dd] text-[#a9701a] dark:bg-[#a9701a33] dark:text-[#e3b465]" },
  { key: "drivers", label: "Drivers On Duty", icon: "drivers", chipBg: "bg-[#f0ecfe] text-[#7c5cf6] dark:bg-[#7c5cf62e] dark:text-[#c3b2ff]" },
  { key: "utilization", label: "Fleet Utilization", icon: "utilization", chipBg: "bg-[#e8f0fe] text-[#2a6fdb] dark:bg-[#2a6fdb2e] dark:text-[#6ea8ff]" },
];

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  await requireSession();
  const sp = await searchParams;
  const filter = {
    type: sp.type || undefined,
    status: sp.status || undefined,
    region: sp.region || undefined,
  };

  const [kpis, trend, recentTrips, expiringDrivers] = await Promise.all([
    getKpis(filter),
    getTripTrend(),
    prisma.trip.findMany({
      where: { status: { in: ["DRAFT", "DISPATCHED"] } },
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.driver.findMany({
      where: {
        status: { not: "SUSPENDED" },
        licenseExpiry: { lt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { licenseExpiry: "asc" },
      take: 5,
    }),
  ]);

  const kpiValues: Record<string, string | number> = {
    activeVehicles: kpis.activeVehicles,
    available: kpis.availableVehicles,
    maintenance: kpis.inMaintenance,
    activeTrips: kpis.activeTrips,
    pending: kpis.pendingTrips,
    drivers: kpis.driversOnDuty,
    utilization: `${kpis.utilizationPct}%`,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11.5px] font-bold tracking-[.1em] uppercase text-[#4f46e5] dark:text-[#a5b0ff] mb-1">Operations overview</p>
          <h1 className="font-display text-[26px] font-bold text-[#14161e] dark:text-[#e8eaf0]">Fleet Dashboard</h1>
          <p className="text-[13px] text-[#6b7280] dark:text-[#98a0b0] mt-1">Live snapshot across all vehicles, drivers and trips</p>
        </div>
        {/* Filters */}
        <form className="flex items-center gap-2 flex-wrap">
          <select name="type" defaultValue={sp.type ?? ""} className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3 py-2 text-zinc-700 dark:text-zinc-200 transition-colors">
            <option value="">All Types</option>
            {["TRUCK","VAN","MINI_TRUCK","BIKE"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
          </select>
          <select name="status" defaultValue={sp.status ?? ""} className="text-sm rounded-xl border border-zinc-300 dark:border-[#2a3145] bg-white dark:bg-[#161b26] px-3 py-2 text-zinc-700 dark:text-zinc-200 transition-colors">
            <option value="">All Statuses</option>
            {["AVAILABLE","ON_TRIP","IN_SHOP","RETIRED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
          </select>
          <button type="submit" className="text-sm bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] hover:brightness-[1.06] text-white px-4 py-2 rounded-xl font-semibold transition-all active:scale-[0.97] shadow-sm shadow-indigo-600/20">Filter</button>
          {(sp.type || sp.status) && (
            <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline underline-offset-2 transition-colors">Clear</Link>
          )}
        </form>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {KPI_CONFIG.map((k, i) => (
          <div
            key={k.key}
            className={`animate-slide-up stagger-${i + 1} bg-white dark:bg-[#12151d] rounded-2xl border border-[#e7e9ef] dark:border-[#20263a] p-4 flex flex-col gap-3 hover:-translate-y-[3px] hover:shadow-[0_14px_30px_-16px_rgba(30,32,60,.35)] transition-all duration-200 cursor-default`}
          >
            <span className={`w-9 h-9 rounded-[11px] grid place-items-center ${k.chipBg}`}>{kpiIcons[k.icon]}</span>
            <div>
              <p className="font-display text-[28px] leading-none font-bold text-[#14161e] dark:text-[#e8eaf0] tabular-nums">{kpiValues[k.key]}</p>
              <p className="text-[12px] font-medium text-[#6b7280] dark:text-[#98a0b0] mt-1.5 leading-tight">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <DashboardCharts trend={trend} />

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active & pending trips */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#20263a]">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-indigo-500"><path d="M4 10h10M10 4l6 6-6 6"/></svg>
              <h2 className="font-semibold text-[15px] text-zinc-800 dark:text-zinc-100">Active & Pending Trips</h2>
            </div>
            <Link href="/trips" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-[#20263a]">
            {recentTrips.length === 0 && (
              <div className="px-5 py-8 text-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-zinc-300 dark:text-zinc-600 mb-2"><circle cx="16" cy="16" r="12"/><path d="M12 16h8"/></svg>
                <p className="text-sm text-zinc-400">No active trips right now</p>
                <p className="text-xs text-zinc-400 mt-1">Dispatched and draft trips appear here</p>
              </div>
            )}
            {recentTrips.map((t) => (
              <div key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-[#161b26] transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {t.source} <span className="text-zinc-400 dark:text-zinc-500 font-normal">→</span> {t.destination}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                    {t.vehicle.name} · {t.driver.name}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge status={t.status} />
                  <span className="text-xs text-zinc-400 hidden sm:inline">{fmtDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Expiring licenses */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#20263a]">
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-amber-500"><path d="M9 2L2 16h14L9 2z"/><path d="M9 7v3M9 13h.01"/></svg>
              <h2 className="font-semibold text-[15px] text-zinc-800 dark:text-zinc-100">License Alerts</h2>
            </div>
            <Link href="/drivers" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-[#20263a]">
            {expiringDrivers.length === 0 && (
              <div className="px-5 py-8 text-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-emerald-400 dark:text-emerald-600 mb-2"><circle cx="16" cy="16" r="12"/><path d="M11 16l3 3 7-7"/></svg>
                <p className="text-sm text-zinc-400">All licenses are up to date</p>
              </div>
            )}
            {expiringDrivers.map((d) => {
              const expired = new Date(d.licenseExpiry) < new Date();
              const daysLeft = Math.ceil((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000);
              return (
                <div key={d.id} className="px-5 py-3.5 flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-[#161b26] transition-colors">
                  <div className="flex items-center gap-3">
                    {expired && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse-dot shrink-0" />}
                    {!expired && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{d.name}</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{d.licenseNo}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold ${expired ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {expired ? "EXPIRED" : `${daysLeft}d left`}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">{fmtDate(d.licenseExpiry)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
