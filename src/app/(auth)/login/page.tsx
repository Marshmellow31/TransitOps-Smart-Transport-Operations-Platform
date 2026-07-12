"use client";
import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input, FormField } from "@/components/ui/FormField";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚌</div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">TransitOps</h1>
          <p className="text-zinc-500 text-sm mt-1">Smart Transport Operations Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-8">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-6">Sign in to your account</h2>

          <ErrorBanner message={state?.error} />

          <form action={formAction} className="flex flex-col gap-4 mt-4">
            <FormField label="Email address">
              <Input name="email" type="email" placeholder="you@company.com" autoComplete="email" required />
            </FormField>
            <FormField label="Password">
              <Input name="password" type="password" placeholder="••••••••" autoComplete="current-password" required />
            </FormField>
            <Button type="submit" size="lg" loading={pending} className="w-full justify-center mt-2">
              Sign in
            </Button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 text-xs text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
          <p className="font-semibold mb-2">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-y-1">
            <span>Fleet Manager</span><span className="font-mono">fleet@transitops.io</span>
            <span>Dispatcher</span><span className="font-mono">driver@transitops.io</span>
            <span>Safety Officer</span><span className="font-mono">safety@transitops.io</span>
            <span>Finance</span><span className="font-mono">finance@transitops.io</span>
          </div>
          <p className="mt-1.5 text-indigo-600 dark:text-indigo-400">Password: role + 123 (e.g. fleet123)</p>
        </div>
      </div>
    </div>
  );
}
