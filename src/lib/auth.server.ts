import "server-only";
import { cookies } from "next/headers";
import { OWNER_COOKIE, isOwnerId } from "@/lib/owner";

export type SessionUser = { userId: string; displayName: string | null; email: string | null };

/** Returns the owner of the current request, or null when the browser has no owner cookie. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const id = (await cookies()).get(OWNER_COOKIE)?.value;
  return isOwnerId(id) ? { userId: id, displayName: null, email: null } : null;
}

export async function requireOwner() {
  const user = await getSessionUser();
  if (!user) throw new Error("Your session is needed to access saves.");
  return user.userId;
}
