import { requireSession } from "@/lib/auth";
import { getKpis, getTripTrend } from "@/lib/analytics";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { fmtDate } from "@/lib/constants";
import { DashboardCharts } from "./DashboardCharts";
import Link from "next/link";

type SearchParams = Promise<{ type?: string; status?: string; region?: string }>;

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

  const KPI_CARDS = [
    { label: "Active Vehicles", value: kpis.activeVehicles, icon: "🚛", color: "text-blue-600" },
    { label: "Available", value: kpis.availableVehicles, icon: "✅", color: "text-emerald-600" },
    { label: "In Maintenance", value: kpis.inMaintenance, icon: "🔧", color: "text-amber-600" },
    { label: "Active Trips", value: kpis.activeTrips, icon: "🗺️", color: "text-indigo-600" },
    { label: "Pending Trips", value: kpis.pendingTrips, icon: "⏳", color: "text-orange-600" },
    { label: "Drivers On Duty", value: kpis.driversOnDuty, icon: "🧑‍✈️", color: "text-purple-600" },
    { label: "Fleet Utilization", value: `${kpis.utilizationPct}%`, icon: "📊", color: "text-rose-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Fleet operations overview</p>
        </div>
        {/* Filters */}
        <form className="flex items-center gap-2 flex-wrap">
          <select name="type" defaultValue={sp.type ?? ""} className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200">
            <option value="">All Types</option>
            {["TRUCK","VAN","MINI_TRUCK","BIKE"].map(t => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
          </select>
          <select name="status" defaultValue={sp.status ?? ""} className="text-sm rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-zinc-700 dark:text-zinc-200">
            <option value="">All Statuses</option>
            {["AVAILABLE","ON_TRIP","IN_SHOP","RETIRED"].map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
          </select>
          <button type="submit" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors">Filter</button>
          {(sp.type || sp.status) && (
            <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-700 underline">Clear</Link>
          )}
        </form>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {KPI_CARDS.map((k) => (
          <Card key={k.label} className="p-4 flex flex-col gap-2">
            <span className="text-2xl">{k.icon}</span>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-zinc-500 leading-tight">{k.label}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <DashboardCharts trend={trend} />

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active & pending trips */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">Active &amp; Pending Trips</h2>
            <Link href="/trips" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentTrips.length === 0 && (
              <p className="px-5 py-4 text-sm text-zinc-400">No active trips.</p>
            )}
            {recentTrips.map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {t.source} → {t.destination}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    {t.vehicle.name} · {t.driver.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge status={t.status} />
                  <span className="text-xs text-zinc-400">{fmtDate(t.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Expiring licenses */}
        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-800 dark:text-zinc-100">⚠️ License Alerts</h2>
            <Link href="/drivers" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {expiringDrivers.length === 0 && (
              <p className="px-5 py-4 text-sm text-zinc-400">No expiring licenses.</p>
            )}
            {expiringDrivers.map((d) => {
              const expired = new Date(d.licenseExpiry) < new Date();
              const daysLeft = Math.ceil((new Date(d.licenseExpiry).getTime() - Date.now()) / 86400000);
              return (
                <div key={d.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{d.name}</p>
                    <p className="text-xs text-zinc-400">{d.licenseNo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${expired ? "text-red-600" : "text-amber-600"}`}>
                      {expired ? "EXPIRED" : `${daysLeft}d left`}
                    </p>
                    <p className="text-xs text-zinc-400">{fmtDate(d.licenseExpiry)}</p>
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
