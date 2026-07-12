import { requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import type { Role } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <div className="min-h-screen bg-[#eef0f4] dark:bg-[#0a0c12]">
      <Sidebar name={session.name} role={session.role as Role} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0b0e14]/80 backdrop-blur-lg border-b border-[#e9ebf1] dark:border-[#1c2130] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="w-8 lg:hidden shrink-0" /> {/* spacer for hamburger */}
          {/* Search hint (visual affordance, per design) */}
          <div className="hidden md:flex items-center gap-2.5 w-[340px] px-3 py-2 rounded-[10px] bg-[#f5f6f9] dark:bg-[#12151d] border border-[#e9ebf1] dark:border-[#1c2130] text-[#9aa1ac] dark:text-[#69707e] text-[13px] select-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg>
            <span>Search vehicles, drivers, trips…</span>
            <span className="ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[#e9ebf1] dark:bg-[#1c2130] text-[#6b7280] dark:text-[#98a0b0]">⌘K</span>
          </div>
          <div className="flex items-center gap-3.5 shrink-0">
            <p className="text-[12.5px] text-[#6b7280] dark:text-[#98a0b0] hidden sm:block">
              Signed in as <span className="font-semibold text-[#14161e] dark:text-[#e8eaf0]">{session.name}</span>
            </p>
            <DarkModeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
