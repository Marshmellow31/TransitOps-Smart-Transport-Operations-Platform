import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const day = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * day);
const daysAhead = (n: number) => new Date(now.getTime() + n * day);

async function main() {
  // wipe in FK-safe order (idempotent reseed)
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // ---- Users (one per role) ----
  const users = [
    { name: "Meera Fleet", email: "fleet@transitops.io", password: "fleet123", role: "FLEET_MANAGER" },
    { name: "Dev Dispatch", email: "driver@transitops.io", password: "driver123", role: "DRIVER" },
    { name: "Sana Safety", email: "safety@transitops.io", password: "safety123", role: "SAFETY_OFFICER" },
    { name: "Farhan Finance", email: "finance@transitops.io", password: "finance123", role: "FINANCIAL_ANALYST" },
  ];
  for (const u of users) {
    await prisma.user.create({
      data: { name: u.name, email: u.email, role: u.role, passwordHash: await bcrypt.hash(u.password, 10) },
    });
  }

  // ---- Vehicles: every status represented ----
  const [van05, truck01, mini02, van07, truck03, bike01, vanOld, truckShop] = await Promise.all(
    [
      { regNo: "MH-12-AB-1005", name: "Van-05 (Tata Ace)", type: "VAN", maxLoadKg: 500, odometerKm: 42350, acquisitionCost: 850000, status: "AVAILABLE", region: "West" },
      { regNo: "MH-12-CD-2001", name: "Truck-01 (Eicher Pro)", type: "TRUCK", maxLoadKg: 5000, odometerKm: 118400, acquisitionCost: 2400000, status: "AVAILABLE", region: "West" },
      { regNo: "DL-01-EF-3002", name: "Mini-02 (Mahindra Jeeto)", type: "MINI_TRUCK", maxLoadKg: 700, odometerKm: 23100, acquisitionCost: 520000, status: "AVAILABLE", region: "North" },
      { regNo: "KA-05-GH-4007", name: "Van-07 (Maruti Eeco)", type: "VAN", maxLoadKg: 450, odometerKm: 61200, acquisitionCost: 610000, status: "AVAILABLE", region: "South" },
      { regNo: "KA-05-IJ-5003", name: "Truck-03 (Ashok Leyland)", type: "TRUCK", maxLoadKg: 8000, odometerKm: 201500, acquisitionCost: 3200000, status: "AVAILABLE", region: "South" },
      { regNo: "DL-01-KL-6001", name: "Bike-01 (Hero Splendor)", type: "BIKE", maxLoadKg: 30, odometerKm: 15800, acquisitionCost: 78000, status: "AVAILABLE", region: "North" },
      { regNo: "MH-12-MN-7009", name: "Van-09 (Old Omni)", type: "VAN", maxLoadKg: 400, odometerKm: 189000, acquisitionCost: 320000, status: "RETIRED", region: "West" },
      { regNo: "DL-01-OP-8004", name: "Truck-04 (BharatBenz)", type: "TRUCK", maxLoadKg: 6000, odometerKm: 96700, acquisitionCost: 2800000, status: "IN_SHOP", region: "North" },
    ].map((v) => prisma.vehicle.create({ data: v }))
  );

  // ---- Drivers: valid, expiring-soon, expired, suspended, off-duty ----
  const [alex, priya, ravi, john, sunita, vikram] = await Promise.all(
    [
      { name: "Alex Kumar", licenseNo: "DL-2019-0012345", licenseCategory: "LMV", licenseExpiry: daysAhead(400), phone: "+91 98200 11001", safetyScore: 92, status: "AVAILABLE" },
      { name: "Priya Sharma", licenseNo: "MH-2020-0067890", licenseCategory: "HMV", licenseExpiry: daysAhead(700), phone: "+91 98200 11002", safetyScore: 88, status: "AVAILABLE" },
      { name: "Ravi Verma", licenseNo: "KA-2018-0034567", licenseCategory: "HMV", licenseExpiry: daysAhead(21), phone: "+91 98200 11003", safetyScore: 75, status: "AVAILABLE" }, // expiring soon
      { name: "John D'Souza", licenseNo: "MH-2015-0090123", licenseCategory: "LMV", licenseExpiry: daysAgo(45), phone: "+91 98200 11004", safetyScore: 81, status: "AVAILABLE" }, // EXPIRED license
      { name: "Sunita Patil", licenseNo: "DL-2021-0056789", licenseCategory: "LMV", licenseExpiry: daysAhead(900), phone: "+91 98200 11005", safetyScore: 45, status: "SUSPENDED" },
      { name: "Vikram Singh", licenseNo: "KA-2022-0011122", licenseCategory: "MCWG", licenseExpiry: daysAhead(650), phone: "+91 98200 11006", safetyScore: 95, status: "OFF_DUTY" },
    ].map((d) => prisma.driver.create({ data: d }))
  );

  // ---- Historic completed trips (feed analytics) ----
  const completedTrips = [
    { vehicle: van05, driver: alex, source: "Mumbai", destination: "Pune", cargoKg: 420, plannedKm: 150, actualKm: 155, revenue: 18000, fuel: 14.5, fuelCost: 1450, ago: 12 },
    { vehicle: truck01, driver: priya, source: "Mumbai", destination: "Nashik", cargoKg: 4200, plannedKm: 170, actualKm: 168, revenue: 52000, fuel: 42, fuelCost: 4200, ago: 9 },
    { vehicle: mini02, driver: alex, source: "Delhi", destination: "Gurgaon", cargoKg: 500, plannedKm: 35, actualKm: 38, revenue: 6500, fuel: 4.2, fuelCost: 420, ago: 7 },
    { vehicle: van07, driver: ravi, source: "Bengaluru", destination: "Mysuru", cargoKg: 380, plannedKm: 145, actualKm: 149, revenue: 15500, fuel: 13.8, fuelCost: 1380, ago: 5 },
    { vehicle: truck03, driver: priya, source: "Bengaluru", destination: "Chennai", cargoKg: 7200, plannedKm: 350, actualKm: 356, revenue: 98000, fuel: 95, fuelCost: 9500, ago: 3 },
    { vehicle: van05, driver: ravi, source: "Pune", destination: "Nashik", cargoKg: 300, plannedKm: 210, actualKm: 214, revenue: 21000, fuel: 19.5, fuelCost: 1950, ago: 2 },
  ];
  for (const t of completedTrips) {
    const startOdo = t.vehicle.odometerKm - t.actualKm;
    const trip = await prisma.trip.create({
      data: {
        source: t.source, destination: t.destination,
        vehicleId: t.vehicle.id, driverId: t.driver.id,
        cargoKg: t.cargoKg, plannedKm: t.plannedKm, actualKm: t.actualKm,
        revenue: t.revenue, startOdometer: startOdo, endOdometer: startOdo + t.actualKm,
        fuelConsumedL: t.fuel, status: "COMPLETED",
        createdAt: daysAgo(t.ago + 1), dispatchedAt: daysAgo(t.ago + 1), completedAt: daysAgo(t.ago),
      },
    });
    await prisma.fuelLog.create({
      data: { vehicleId: t.vehicle.id, tripId: trip.id, liters: t.fuel, cost: t.fuelCost, date: daysAgo(t.ago) },
    });
  }

  // ---- A dispatched (active) trip: Truck-01 + Priya are ON_TRIP ----
  await prisma.trip.create({
    data: {
      source: "Mumbai", destination: "Surat",
      vehicleId: truck01.id, driverId: priya.id,
      cargoKg: 3800, plannedKm: 280, revenue: 61000,
      startOdometer: truck01.odometerKm, status: "DISPATCHED",
      createdAt: daysAgo(1), dispatchedAt: daysAgo(0.5),
    },
  });
  await prisma.vehicle.update({ where: { id: truck01.id }, data: { status: "ON_TRIP" } });
  await prisma.driver.update({ where: { id: priya.id }, data: { status: "ON_TRIP" } });

  // ---- A draft (pending) trip ----
  await prisma.trip.create({
    data: {
      source: "Delhi", destination: "Jaipur",
      vehicleId: mini02.id, driverId: alex.id,
      cargoKg: 550, plannedKm: 270, revenue: 19000, status: "DRAFT",
      createdAt: daysAgo(0.2),
    },
  });

  // ---- A cancelled trip ----
  await prisma.trip.create({
    data: {
      source: "Chennai", destination: "Coimbatore",
      vehicleId: truck03.id, driverId: ravi.id,
      cargoKg: 5000, plannedKm: 500, revenue: 0, status: "CANCELLED",
      createdAt: daysAgo(6), dispatchedAt: daysAgo(6),
    },
  });

  // ---- Maintenance: one OPEN (explains Truck-04 IN_SHOP) + closed history ----
  await prisma.maintenanceLog.create({
    data: { vehicleId: truckShop.id, type: "Gearbox Overhaul", description: "Grinding noise in 3rd gear", cost: 48000, startDate: daysAgo(2), status: "OPEN" },
  });
  await prisma.maintenanceLog.create({
    data: { vehicleId: van05.id, type: "Oil Change", description: "Scheduled 40k km service", cost: 3500, startDate: daysAgo(20), endDate: daysAgo(19), status: "CLOSED" },
  });
  await prisma.maintenanceLog.create({
    data: { vehicleId: truck01.id, type: "Brake Service", description: "Front pads replaced", cost: 12500, startDate: daysAgo(15), endDate: daysAgo(14), status: "CLOSED" },
  });
  await prisma.maintenanceLog.create({
    data: { vehicleId: truck03.id, type: "Tyre Replacement", description: "4 rear tyres", cost: 56000, startDate: daysAgo(30), endDate: daysAgo(28), status: "CLOSED" },
  });

  // ---- Standalone fuel logs (non-trip top-ups) ----
  await prisma.fuelLog.create({ data: { vehicleId: van07.id, liters: 25, cost: 2500, date: daysAgo(8) } });
  await prisma.fuelLog.create({ data: { vehicleId: bike01.id, liters: 8, cost: 800, date: daysAgo(4) } });

  // ---- Expenses ----
  await prisma.expense.create({ data: { vehicleId: truck01.id, category: "TOLL", amount: 1850, date: daysAgo(9), note: "Mumbai–Nashik expressway" } });
  await prisma.expense.create({ data: { vehicleId: truck03.id, category: "TOLL", amount: 3200, date: daysAgo(3), note: "Bengaluru–Chennai NH48" } });
  await prisma.expense.create({ data: { vehicleId: van05.id, category: "INSURANCE", amount: 24000, date: daysAgo(60), note: "Annual comprehensive" } });
  await prisma.expense.create({ data: { vehicleId: mini02.id, category: "OTHER", amount: 900, date: daysAgo(7), note: "Parking + cleaning" } });

  console.log("Seed complete:", {
    users: await prisma.user.count(),
    vehicles: await prisma.vehicle.count(),
    drivers: await prisma.driver.count(),
    trips: await prisma.trip.count(),
    maintenance: await prisma.maintenanceLog.count(),
    fuelLogs: await prisma.fuelLog.count(),
    expenses: await prisma.expense.count(),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
