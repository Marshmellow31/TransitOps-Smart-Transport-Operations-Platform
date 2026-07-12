import "server-only";
import { prisma } from "./db";

/** Dashboard KPIs (SRS FR-DASH.1). Vehicle KPIs honor type/status/region filters. */
export async function getKpis(filter: { type?: string; status?: string; region?: string } = {}) {
  const vehicleWhere = {
    ...(filter.type ? { type: filter.type } : {}),
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.region ? { region: filter.region } : {}),
  };

  const [vehicles, activeTrips, pendingTrips, drivers] = await Promise.all([
    prisma.vehicle.findMany({ where: vehicleWhere }),
    prisma.trip.count({ where: { status: "DISPATCHED" } }),
    prisma.trip.count({ where: { status: "DRAFT" } }),
    prisma.driver.findMany(),
  ]);

  const nonRetired = vehicles.filter((v) => v.status !== "RETIRED");
  const onTrip = vehicles.filter((v) => v.status === "ON_TRIP").length;

  return {
    activeVehicles: nonRetired.length,
    availableVehicles: vehicles.filter((v) => v.status === "AVAILABLE").length,
    inMaintenance: vehicles.filter((v) => v.status === "IN_SHOP").length,
    activeTrips,
    pendingTrips,
    driversOnDuty: drivers.filter((d) => d.status === "AVAILABLE" || d.status === "ON_TRIP").length,
    utilizationPct: nonRetired.length ? Math.round((onTrip / nonRetired.length) * 1000) / 10 : 0,
  };
}

export type VehicleReportRow = {
  id: string;
  regNo: string;
  name: string;
  type: string;
  status: string;
  distanceKm: number;
  fuelLiters: number;
  fuelCost: number;
  maintenanceCost: number;
  otherExpenses: number;
  operationalCost: number;
  revenue: number;
  fuelEfficiencyKmPerL: number | null;
  roiPct: number | null;
};

/** Per-vehicle analytics (SRS §8): fuel efficiency, operational cost, ROI. */
export async function getVehicleReport(): Promise<VehicleReportRow[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: "COMPLETED" } },
      fuelLogs: true,
      maintenance: true,
      expenses: true,
    },
    orderBy: { name: "asc" },
  });

  return vehicles.map((v) => {
    const distanceKm = v.trips.reduce((s, t) => s + (t.actualKm ?? 0), 0);
    const fuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintenanceCost = v.maintenance.reduce((s, m) => s + m.cost, 0);
    const otherExpenses = v.expenses.reduce((s, e) => s + e.amount, 0);
    const revenue = v.trips.reduce((s, t) => s + t.revenue, 0);
    const roi = v.acquisitionCost > 0 ? ((revenue - (maintenanceCost + fuelCost)) / v.acquisitionCost) * 100 : null;
    return {
      id: v.id,
      regNo: v.regNo,
      name: v.name,
      type: v.type,
      status: v.status,
      distanceKm: Math.round(distanceKm),
      fuelLiters: Math.round(fuelLiters * 10) / 10,
      fuelCost: Math.round(fuelCost),
      maintenanceCost: Math.round(maintenanceCost),
      otherExpenses: Math.round(otherExpenses),
      operationalCost: Math.round(fuelCost + maintenanceCost + otherExpenses),
      revenue: Math.round(revenue),
      fuelEfficiencyKmPerL: fuelLiters > 0 ? Math.round((distanceKm / fuelLiters) * 100) / 100 : null,
      roiPct: roi === null ? null : Math.round(roi * 100) / 100,
    };
  });
}

/** Trips per day for the last 14 days (dashboard chart). */
export async function getTripTrend() {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const trips = await prisma.trip.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });
  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const t of trips) {
    const key = t.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }
  return [...byDay.entries()].map(([date, count]) => ({
    date: date.slice(5),
    trips: count,
  }));
}
