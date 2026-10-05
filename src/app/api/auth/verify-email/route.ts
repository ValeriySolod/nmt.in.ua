import { NextResponse } from "next/server";

import { absoluteSiteUrl } from "@/lib/siteOrigin";
import { verifyEmailAction } from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

/**
 * Email links hit `/verify-email?token=`, which redirects here.
 * Cookie writes are illegal during RSC render — same reason as
 * `/api/auth/clear-session`.
 *
 * Do not build the 303 from `request.url`: the Node listener is
 * 127.1.10.37, so the browser would leave nmt.in.ua after a successful
 * verify. Always use SITE_URL.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  const result = token
    ? await verifyEmailAction(token)
    : ({ status: "error", code: "invalid" } as const);

  if (result.status === "ok") {
    return NextResponse.redirect(absoluteSiteUrl("/"), 303);
  }

  return NextResponse.redirect(
    absoluteSiteUrl(`/verify-email?error=${encodeURIComponent(result.code)}`),
    303,
  );
}
