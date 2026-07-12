"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { dispatchTripAction, cancelTripAction } from "@/actions/trips";
import { CompleteTripModal } from "./CompleteTripModal";

type T = { id: string; status: string };

export function TripActions({ trip }: { trip: T }) {
  const [error, setError] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const router = useRouter();

  const run = async (fn: () => Promise<{ ok: boolean; error?: string } | null>) => {
    setError(null);
    const r = await fn();
    if (r && !r.ok) setError(r.error ?? "Error");
    else router.refresh();
  };

  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") return null;

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {error && <span className="text-xs text-red-500 max-w-32">{error}</span>}
        {trip.status === "DRAFT" && (
          <button
            onClick={() => run(() => dispatchTripAction(trip.id))}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md"
          >
            Dispatch
          </button>
        )}
        {trip.status === "DISPATCHED" && (
          <button
            onClick={() => setShowComplete(true)}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded-md"
          >
            Complete
          </button>
        )}
        <button
          onClick={() => { if (confirm("Cancel this trip?")) run(() => cancelTripAction(trip.id)); }}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
        >
          Cancel
        </button>
      </div>
      {showComplete && (
        <CompleteTripModal
          tripId={trip.id}
          onClose={() => { setShowComplete(false); router.refresh(); }}
        />
      )}
    </>
  );
}
