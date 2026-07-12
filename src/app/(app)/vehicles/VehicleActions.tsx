"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { retireVehicleAction, reactivateVehicleAction, deleteVehicleAction } from "@/actions/vehicles";

type V = { id: string; name: string; status: string };

export function VehicleActions({ vehicle }: { vehicle: V }) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = async (fn: () => Promise<{ ok: boolean; error?: string } | null>) => {
    setError(null);
    const r = await fn();
    if (r && !r.ok) setError(r.error ?? "Error");
    else router.refresh();
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {error && <span className="text-xs text-red-500 mr-1">{error}</span>}
      <Link href={`/vehicles/${vehicle.id}/edit`} className="text-xs text-indigo-600 hover:underline px-1.5 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Edit</Link>
      {vehicle.status === "RETIRED" ? (
        <button onClick={() => run(() => reactivateVehicleAction(vehicle.id))} className="text-xs text-emerald-600 hover:underline px-1.5 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20">Reactivate</button>
      ) : vehicle.status === "AVAILABLE" ? (
        <button onClick={() => run(() => retireVehicleAction(vehicle.id))} className="text-xs text-amber-600 hover:underline px-1.5 py-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20">Retire</button>
      ) : null}
      {vehicle.status === "AVAILABLE" && (
        <button
          onClick={() => { if (confirm(`Delete ${vehicle.name}? This cannot be undone.`)) run(() => deleteVehicleAction(vehicle.id)); }}
          className="text-xs text-red-500 hover:underline px-1.5 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
        >Delete</button>
      )}
    </div>
  );
}
