"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { DomainError } from "@/lib/errors";

export type AuthState = { error: string } | null;

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get("email") ?? "").toString();
  const password = (formData.get("password") ?? "").toString();
  try {
    await login(email, password);
  } catch (e) {
    if (e instanceof DomainError) return { error: e.message };
    console.error(e);
    return { error: "Sign-in failed. Please try again." };
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
