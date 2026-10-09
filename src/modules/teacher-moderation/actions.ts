"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/modules/auth/getCurrentUser";
import { canManageProfiles } from "@/modules/auth/types";

import { approveTeacherApplication, rejectTeacherApplication } from "./store";
import { TeacherModerationError } from "./types";

export type TeacherModerationActionState =
  | { status: "idle" }
  | { status: "ok" }
  | {
      status: "error";
      code:
        | "forbidden"
        | "invalid_input"
        | "not_found"
        | "invalid_status"
        | "invalid_rejection_reason"
        | "server_error";
    };

async function requireAdmin(): Promise<
  | { ok: true; userId: number }
  | {
      ok: false;
      state: TeacherModerationActionState;
    }
> {
  const user = await requireUser();

  if (!canManageProfiles(user.role)) {
    return {
      ok: false,
      state: {
        status: "error",
        code: "forbidden",
      },
    };
  }

  return {
    ok: true,
    userId: user.id,
  };
}

export async function approveTeacherApplicationAction(
  _prev: TeacherModerationActionState,
  formData: FormData,
): Promise<TeacherModerationActionState> {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.state;
  }

  const teacherUserId = Number(formData.get("teacherUserId"));

  if (!Number.isInteger(teacherUserId) || teacherUserId <= 0) {
    return {
      status: "error",
      code: "invalid_input",
    };
  }

  try {
    await approveTeacherApplication({
      reviewerUserId: admin.userId,
      teacherUserId,
    });

    revalidatePath("/");
    revalidatePath("/account");
    revalidatePath("/profiles");

    return { status: "ok" };
  } catch (error) {
    if (error instanceof TeacherModerationError) {
      if (
        error.code === "invalid_input" ||
        error.code === "not_found" ||
        error.code === "invalid_status"
      ) {
        return {
          status: "error",
          code: error.code,
        };
      }
    }

    console.error("approveTeacherApplicationAction failed", error);

    return {
      status: "error",
      code: "server_error",
    };
  }
}

export async function rejectTeacherApplicationAction(
  _prev: TeacherModerationActionState,
  formData: FormData,
): Promise<TeacherModerationActionState> {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.state;
  }

  const teacherUserId = Number(formData.get("teacherUserId"));
  const rejectionReason = String(formData.get("rejectionReason") ?? "");

  if (!Number.isInteger(teacherUserId) || teacherUserId <= 0) {
    return {
      status: "error",
      code: "invalid_input",
    };
  }

  try {
    await rejectTeacherApplication({
      reviewerUserId: admin.userId,
      teacherUserId,
      rejectionReason,
    });

    revalidatePath("/");
    revalidatePath("/account");
    revalidatePath("/profiles");

    return { status: "ok" };
  } catch (error) {
    if (error instanceof TeacherModerationError) {
      if (
        error.code === "invalid_input" ||
        error.code === "not_found" ||
        error.code === "invalid_status" ||
        error.code === "invalid_rejection_reason"
      ) {
        return {
          status: "error",
          code: error.code,
        };
      }
    }

    console.error("rejectTeacherApplicationAction failed", error);

    return {
      status: "error",
      code: "server_error",
    };
  }
}
