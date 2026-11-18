"use server";

import { getSessionUser, type SessionUser } from "./auth.server";

/** Get the current session user. Safe to call from client components (runs on the server). */
export async function $getSessionUser(): Promise<SessionUser | null> {
  return getSessionUser();
}
