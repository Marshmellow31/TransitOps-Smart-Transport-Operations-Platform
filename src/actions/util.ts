import "server-only";
import { getSession, type Session } from "@/lib/auth";
import { requireWrite, type Module } from "@/lib/rbac";
import { DomainError } from "@/lib/errors";

/** Auth + RBAC gate for server actions (throws DomainError instead of redirecting). */
export async function authz(module: Module): Promise<Session> {
  const session = await getSession();
  if (!session) throw new DomainError("Your session has expired — please sign in again.");
  requireWrite(session, module);
  return session;
}

export const field = (fd: FormData, name: string) => (fd.get(name) ?? "").toString();
