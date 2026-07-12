import { requireSession } from "@/lib/auth";
import { getVehicleReport } from "@/lib/analytics";

export async function GET() {
  await requireSession();
  const rows = await getVehicleReport();

  const headers = [
    "Reg No", "Name", "Type", "Status",
    "Distance (km)", "Fuel (L)", "Fuel Cost (₹)", "Maintenance Cost (₹)",
    "Other Expenses (₹)", "Operational Cost (₹)", "Revenue (₹)",
    "Fuel Efficiency (km/L)", "ROI (%)",
  ];

  const csvRows = rows.map(r => [
    r.regNo, r.name, r.type, r.status,
    r.distanceKm, r.fuelLiters, r.fuelCost, r.maintenanceCost,
    r.otherExpenses, r.operationalCost, r.revenue,
    r.fuelEfficiencyKmPerL ?? "", r.roiPct ?? "",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = [headers.join(","), ...csvRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transitops-report-${new Date().toISOString().slice(0,10)}.csv"`,
    },
  });
}
