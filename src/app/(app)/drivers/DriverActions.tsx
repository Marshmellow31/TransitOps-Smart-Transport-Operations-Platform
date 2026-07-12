"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setDriverStatusAction } from "@/actions/drivers";

type D = { id: string; name: string; status: string };

export function DriverActions({ driver }: { driver: D }) {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const run = async (status: string) => {
    setError(null);
    const r = await setDriverStatusAction(driver.id, status);
    if (r && !r.ok) setError(r.error ?? "Error");
    else router.refresh();
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {error && <span className="text-xs text-red-500 mr-1">{error}</span>}
      <Link href={`/drivers/${driver.id}/edit`} className="text-xs text-indigo-600 hover:underline px-1.5 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20">Edit</Link>
      {driver.status !== "ON_TRIP" && (
        <>
          {driver.status !== "AVAILABLE" && (
            <button onClick={() => run("AVAILABLE")} className="text-xs text-emerald-600 hover:underline px-1.5 py-1 rounded hover:bg-emerald-50">Available</button>
          )}
          {driver.status !== "OFF_DUTY" && (
            <button onClick={() => run("OFF_DUTY")} className="text-xs text-zinc-500 hover:underline px-1.5 py-1 rounded hover:bg-zinc-50">Off Duty</button>
          )}
          {driver.status !== "SUSPENDED" && (
            <button onClick={() => run("SUSPENDED")} className="text-xs text-red-500 hover:underline px-1.5 py-1 rounded hover:bg-red-50">Suspend</button>
          )}
        </>
      )}
    </div>
  );
}
