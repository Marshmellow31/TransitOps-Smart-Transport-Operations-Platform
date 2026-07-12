"use client";
import { ButtonHTMLAttributes, ReactNode } from "react";

const VARIANTS = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow",
  ghost: "bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300",
  outline: "border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow",
};
const SIZES = {
  sm: "text-xs px-2.5 py-1.5 rounded",
  md: "text-sm px-3.5 py-2 rounded-md",
  lg: "text-base px-5 py-2.5 rounded-lg",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  children: ReactNode;
  loading?: boolean;
};

export function Button({ variant = "primary", size = "md", children, loading, className = "", ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
