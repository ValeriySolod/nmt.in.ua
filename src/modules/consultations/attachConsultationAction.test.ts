import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser } from "@/modules/auth/types";
import { attachConsultationStudentAction } from "./actions";
import { attachConsultationStudent } from "@/modules/teacher-students/attachConsultation";

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

test("attachConsultationStudentAction uses the session teacher and request student", async () => {
  let captured: unknown;
  const spy = (async (input: unknown) => {
    captured = input;
    return {
      studentUserId: 1,
      studentDisplayName: "Олена Коваленко",
      studentLogin: "demo-student",
      groupId: 11,
      groupName: "11-Б",
      linkCreated: true,
      membership: "placed" as const,
    };
  }) as typeof attachConsultationStudent;

  const form = new FormData();
  form.set("requestId", "8");
  form.set("placement", "group");
  form.set("groupId", "11");
  form.set("teacherUserId", "999");
  form.set("studentUserId", "999");

  const state = await attachConsultationStudentAction(
    { status: "idle" },
    form,
    {
      requireUser: async () => teacher,
      attachConsultationStudent: spy,
      revalidatePath: () => {},
    },
  );

  assert.deepEqual(state, {
    status: "success",
    studentName: "Олена Коваленко",
    groupName: "11-Б",
  });
  assert.deepEqual(captured, {
    teacherUserId: 2,
    requestId: 8,
    placement: "group",
    groupId: 11,
  });
});

test("attachConsultationStudentAction forbids a student", async () => {
  let called = false;
  const spy = (async () => {
    called = true;
    return {
      studentUserId: 4,
      studentDisplayName: "Other",
      studentLogin: "other",
      groupId: null,
      groupName: null,
      linkCreated: true,
      membership: "kept" as const,
    };
  }) as typeof attachConsultationStudent;

  const form = new FormData();
  form.set("requestId", "8");
  form.set("placement", "personal");
  const state = await attachConsultationStudentAction(
    { status: "idle" },
    form,
    {
      requireUser: async () => student,
      attachConsultationStudent: spy,
      revalidatePath: () => {},
    },
  );

  assert.deepEqual(state, { status: "error", code: "forbidden" });
  assert.equal(called, false);
});
