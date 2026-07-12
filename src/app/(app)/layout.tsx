import { requireSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import type { Role } from "@/lib/constants";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar name={session.name} role={session.role as Role} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between">
          <div className="w-8 lg:hidden" /> {/* spacer for hamburger */}
          <p className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
            Signed in as <span className="font-medium text-zinc-700 dark:text-zinc-300">{session.name}</span>
          </p>
          <DarkModeToggle />
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
