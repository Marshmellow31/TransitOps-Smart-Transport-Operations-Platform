"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import { ROLE_LABELS, type Role } from "@/lib/constants";

/* ─── Hand-drawn SVG icons ─── */
const icons: Record<string, React.ReactNode> = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="8" rx="2"/><rect x="11" y="2" width="7" height="5" rx="2"/><rect x="2" y="12" width="7" height="6" rx="2"/><rect x="11" y="9" width="7" height="9" rx="2"/>
    </svg>
  ),
  vehicles: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 11V8a2 2 0 012-4h8l2.5 4H17a1 1 0 011 1v2"/><circle cx="5.5" cy="13" r="2"/><circle cx="14.5" cy="13" r="2"/><path d="M7.5 13h5"/>
    </svg>
  ),
  drivers: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3.5"/><path d="M3 17.5c0-3.5 3.1-6 7-6s7 2.5 7 6"/>
    </svg>
  ),
  trips: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10c0-4 3.5-7 7-7s7 3 7 7-3.5 7-7 7"/><circle cx="5" cy="15" r="1.5" fill="currentColor" opacity="0.3"/><path d="M10 6v4l2.5 2.5"/>
    </svg>
  ),
  maintenance: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 3.5L11 7l1 2-2 1-3.5 3.5a2.12 2.12 0 003 3L13 13l1-2 2 1 3.5-3.5c.5-2-0.5-4-2.5-5z"/><path d="M3 17l3-3"/>
    </svg>
  ),
  expenses: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2v16"/><path d="M6 6h6a2 2 0 110 4H6"/><path d="M6 10h7a2 2 0 110 4H6"/>
    </svg>
  ),
  reports: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17V7l4 4 3-6 4 3 3-5"/><path d="M3 17h14"/>
    </svg>
  ),
};

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/vehicles", label: "Vehicles", icon: "vehicles" },
  { href: "/drivers", label: "Drivers", icon: "drivers" },
  { href: "/trips", label: "Trips", icon: "trips" },
  { href: "/maintenance", label: "Maintenance", icon: "maintenance" },
  { href: "/expenses", label: "Fuel & Expenses", icon: "expenses" },
  { href: "/reports", label: "Reports", icon: "reports" },
];

export function Sidebar({ name, role }: { name: string; role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 lg:hidden bg-white dark:bg-[#12151d] border border-zinc-200 dark:border-[#20263a] rounded-xl p-2.5 shadow-md transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l14 14M16 2L2 16"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 4h14M2 9h14M2 14h14"/></svg>
        )}
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden animate-fade-in" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 w-64 flex flex-col bg-white dark:bg-[#0d1017] border-r border-zinc-200/80 dark:border-[#1c2130] transition-transform duration-300 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-100 dark:border-[#1c2130]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-md shadow-indigo-600/20">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="16" height="9" rx="2"/><path d="M5 15v1.5M15 15v1.5M5 6V4.5a1.5 1.5 0 013 0V6M12 6V4.5a1.5 1.5 0 013 0V6"/><path d="M6 10h2M12 10h2"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm tracking-tight">TransitOps</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">Smart Transport</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Navigation</p>
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium mb-0.5 transition-all duration-150 relative
                  ${active
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-[#161b26] hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
                <span className={`transition-colors ${active ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"}`}>
                  {icons[n.icon]}
                </span>
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-zinc-100 dark:border-[#1c2130] px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/60 dark:to-indigo-800/40 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-300">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{ROLE_LABELS[role]}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 text-left text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/15 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6"/>
              </svg>
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
