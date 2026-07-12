import { prisma } from "../src/lib/db";
async function main() {
  const v = await prisma.vehicle.findUnique({ where: { regNo: "DL-01-EF-3002" } });
  const d = await prisma.driver.findUnique({ where: { licenseNo: "DL-2019-0012345" } });
  const t = await prisma.trip.findFirst({ where: { source: "Delhi", destination: "Jaipur" }, include: { fuelLogs: true } });
  console.log("Mini-02:", v?.status, v?.odometerKm, "km");
  console.log("Alex:", d?.status);
  console.log("Trip:", t?.status, "actualKm:", t?.actualKm, "fuelLogs:", t?.fuelLogs.length, t?.fuelLogs[0]?.liters + "L", "₹" + t?.fuelLogs[0]?.cost);
}
main().finally(() => prisma.$disconnect());
