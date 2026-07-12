"use client";
import { STATUS_BADGE, STATUS_LABELS } from "@/lib/constants";

export function Badge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "bg-zinc-200 text-zinc-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
