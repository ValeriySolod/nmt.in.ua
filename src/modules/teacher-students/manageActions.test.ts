import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser } from "@/modules/auth/types";
import {
  assignStudentGroupAction,
  createStudentInviteAction,
  redeemStudentInviteAction,
} from "./manageActions";
import { createStudentInvite } from "./invites";
import { placeStudentInGroup } from "./membership";
import { redeemStudentInvite } from "./invites";

const teacher: AuthUser = {
  id: 2,
  login: "demo-teacher",
  displayName: "Ігор Петренко",
  role: "teacher",
};

const student: AuthUser = {
  id: 1,
  login: "demo-student",
  displayName: "Олена Коваленко",
  role: "student",
};

test("assignStudentGroupAction uses the session teacher id", async () => {
  let captured: unknown;
  const spy = (async (input: unknown) => {
    captured = input;
    return "placed" as const;
  }) as typeof placeStudentInGroup;

  const form = new FormData();
  form.set("studentUserId", "1");
  form.set("groupId", "11");
  form.set("teacherUserId", "999");

  const state = await assignStudentGroupAction({ status: "idle" }, form, {
    requireUser: async () => teacher,
    placeStudentInGroup: spy,
    revalidatePath: () => {},
  });

  assert.deepEqual(state, { status: "success" });
  assert.deepEqual(captured, {
    teacherUserId: 2,
    studentUserId: 1,
    groupId: 11,
  });
});

test("assignStudentGroupAction forbids a student", async () => {
  let called = false;
  const spy = (async () => {
    called = true;
    return "placed" as const;
  }) as typeof placeStudentInGroup;

  const form = new FormData();
  form.set("studentUserId", "4");
  form.set("groupId", "11");
  const state = await assignStudentGroupAction({ status: "idle" }, form, {
    requireUser: async () => student,
    placeStudentInGroup: spy,
    revalidatePath: () => {},
  });

  assert.deepEqual(state, { status: "error", code: "forbidden" });
  assert.equal(called, false);
});

test("createStudentInviteAction does not take teacher id from the form", async () => {
  let captured: unknown;
  const spy = (async (input: unknown) => {
    captured = input;
    return {
      id: 1,
      kind: "personal" as const,
      groupId: null,
      groupName: null,
      code: "ABCD23WXYZ",
      expiresAt: new Date("2026-10-05T12:00:00.000Z"),
    };
  }) as typeof createStudentInvite;

  const form = new FormData();
  form.set("kind", "personal");
  form.set("teacherUserId", "999");

  const state = await createStudentInviteAction({ status: "idle" }, form, {
    requireUser: async () => teacher,
    createStudentInvite: spy,
    revalidatePath: () => {},
    absoluteSiteUrl: (path) => `https://nmt.in.ua${path}`,
  });

  assert.equal(state.status, "success");
  if (state.status === "success") {
    assert.equal(state.url, "https://nmt.in.ua/join/ABCD23WXYZ");
  }
  assert.deepEqual(captured, {
    teacherUserId: 2,
    kind: "personal",
    groupId: null,
  });
});

test("redeemStudentInviteAction uses the session student id", async () => {
  let captured: unknown;
  const spy = (async (input: unknown) => {
    captured = input;
    return {
      teacherUserId: 2,
      teacherDisplayName: "Ігор Петренко",
      placement: "group" as const,
      groupId: 11,
      groupName: "11-Б",
      linkCreated: true,
      membership: "placed" as const,
    };
  }) as typeof redeemStudentInvite;

  const form = new FormData();
  form.set("code", "HJKM23WXYZ");
  form.set("studentUserId", "999");

  const state = await redeemStudentInviteAction({ status: "idle" }, form, {
    requireUser: async () => student,
    redeemStudentInvite: spy,
    revalidatePath: () => {},
  });

  assert.deepEqual(state, {
    status: "success",
    teacherName: "Ігор Петренко",
    groupName: "11-Б",
    already: false,
  });
  assert.deepEqual(captured, { studentUserId: 1, code: "HJKM23WXYZ" });
});

test("redeemStudentInviteAction forbids a teacher", async () => {
  let called = false;
  const spy = (async () => {
    called = true;
    return {
      teacherUserId: 2,
      teacherDisplayName: "Ігор",
      placement: "personal" as const,
      groupId: null,
      groupName: null,
      linkCreated: true,
      membership: "kept" as const,
    };
  }) as typeof redeemStudentInvite;

  const form = new FormData();
  form.set("code", "ABCD23WXYZ");
  const state = await redeemStudentInviteAction({ status: "idle" }, form, {
    requireUser: async () => teacher,
    redeemStudentInvite: spy,
    revalidatePath: () => {},
  });

  assert.deepEqual(state, { status: "error", code: "forbidden" });
  assert.equal(called, false);
});
