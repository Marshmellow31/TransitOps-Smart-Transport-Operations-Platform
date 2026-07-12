"use client";
import { STATUS_BADGE, STATUS_LABELS } from "@/lib/constants";

export function Badge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "bg-zinc-200 text-zinc-600";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ring-current/10 ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
