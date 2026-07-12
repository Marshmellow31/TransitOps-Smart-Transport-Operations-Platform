"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeMaintenanceAction } from "@/actions/maintenance";

export function MaintenanceActions({ log }: { log: { id: string; status: string } }) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (log.status === "CLOSED") return null;

  const close = async () => {
    setError(null);
    const r = await closeMaintenanceAction(log.id);
    if (r && !r.ok) setError(r.error ?? "Error");
    else router.refresh();
  };

  return (
    <div className="flex items-center gap-1.5">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <button
        onClick={() => { if (confirm("Close this maintenance record? The vehicle will be restored to Available.")) close(); }}
        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md"
      >
        Close Record
      </button>
    </div>
  );
}
