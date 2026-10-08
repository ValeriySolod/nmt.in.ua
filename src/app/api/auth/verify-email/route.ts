import { NextResponse } from "next/server";

import { absoluteSiteUrl } from "@/lib/siteOrigin";
import {
  verifyEmailAction,
  type VerifyEmailActionState,
} from "@/modules/auth/actions";

export const dynamic = "force-dynamic";

type RouteDeps = {
  verifyEmail: (token: string) => Promise<VerifyEmailActionState>;
};

/**
 * Email links hit `/verify-email?token=`, which redirects here.
 * Cookie writes are illegal during RSC render — same reason as
 * `/api/auth/clear-session`.
 *
 * Success lands on the public confirm screen (session cookie is already
 * set when the account can sign in). Do not build the 303 from
 * `request.url`: the Node listener is 127.1.10.37, so the browser would
 * leave nmt.in.ua. Always use SITE_URL.
 */
export async function GET(
  request: Request,
  _context: unknown = {},
  deps: RouteDeps = { verifyEmail: verifyEmailAction },
) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  const result = token
    ? await deps.verifyEmail(token)
    : ({ status: "error", code: "invalid" } as const);

  if (result.status === "ok") {
    return NextResponse.redirect(
      absoluteSiteUrl("/verify-email?status=success"),
      303,
    );
  }

  return NextResponse.redirect(
    absoluteSiteUrl(`/verify-email?error=${encodeURIComponent(result.code)}`),
    303,
  );
}
