"use server";

import { revalidatePath } from "next/cache";
import { absoluteSiteUrl } from "@/lib/siteOrigin";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { canManageStudents } from "@/modules/auth/types";
import { inviteJoinPath } from "./codes";
import { createStudentGroup, deleteStudentGroup, renameStudentGroup } from "./groups";
import { createStudentInvite, redeemStudentInvite } from "./invites";
import { placeStudentInGroup } from "./membership";
import { TeacherStudentsError } from "./types";

export type ManageActionErrorCode =
  | "invalid_input"
  | "not_found"
  | "not_linked"
  | "not_a_student"
  | "forbidden"
  | "name_taken"
  | "group_not_found"
  | "invite_invalid"
  | "invite_expired"
  | "invite_revoked"
  | "generic";

export type GroupActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; code: ManageActionErrorCode };

export type InviteActionState =
  | { status: "idle" }
  | {
      status: "success";
      code: string;
      url: string;
      expiresAt: string;
    }
  | { status: "error"; code: ManageActionErrorCode };

export type RedeemInviteActionState =
  | { status: "idle" }
  | {
      status: "success";
      teacherName: string;
      groupName: string | null;
      already: boolean;
    }
  | { status: "error"; code: ManageActionErrorCode };

type Revalidate = (path: string) => void;

function mapError(error: TeacherStudentsError): ManageActionErrorCode {
  switch (error.code) {
    case "invalid_input":
    case "not_found":
    case "not_linked":
    case "not_a_student":
    case "forbidden":
    case "name_taken":
    case "group_not_found":
    case "invite_invalid":
    case "invite_expired":
    case "invite_revoked":
      return error.code;
    default:
      return "generic";
  }
}

function revalidateRoster(revalidate: Revalidate) {
  revalidate("/students");
  revalidate("/consultations");
  revalidate("/results");
  revalidate("/sessions");
}

export async function createStudentGroupAction(
  _prev: GroupActionState,
  formData: FormData,
  deps: {
    requireUser: typeof requireUser;
    createStudentGroup: typeof createStudentGroup;
    revalidatePath: Revalidate;
  } = { requireUser, createStudentGroup, revalidatePath },
): Promise<GroupActionState> {
  const user = await deps.requireUser();
  if (!canManageStudents(user.role)) {
    return { status: "error", code: "forbidden" };
  }
  try {
    await deps.createStudentGroup({
      teacherUserId: user.id,
      name: String(formData.get("name") ?? ""),
    });
    revalidateRoster(deps.revalidatePath);
    return { status: "success" };
  } catch (error) {
    if (error instanceof TeacherStudentsError) {
      return { status: "error", code: mapError(error) };
    }
    console.error("createStudentGroupAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export async function renameStudentGroupAction(
  _prev: GroupActionState,
  formData: FormData,
  deps: {
    requireUser: typeof requireUser;
    renameStudentGroup: typeof renameStudentGroup;
    revalidatePath: Revalidate;
  } = { requireUser, renameStudentGroup, revalidatePath },
): Promise<GroupActionState> {
  const user = await deps.requireUser();
  if (!canManageStudents(user.role)) {
    return { status: "error", code: "forbidden" };
  }
  try {
    await deps.renameStudentGroup({
      teacherUserId: user.id,
      groupId: Number(formData.get("groupId")),
      name: String(formData.get("name") ?? ""),
    });
    revalidateRoster(deps.revalidatePath);
    return { status: "success" };
  } catch (error) {
    if (error instanceof TeacherStudentsError) {
      return { status: "error", code: mapError(error) };
    }
    console.error("renameStudentGroupAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export async function deleteStudentGroupAction(
  _prev: GroupActionState,
  formData: FormData,
  deps: {
    requireUser: typeof requireUser;
    deleteStudentGroup: typeof deleteStudentGroup;
    revalidatePath: Revalidate;
  } = { requireUser, deleteStudentGroup, revalidatePath },
): Promise<GroupActionState> {
  const user = await deps.requireUser();
  if (!canManageStudents(user.role)) {
    return { status: "error", code: "forbidden" };
  }
  try {
    await deps.deleteStudentGroup({
      teacherUserId: user.id,
      groupId: Number(formData.get("groupId")),
    });
    revalidateRoster(deps.revalidatePath);
    return { status: "success" };
  } catch (error) {
    if (error instanceof TeacherStudentsError) {
      return { status: "error", code: mapError(error) };
    }
    console.error("deleteStudentGroupAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export async function assignStudentGroupAction(
  _prev: GroupActionState,
  formData: FormData,
  deps: {
    requireUser: typeof requireUser;
    placeStudentInGroup: typeof placeStudentInGroup;
    revalidatePath: Revalidate;
  } = { requireUser, placeStudentInGroup, revalidatePath },
): Promise<GroupActionState> {
  const user = await deps.requireUser();
  if (!canManageStudents(user.role)) {
    return { status: "error", code: "forbidden" };
  }
  const rawGroup = String(formData.get("groupId") ?? "").trim();
  const groupId = rawGroup === "" ? null : Number(rawGroup);
  try {
    await deps.placeStudentInGroup({
      teacherUserId: user.id,
      studentUserId: Number(formData.get("studentUserId")),
      groupId,
    });
    revalidateRoster(deps.revalidatePath);
    const studentUserId = Number(formData.get("studentUserId"));
    if (Number.isInteger(studentUserId) && studentUserId > 0) {
      deps.revalidatePath(`/students/${studentUserId}`);
    }
    return { status: "success" };
  } catch (error) {
    if (error instanceof TeacherStudentsError) {
      return { status: "error", code: mapError(error) };
    }
    console.error("assignStudentGroupAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export async function createStudentInviteAction(
  _prev: InviteActionState,
  formData: FormData,
  deps: {
    requireUser: typeof requireUser;
    createStudentInvite: typeof createStudentInvite;
    revalidatePath: Revalidate;
    absoluteSiteUrl: typeof absoluteSiteUrl;
  } = {
    requireUser,
    createStudentInvite,
    revalidatePath,
    absoluteSiteUrl,
  },
): Promise<InviteActionState> {
  const user = await deps.requireUser();
  if (!canManageStudents(user.role)) {
    return { status: "error", code: "forbidden" };
  }
  const kind = formData.get("kind") === "group" ? "group" : "personal";
  const rawGroup = String(formData.get("groupId") ?? "").trim();
  try {
    const invite = await deps.createStudentInvite({
      teacherUserId: user.id,
      kind,
      groupId: kind === "group" ? Number(rawGroup) : null,
    });
    deps.revalidatePath("/students");
    return {
      status: "success",
      code: invite.code,
      url: deps.absoluteSiteUrl(inviteJoinPath(invite.code)),
      expiresAt: invite.expiresAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof TeacherStudentsError) {
      return { status: "error", code: mapError(error) };
    }
    console.error("createStudentInviteAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}

export async function redeemStudentInviteAction(
  _prev: RedeemInviteActionState,
  formData: FormData,
  deps: {
    requireUser: typeof requireUser;
    redeemStudentInvite: typeof redeemStudentInvite;
    revalidatePath: Revalidate;
  } = { requireUser, redeemStudentInvite, revalidatePath },
): Promise<RedeemInviteActionState> {
  const user = await deps.requireUser();
  if (user.role !== "student") {
    return { status: "error", code: "forbidden" };
  }
  try {
    const result = await deps.redeemStudentInvite({
      studentUserId: user.id,
      code: String(formData.get("code") ?? ""),
    });
    deps.revalidatePath("/join");
    deps.revalidatePath("/students");
    const already =
      !result.linkCreated &&
      (result.membership === "kept" || result.membership === "unchanged");
    return {
      status: "success",
      teacherName: result.teacherDisplayName,
      groupName: result.groupName,
      already,
    };
  } catch (error) {
    if (error instanceof TeacherStudentsError) {
      return { status: "error", code: mapError(error) };
    }
    console.error("redeemStudentInviteAction: unexpected error", error);
    return { status: "error", code: "generic" };
  }
}
