import "server-only";
import { prisma } from "./db";
import { DomainError } from "./errors";
import { STATUS_LABELS } from "./constants";

/**
 * TransitOps rule engine. Every mandatory business rule (SRS §4, BR-1..BR-10)
 * is enforced here, server-side, inside transactions. UI-level filtering is a
 * convenience; this file is the authority.
 */

// ---------- helpers ----------

function num(v: unknown, field: string, opts: { min?: number; positive?: boolean } = {}): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  if (typeof n !== "number" || !isFinite(n)) throw new DomainError(`${field} must be a number.`);
  if (opts.positive && n <= 0) throw new DomainError(`${field} must be greater than zero.`);
  if (opts.min !== undefined && n < opts.min) throw new DomainError(`${field} must be at least ${opts.min}.`);
  return n;
}

function str(v: unknown, field: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) throw new DomainError(`${field} is required.`);
  return s;
}

export function licenseExpired(expiry: Date | string): boolean {
  return new Date(expiry).getTime() < Date.now();
}

// ---------- Vehicles ----------

export type VehicleInput = {
  regNo: string;
  name: string;
  type: string;
  maxLoadKg: number | string;
  odometerKm: number | string;
  acquisitionCost: number | string;
  region: string;
};

export async function createVehicle(input: VehicleInput) {
  const regNo = str(input.regNo, "Registration number").toUpperCase();
  // BR-1: registration number unique
  const dup = await prisma.vehicle.findUnique({ where: { regNo } });
  if (dup) throw new DomainError(`Registration number ${regNo} already exists (${dup.name}).`);
  return prisma.vehicle.create({
    data: {
      regNo,
      name: str(input.name, "Vehicle name"),
      type: str(input.type, "Vehicle type"),
      maxLoadKg: num(input.maxLoadKg, "Max load capacity", { positive: true }),
      odometerKm: num(input.odometerKm, "Odometer", { min: 0 }),
      acquisitionCost: num(input.acquisitionCost, "Acquisition cost", { min: 0 }),
      region: str(input.region, "Region"),
    },
  });
}

export async function updateVehicle(id: string, input: VehicleInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new DomainError("Vehicle not found.");
  const regNo = str(input.regNo, "Registration number").toUpperCase();
  // BR-1 on edit too
  const dup = await prisma.vehicle.findFirst({ where: { regNo, NOT: { id } } });
  if (dup) throw new DomainError(`Registration number ${regNo} already exists (${dup.name}).`);
  return prisma.vehicle.update({
    where: { id },
    data: {
      regNo,
      name: str(input.name, "Vehicle name"),
      type: str(input.type, "Vehicle type"),
      maxLoadKg: num(input.maxLoadKg, "Max load capacity", { positive: true }),
      odometerKm: num(input.odometerKm, "Odometer", { min: 0 }),
      acquisitionCost: num(input.acquisitionCost, "Acquisition cost", { min: 0 }),
      region: str(input.region, "Region"),
    },
  });
}

export async function retireVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new DomainError("Vehicle not found.");
  if (vehicle.status === "ON_TRIP")
    throw new DomainError(`${vehicle.name} is on an active trip — complete or cancel the trip before retiring it.`);
  return prisma.vehicle.update({ where: { id }, data: { status: "RETIRED" } });
}

export async function reactivateVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new DomainError("Vehicle not found.");
  if (vehicle.status !== "RETIRED") throw new DomainError("Only retired vehicles can be reactivated.");
  const openMnt = await prisma.maintenanceLog.count({ where: { vehicleId: id, status: "OPEN" } });
  return prisma.vehicle.update({ where: { id }, data: { status: openMnt > 0 ? "IN_SHOP" : "AVAILABLE" } });
}

export async function deleteVehicle(id: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: { trips: true } });
  if (!vehicle) throw new DomainError("Vehicle not found.");
  if (vehicle.trips.length > 0)
    throw new DomainError(`${vehicle.name} has trip history — retire it instead of deleting.`);
  await prisma.$transaction([
    prisma.fuelLog.deleteMany({ where: { vehicleId: id } }),
    prisma.expense.deleteMany({ where: { vehicleId: id } }),
    prisma.maintenanceLog.deleteMany({ where: { vehicleId: id } }),
    prisma.vehicle.delete({ where: { id } }),
  ]);
}

// ---------- Drivers ----------

export type DriverInput = {
  name: string;
  licenseNo: string;
  licenseCategory: string;
  licenseExpiry: string;
  phone: string;
  safetyScore: number | string;
};

function driverData(input: DriverInput) {
  const expiry = new Date(str(input.licenseExpiry, "License expiry date"));
  if (isNaN(expiry.getTime())) throw new DomainError("License expiry date is invalid.");
  const score = num(input.safetyScore, "Safety score", { min: 0 });
  if (score > 100) throw new DomainError("Safety score must be between 0 and 100.");
  return {
    name: str(input.name, "Driver name"),
    licenseNo: str(input.licenseNo, "License number").toUpperCase(),
    licenseCategory: str(input.licenseCategory, "License category"),
    licenseExpiry: expiry,
    phone: str(input.phone, "Contact number"),
    safetyScore: score,
  };
}

export async function createDriver(input: DriverInput) {
  const data = driverData(input);
  const dup = await prisma.driver.findUnique({ where: { licenseNo: data.licenseNo } });
  if (dup) throw new DomainError(`License number ${data.licenseNo} is already registered to ${dup.name}.`);
  return prisma.driver.create({ data });
}

export async function updateDriver(id: string, input: DriverInput) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new DomainError("Driver not found.");
  const data = driverData(input);
  const dup = await prisma.driver.findFirst({ where: { licenseNo: data.licenseNo, NOT: { id } } });
  if (dup) throw new DomainError(`License number ${data.licenseNo} is already registered to ${dup.name}.`);
  return prisma.driver.update({ where: { id }, data });
}

/** Safety Officer duty-status control. ON_TRIP is system-managed and never settable here. */
export async function setDriverStatus(id: string, status: "AVAILABLE" | "OFF_DUTY" | "SUSPENDED") {
  if (!["AVAILABLE", "OFF_DUTY", "SUSPENDED"].includes(status))
    throw new DomainError("Invalid driver status.");
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new DomainError("Driver not found.");
  if (driver.status === "ON_TRIP")
    throw new DomainError(`${driver.name} is on an active trip — complete or cancel the trip first.`);
  return prisma.driver.update({ where: { id }, data: { status } });
}

// ---------- Trip eligibility (shared by create + dispatch) ----------

async function assertTripEligibility(
  tx: Pick<typeof prisma, "vehicle" | "driver">,
  vehicleId: string,
  driverId: string,
  cargoKg: number,
  opts: { allowVehicleStatus?: string[]; allowDriverStatus?: string[] } = {}
) {
  const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new DomainError("Selected vehicle no longer exists.");
  const okVehicle = opts.allowVehicleStatus ?? ["AVAILABLE"];
  // BR-2 (Retired/In Shop excluded) + BR-4 (On Trip excluded): only AVAILABLE passes
  if (!okVehicle.includes(vehicle.status))
    throw new DomainError(
      `${vehicle.name} is ${STATUS_LABELS[vehicle.status] ?? vehicle.status} and cannot be dispatched.`
    );
  // BR-5: cargo within capacity
  if (cargoKg > vehicle.maxLoadKg)
    throw new DomainError(
      `Cargo ${cargoKg} kg exceeds ${vehicle.name}'s maximum load capacity of ${vehicle.maxLoadKg} kg.`
    );

  const driver = await tx.driver.findUnique({ where: { id: driverId } });
  if (!driver) throw new DomainError("Selected driver no longer exists.");
  const okDriver = opts.allowDriverStatus ?? ["AVAILABLE"];
  // BR-3 (Suspended) + BR-4 (On Trip) + Off Duty: only AVAILABLE passes
  if (!okDriver.includes(driver.status))
    throw new DomainError(
      `${driver.name} is ${STATUS_LABELS[driver.status] ?? driver.status} and cannot be assigned.`
    );
  // BR-3: license must be valid
  if (licenseExpired(driver.licenseExpiry))
    throw new DomainError(
      `${driver.name}'s license expired on ${new Date(driver.licenseExpiry).toLocaleDateString("en-IN")} and they cannot be assigned to trips.`
    );

  return { vehicle, driver };
}

// ---------- Trips ----------

export type TripInput = {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoKg: number | string;
  plannedKm: number | string;
  revenue: number | string;
};

export async function createTrip(input: TripInput) {
  const cargoKg = num(input.cargoKg, "Cargo weight", { positive: true });
  const data = {
    source: str(input.source, "Source"),
    destination: str(input.destination, "Destination"),
    vehicleId: str(input.vehicleId, "Vehicle"),
    driverId: str(input.driverId, "Driver"),
    cargoKg,
    plannedKm: num(input.plannedKm, "Planned distance", { positive: true }),
    revenue: num(input.revenue, "Expected revenue", { min: 0 }),
  };
  // Validate eligibility at creation (BR-2..BR-5)
  await assertTripEligibility(prisma, data.vehicleId, data.driverId, cargoKg);
  return prisma.trip.create({ data });
}

/** BR-6: dispatch re-validates everything atomically, then locks vehicle + driver. */
export async function dispatchTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new DomainError("Trip not found.");
    if (trip.status !== "DRAFT")
      throw new DomainError(`Only Draft trips can be dispatched — this trip is ${STATUS_LABELS[trip.status]}.`);

    // Re-check all rules: state may have changed since the draft was created
    const { vehicle } = await assertTripEligibility(tx, trip.vehicleId, trip.driverId, trip.cargoKg);

    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
    return tx.trip.update({
      where: { id: tripId },
      data: { status: "DISPATCHED", dispatchedAt: new Date(), startOdometer: vehicle.odometerKm },
    });
  });
}

/** BR-7: completing restores vehicle + driver, rolls the odometer forward, logs fuel. */
export async function completeTrip(
  tripId: string,
  input: { endOdometer: number | string; fuelConsumedL: number | string; fuelCost: number | string }
) {
  const endOdometer = num(input.endOdometer, "Final odometer", { min: 0 });
  const fuelConsumedL = num(input.fuelConsumedL, "Fuel consumed", { positive: true });
  const fuelCost = num(input.fuelCost, "Fuel cost", { min: 0 });

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId }, include: { vehicle: true } });
    if (!trip) throw new DomainError("Trip not found.");
    if (trip.status !== "DISPATCHED")
      throw new DomainError(`Only Dispatched trips can be completed — this trip is ${STATUS_LABELS[trip.status]}.`);
    const startOdo = trip.startOdometer ?? trip.vehicle.odometerKm;
    if (endOdometer < startOdo)
      throw new DomainError(`Final odometer (${endOdometer} km) cannot be less than the start odometer (${startOdo} km).`);

    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE", odometerKm: endOdometer },
    });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    await tx.fuelLog.create({
      data: { vehicleId: trip.vehicleId, tripId: trip.id, liters: fuelConsumedL, cost: fuelCost },
    });
    return tx.trip.update({
      where: { id: tripId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        endOdometer,
        actualKm: endOdometer - startOdo,
        fuelConsumedL,
      },
    });
  });
}

/** BR-8: cancelling a dispatched trip releases vehicle + driver. Draft trips just cancel. */
export async function cancelTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new DomainError("Trip not found.");
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED")
      throw new DomainError(`A ${STATUS_LABELS[trip.status]} trip cannot be cancelled.`);

    if (trip.status === "DISPATCHED") {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }
    return tx.trip.update({ where: { id: tripId }, data: { status: "CANCELLED" } });
  });
}

// ---------- Maintenance ----------

export type MaintenanceInput = {
  vehicleId: string;
  type: string;
  description?: string;
  cost: number | string;
};

/** BR-9: opening a maintenance record pulls the vehicle into the shop. */
export async function createMaintenance(input: MaintenanceInput) {
  return prisma.$transaction(async (tx) => {
    const vehicleId = str(input.vehicleId, "Vehicle");
    const vehicle = await tx.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new DomainError("Vehicle not found.");
    if (vehicle.status === "ON_TRIP")
      throw new DomainError(`${vehicle.name} is on an active trip — it cannot enter maintenance until the trip ends.`);

    const log = await tx.maintenanceLog.create({
      data: {
        vehicleId,
        type: str(input.type, "Maintenance type"),
        description: (input.description ?? "").trim(),
        cost: num(input.cost, "Cost", { min: 0 }),
      },
    });
    if (vehicle.status !== "RETIRED") {
      await tx.vehicle.update({ where: { id: vehicleId }, data: { status: "IN_SHOP" } });
    }
    return log;
  });
}

/** BR-10: closing maintenance releases the vehicle — unless it is retired or still has other open work. */
export async function closeMaintenance(logId: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.findUnique({ where: { id: logId }, include: { vehicle: true } });
    if (!log) throw new DomainError("Maintenance record not found.");
    if (log.status === "CLOSED") throw new DomainError("This maintenance record is already closed.");

    const closed = await tx.maintenanceLog.update({
      where: { id: logId },
      data: { status: "CLOSED", endDate: new Date() },
    });
    const otherOpen = await tx.maintenanceLog.count({
      where: { vehicleId: log.vehicleId, status: "OPEN", NOT: { id: logId } },
    });
    if (otherOpen === 0 && log.vehicle.status === "IN_SHOP") {
      await tx.vehicle.update({ where: { id: log.vehicleId }, data: { status: "AVAILABLE" } });
    }
    return closed;
  });
}

// ---------- Fuel & Expenses ----------

export async function createFuelLog(input: { vehicleId: string; liters: number | string; cost: number | string; date?: string }) {
  const vehicleId = str(input.vehicleId, "Vehicle");
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new DomainError("Vehicle not found.");
  return prisma.fuelLog.create({
    data: {
      vehicleId,
      liters: num(input.liters, "Liters", { positive: true }),
      cost: num(input.cost, "Cost", { min: 0 }),
      date: input.date ? new Date(input.date) : new Date(),
    },
  });
}

export async function createExpense(input: { vehicleId: string; category: string; amount: number | string; date?: string; note?: string }) {
  const vehicleId = str(input.vehicleId, "Vehicle");
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) throw new DomainError("Vehicle not found.");
  const category = str(input.category, "Category");
  if (!["TOLL", "REPAIR", "INSURANCE", "OTHER"].includes(category))
    throw new DomainError("Invalid expense category.");
  return prisma.expense.create({
    data: {
      vehicleId,
      category,
      amount: num(input.amount, "Amount", { positive: true }),
      date: input.date ? new Date(input.date) : new Date(),
      note: (input.note ?? "").trim(),
    },
  });
}

// ---------- Selection pools (what the trip form may show) ----------

/** BR-2/BR-4: only AVAILABLE vehicles are dispatchable. */
export async function dispatchableVehicles() {
  return prisma.vehicle.findMany({ where: { status: "AVAILABLE" }, orderBy: { name: "asc" } });
}

/** BR-3/BR-4: only AVAILABLE drivers with valid licenses are assignable. */
export async function assignableDrivers() {
  const drivers = await prisma.driver.findMany({ where: { status: "AVAILABLE" }, orderBy: { name: "asc" } });
  return drivers.filter((d) => !licenseExpired(d.licenseExpiry));
}
