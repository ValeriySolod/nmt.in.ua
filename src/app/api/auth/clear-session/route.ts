import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/modules/auth/getCurrentUser";

/**
 * Clears `nmt_session` then sends the browser to `/login`.
 * Cookie writes are not allowed during Server Component render (App layout),
 * so banned / missing accounts redirect here instead of calling
 * `clearSessionCookie` inline.
 */
export async function GET(request: Request) {
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", request.url));
}
