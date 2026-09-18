import { NextResponse } from "next/server";

import { verifyEmailAction } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

/**
 * Email links hit `/verify-email?token=`, which redirects here.
 * Cookie writes are illegal during RSC render — same reason as
 * `/api/auth/clear-session`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  const result = token
    ? await verifyEmailAction(token)
    : ({ status: "error", code: "invalid" } as const);

  if (result.status === "ok") {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const failed = new URL("/verify-email", request.url);
  failed.searchParams.set("error", result.code);
  return NextResponse.redirect(failed, 303);
}
