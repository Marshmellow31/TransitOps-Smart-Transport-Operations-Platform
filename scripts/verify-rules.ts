/**
 * Adversarial verification of BR-1..BR-10 against the real rule engine + DB.
 * Run: NODE_OPTIONS="--conditions=react-server" npx tsx scripts/verify-rules.ts
 * NOTE: mutates data — reseed afterwards with `npx prisma db seed`.
 */
import { prisma } from "../src/lib/db";
import { DomainError } from "../src/lib/errors";
import {
  createVehicle, createTrip, dispatchTrip, completeTrip, cancelTrip,
  createMaintenance, closeMaintenance, dispatchableVehicles, assignableDrivers,
} from "../src/lib/domain";
import { requireWrite } from "../src/lib/rbac";

let pass = 0, fail = 0;
function ok(name: string, cond: boolean, detail = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}
async function expectDomainError(name: string, fn: () => Promise<unknown>, msgPart?: string) {
  try {
    await fn();
    ok(name, false, "(no error thrown)");
  } catch (e) {
    if (e instanceof DomainError && (!msgPart || e.message.toLowerCase().includes(msgPart.toLowerCase()))) {
      ok(`${name} → "${(e as Error).message.slice(0, 70)}…"`, true);
    } else {
      ok(name, false, `(wrong error: ${(e as Error).message})`);
    }
  }
}

async function main() {
  const van05 = await prisma.vehicle.findUniqueOrThrow({ where: { regNo: "MH-12-AB-1005" } });
  const alex = await prisma.driver.findUniqueOrThrow({ where: { licenseNo: "DL-2019-0012345" } });
  const john = await prisma.driver.findUniqueOrThrow({ where: { licenseNo: "MH-2015-0090123" } }); // expired
  const sunita = await prisma.driver.findUniqueOrThrow({ where: { licenseNo: "DL-2021-0056789" } }); // suspended
  const truckShop = await prisma.vehicle.findUniqueOrThrow({ where: { regNo: "DL-01-OP-8004" } }); // IN_SHOP
  const vanRetired = await prisma.vehicle.findUniqueOrThrow({ where: { regNo: "MH-12-MN-7009" } }); // RETIRED

  console.log("\nBR-1 unique registration number");
  await expectDomainError("duplicate regNo rejected", () =>
    createVehicle({ regNo: "mh-12-ab-1005", name: "Clone", type: "VAN", maxLoadKg: 500, odometerKm: 0, acquisitionCost: 1, region: "West" }),
    "already exists");

  console.log("\nBR-2 retired / in-shop vehicles never dispatchable");
  const pool = await dispatchableVehicles();
  ok("IN_SHOP vehicle not in selection pool", !pool.some(v => v.id === truckShop.id));
  ok("RETIRED vehicle not in selection pool", !pool.some(v => v.id === vanRetired.id));
  await expectDomainError("trip with IN_SHOP vehicle rejected", () =>
    createTrip({ source: "A", destination: "B", vehicleId: truckShop.id, driverId: alex.id, cargoKg: 100, plannedKm: 10, revenue: 1 }),
    "cannot be dispatched");
  await expectDomainError("trip with RETIRED vehicle rejected", () =>
    createTrip({ source: "A", destination: "B", vehicleId: vanRetired.id, driverId: alex.id, cargoKg: 100, plannedKm: 10, revenue: 1 }),
    "cannot be dispatched");

  console.log("\nBR-3 expired license / suspended driver cannot be assigned");
  const dpool = await assignableDrivers();
  ok("expired-license driver not in pool", !dpool.some(d => d.id === john.id));
  ok("suspended driver not in pool", !dpool.some(d => d.id === sunita.id));
  await expectDomainError("trip with expired-license driver rejected", () =>
    createTrip({ source: "A", destination: "B", vehicleId: van05.id, driverId: john.id, cargoKg: 100, plannedKm: 10, revenue: 1 }),
    "expired");
  await expectDomainError("trip with suspended driver rejected", () =>
    createTrip({ source: "A", destination: "B", vehicleId: van05.id, driverId: sunita.id, cargoKg: 100, plannedKm: 10, revenue: 1 }),
    "cannot be assigned");

  console.log("\nBR-5 cargo must not exceed capacity");
  await expectDomainError("620 kg in 500 kg Van-05 rejected", () =>
    createTrip({ source: "Mumbai", destination: "Pune", vehicleId: van05.id, driverId: alex.id, cargoKg: 620, plannedKm: 150, revenue: 18000 }),
    "exceeds");

  console.log("\nBR-6/BR-4/BR-7 dispatch → lock → complete lifecycle");
  const trip = await createTrip({ source: "Mumbai", destination: "Pune", vehicleId: van05.id, driverId: alex.id, cargoKg: 450, plannedKm: 150, revenue: 18000 });
  ok("450 kg trip created as DRAFT", trip.status === "DRAFT");
  await dispatchTrip(trip.id);
  const [v1, d1] = [await prisma.vehicle.findUniqueOrThrow({ where: { id: van05.id } }), await prisma.driver.findUniqueOrThrow({ where: { id: alex.id } })];
  ok("BR-6: vehicle ON_TRIP after dispatch", v1.status === "ON_TRIP");
  ok("BR-6: driver ON_TRIP after dispatch", d1.status === "ON_TRIP");
  await expectDomainError("BR-4: same vehicle cannot get a second trip", () =>
    createTrip({ source: "X", destination: "Y", vehicleId: van05.id, driverId: alex.id, cargoKg: 10, plannedKm: 5, revenue: 1 }),
    "cannot be");
  await expectDomainError("odometer rollback rejected on complete", () =>
    completeTrip(trip.id, { endOdometer: v1.odometerKm - 100, fuelConsumedL: 10, fuelCost: 1000 }),
    "cannot be less");
  await completeTrip(trip.id, { endOdometer: v1.odometerKm + 155, fuelConsumedL: 14.5, fuelCost: 1450 });
  const [v2, d2, t2] = [
    await prisma.vehicle.findUniqueOrThrow({ where: { id: van05.id } }),
    await prisma.driver.findUniqueOrThrow({ where: { id: alex.id } }),
    await prisma.trip.findUniqueOrThrow({ where: { id: trip.id } }),
  ];
  ok("BR-7: vehicle AVAILABLE after complete", v2.status === "AVAILABLE");
  ok("BR-7: driver AVAILABLE after complete", d2.status === "AVAILABLE");
  ok("odometer rolled forward +155", v2.odometerKm === v1.odometerKm + 155);
  ok("actualKm computed", t2.actualKm === 155);
  ok("fuel log auto-created for trip", (await prisma.fuelLog.count({ where: { tripId: trip.id } })) === 1);
  await expectDomainError("completed trip cannot be cancelled", () => cancelTrip(trip.id), "cannot be cancelled");
  await expectDomainError("completed trip cannot re-complete", () =>
    completeTrip(trip.id, { endOdometer: 999999, fuelConsumedL: 1, fuelCost: 1 }), "Only Dispatched");

  console.log("\nBR-8 cancelling a dispatched trip restores both");
  const trip2 = await createTrip({ source: "Pune", destination: "Nashik", vehicleId: van05.id, driverId: alex.id, cargoKg: 300, plannedKm: 210, revenue: 21000 });
  await dispatchTrip(trip2.id);
  await cancelTrip(trip2.id);
  ok("vehicle AVAILABLE after cancel", (await prisma.vehicle.findUniqueOrThrow({ where: { id: van05.id } })).status === "AVAILABLE");
  ok("driver AVAILABLE after cancel", (await prisma.driver.findUniqueOrThrow({ where: { id: alex.id } })).status === "AVAILABLE");

  console.log("\nBR-9/BR-10 maintenance workflow");
  const mnt = await createMaintenance({ vehicleId: van05.id, type: "Oil Change", description: "test", cost: 3500 });
  ok("BR-9: vehicle IN_SHOP after opening record", (await prisma.vehicle.findUniqueOrThrow({ where: { id: van05.id } })).status === "IN_SHOP");
  ok("BR-9: in-shop vehicle hidden from dispatch pool", !(await dispatchableVehicles()).some(v => v.id === van05.id));
  await expectDomainError("dispatch of trip using now-in-shop vehicle blocked", async () => {
    const t = await prisma.trip.create({ data: { source: "A", destination: "B", vehicleId: van05.id, driverId: alex.id, cargoKg: 10, plannedKm: 5, revenue: 0 } });
    await dispatchTrip(t.id);
  }, "cannot be dispatched");
  await closeMaintenance(mnt.id);
  ok("BR-10: vehicle AVAILABLE after closing", (await prisma.vehicle.findUniqueOrThrow({ where: { id: van05.id } })).status === "AVAILABLE");
  await expectDomainError("ON_TRIP vehicle cannot enter maintenance", async () => {
    const t = await createTrip({ source: "A", destination: "B", vehicleId: van05.id, driverId: alex.id, cargoKg: 10, plannedKm: 5, revenue: 0 });
    await dispatchTrip(t.id);
    try {
      await createMaintenance({ vehicleId: van05.id, type: "Oil Change", cost: 1 });
    } finally {
      await cancelTrip(t.id);
    }
  }, "active trip");

  console.log("\nRBAC write matrix");
  const analyst = { userId: "x", name: "FA", email: "fa@x", role: "FINANCIAL_ANALYST" as const };
  const dispatcher = { userId: "y", name: "D", email: "d@x", role: "DRIVER" as const };
  try { requireWrite(analyst, "vehicles"); ok("analyst blocked from vehicles", false); } catch { ok("analyst blocked from vehicles write", true); }
  try { requireWrite(dispatcher, "drivers"); ok("dispatcher blocked from drivers", false); } catch { ok("dispatcher blocked from drivers write", true); }
  try { requireWrite(analyst, "expenses"); ok("analyst allowed on expenses write", true); } catch { ok("analyst allowed on expenses", false); }
  try { requireWrite(dispatcher, "trips"); ok("dispatcher allowed on trips write", true); } catch { ok("dispatcher allowed on trips", false); }

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
