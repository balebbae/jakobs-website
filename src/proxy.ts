import { NextResponse, type NextRequest } from "next/server";
import { OWNER_COOKIE, OWNER_MAX_AGE, isOwnerId } from "@/lib/owner";

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(OWNER_COOKIE)?.value;
  const id = isOwnerId(existing) ? existing : crypto.randomUUID();
  // Make a fresh ID visible to this same request so the first page load can already read saves.
  if (id !== existing) request.cookies.set(OWNER_COOKIE, id);
  const response = NextResponse.next({ request });
  // Re-set on every visit so the cookie keeps sliding forward.
  response.cookies.set(OWNER_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env["NODE_ENV"] === "production", path: "/", maxAge: OWNER_MAX_AGE });
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|assets/|favicon.ico|robots.txt).*)"] };
