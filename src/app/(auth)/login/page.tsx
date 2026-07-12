"use client";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

const DEMO = [
  { role: "Fleet Manager", email: "fleet@transitops.io" },
  { role: "Dispatcher", email: "driver@transitops.io" },
  { role: "Safety Officer", email: "safety@transitops.io" },
  { role: "Finance", email: "finance@transitops.io" },
];

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#d9dde6] dark:bg-[#0a0c12] p-4 sm:p-8">
      <div className="w-full max-w-[1040px] rounded-3xl overflow-hidden shadow-[0_30px_80px_-30px_rgba(20,22,40,.45)] grid lg:grid-cols-[1.05fr_.95fr] bg-white dark:bg-[#12151d] animate-slide-up">

        {/* ── Brand panel ── */}
        <div className="relative hidden lg:flex flex-col justify-between p-11 text-white overflow-hidden bg-[linear-gradient(150deg,#3f32d6_0%,#4f46e5_42%,#7c5cf6_100%)]">
          {/* radial glows */}
          <div className="absolute w-[520px] h-[520px] -right-48 -top-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.18),rgba(255,255,255,0)_70%)]" />
          <div className="absolute w-[340px] h-[340px] -left-28 -bottom-36 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,.10),rgba(255,255,255,0)_70%)]" />

          {/* logo */}
          <div className="relative flex items-center gap-3">
            <div className="w-[42px] h-[42px] rounded-xl bg-white/15 backdrop-blur border border-white/25 grid place-items-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17V7a2 2 0 0 1 2-2h9v12M14 9h4l3 4v4h-7"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/></svg>
            </div>
            <span className="font-display font-bold text-xl">TransitOps</span>
          </div>

          {/* headline + stats */}
          <div className="relative">
            <p className="font-display font-semibold text-[34px] leading-[1.12] mb-4 [text-wrap:balance]">
              Run the whole fleet from one calm control room.
            </p>
            <p className="text-[15px] leading-relaxed text-white/80 max-w-[380px]">
              Vehicles, drivers, dispatch, maintenance and spend — with every rule enforced the moment you act.
            </p>
            <div className="flex gap-5 mt-8">
              <div>
                <p className="font-display font-bold text-2xl tabular-nums">7</p>
                <p className="text-xs mt-0.5 text-white/70">Active vehicles</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="font-display font-bold text-2xl tabular-nums">33/33</p>
                <p className="text-xs mt-0.5 text-white/70">Rules verified</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="font-display font-bold text-2xl tabular-nums">4</p>
                <p className="text-xs mt-0.5 text-white/70">Roles</p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-white/60">© 2026 TransitOps · Smart Transport Operations</p>
        </div>

        {/* ── Form panel ── */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          {/* mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[linear-gradient(135deg,#4f46e5,#7c5cf6)] grid place-items-center shadow-lg shadow-indigo-600/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17V7a2 2 0 0 1 2-2h9v12M14 9h4l3 4v4h-7"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/></svg>
            </div>
            <span className="font-display font-bold text-lg text-[#14161e] dark:text-[#e8eaf0]">TransitOps</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-[#14161e] dark:text-[#e8eaf0] mb-1.5">Welcome back</h2>
          <p className="text-sm text-[#6b7280] dark:text-[#98a0b0] mb-7">Sign in to your operations console.</p>

          <ErrorBanner message={state?.error} />

          <form action={formAction} className="flex flex-col mt-2">
            <label className="text-[13px] font-semibold text-[#3d4351] dark:text-[#c6ccd8] mb-1.5">Email address</label>
            <div className="relative mb-4">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa1ac]" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>
              <input
                name="email" type="email" required autoComplete="email" placeholder="you@company.com"
                className="w-full py-3 pl-[42px] pr-3.5 rounded-[11px] border-[1.5px] border-[#e2e5ec] dark:border-[#20263a] bg-[#fbfbfd] dark:bg-[#161b26] text-sm text-[#14161e] dark:text-[#e8eaf0] placeholder-[#9aa1ac] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
            <label className="text-[13px] font-semibold text-[#3d4351] dark:text-[#c6ccd8] mb-1.5">Password</label>
            <div className="relative mb-6">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa1ac]" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <input
                name="password" type="password" required autoComplete="current-password" placeholder="••••••••"
                className="w-full py-3 pl-[42px] pr-3.5 rounded-[11px] border-[1.5px] border-[#e2e5ec] dark:border-[#20263a] bg-[#fbfbfd] dark:bg-[#161b26] text-sm text-[#14161e] dark:text-[#e8eaf0] placeholder-[#9aa1ac] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
            <button
              type="submit" disabled={pending}
              className="w-full py-3.5 rounded-[11px] bg-[linear-gradient(135deg,#4f46e5,#6d5cf6)] text-white text-[15px] font-semibold shadow-[0_8px_20px_-6px_rgba(79,70,229,.55)] hover:brightness-[1.06] active:scale-[0.99] transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {pending ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              ) : (
                <>
                  Sign in
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6"/></svg>
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-7 border border-[#eceef3] dark:border-[#20263a] rounded-[13px] overflow-hidden">
            <div className="px-3.5 py-2.5 bg-[#f7f8fb] dark:bg-[#161b26] text-[11px] font-bold tracking-[.06em] uppercase text-[#8b93a4]">
              Demo accounts · password = role + 123
            </div>
            <div className="grid grid-cols-2">
              {DEMO.map((d, i) => (
                <div key={d.email} className={`px-3.5 py-2.5 border-t border-[#f0f1f5] dark:border-[#1c2130] ${i % 2 === 1 ? "border-l" : ""}`}>
                  <p className="text-xs font-semibold text-[#3d4351] dark:text-[#c6ccd8]">{d.role}</p>
                  <p className="text-[11.5px] font-mono text-[#6b7280] dark:text-[#98a0b0] mt-px">{d.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
