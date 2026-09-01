/**
 * Admin endpoint: assign a planned mentor session to a student.
 *
 * Requires `Authorization: Bearer <ADMIN_API_KEY>`.
 * Body: `{ "userId": number, "themeId": number }`
 */
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthorizedAdminRequest } from "@/modules/admin/auth";
import {
  createMentorSession,
  CreateMentorSessionError,
  validateCreateMentorSessionInput,
} from "@/modules/sessions/createMentorSession";

const UNAUTHORIZED_ERROR = "Unauthorized.";
const GENERIC_SERVER_ERROR = "Internal server error.";

type RouteDeps = {
  createMentorSession: typeof createMentorSession;
};

export async function POST(
  request: NextRequest,
  _context?: unknown,
  deps: RouteDeps = { createMentorSession },
) {
  if (!isAuthorizedAdminRequest(request.headers.get("authorization"))) {
    return NextResponse.json(
      { ok: false, errors: [UNAUTHORIZED_ERROR] },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: ["Request body must be valid JSON."] },
      { status: 400 },
    );
  }

  try {
    const input = validateCreateMentorSessionInput(body);
    const result = await deps.createMentorSession(input);
    try {
      revalidatePath("/sessions");
    } catch {
      // No-op outside a Next.js request context (unit tests).
    }
    return NextResponse.json(
      {
        ok: true,
        sessionId: result.sessionId,
        created: result.created,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof CreateMentorSessionError) {
      switch (error.code) {
        case "invalid_input":
          return NextResponse.json(
            { ok: false, errors: [error.message] },
            { status: 400 },
          );
        case "theme_not_found":
          return NextResponse.json(
            { ok: false, errors: [error.message] },
            { status: 404 },
          );
        default:
          return NextResponse.json(
            { ok: false, errors: [GENERIC_SERVER_ERROR] },
            { status: 500 },
          );
      }
    }
    console.error("POST /api/admin/sessions: unexpected error", error);
    return NextResponse.json(
      { ok: false, errors: [GENERIC_SERVER_ERROR] },
      { status: 500 },
    );
  }
}
