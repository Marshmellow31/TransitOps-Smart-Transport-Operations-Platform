"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/vehicles", label: "Vehicles", icon: "🚛" },
  { href: "/drivers", label: "Drivers", icon: "🧑‍✈️" },
  { href: "/trips", label: "Trips", icon: "🗺️" },
  { href: "/maintenance", label: "Maintenance", icon: "🔧" },
  { href: "/expenses", label: "Fuel & Expenses", icon: "⛽" },
  { href: "/reports", label: "Reports", icon: "📈" },
];

export function Sidebar({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 shadow"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <span className="text-lg">{open ? "✕" : "☰"}</span>
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-2xl">🚌</span>
          <div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">TransitOps</p>
            <p className="text-xs text-zinc-400">Smart Transport</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-colors
                  ${active
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
              >
                <span>{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
            <p className="text-xs text-zinc-400">{ROLE_LABELS[role]}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left text-sm text-red-600 dark:text-red-400 hover:text-red-700 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
