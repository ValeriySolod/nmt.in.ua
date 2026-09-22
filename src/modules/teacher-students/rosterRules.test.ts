import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { attachConsultationStudent } from "./attachConsultation";
import { redeemStudentInvite } from "./invites";
import { placeStudentInGroup } from "./membership";
import { TeacherStudentsError } from "./types";

type User = {
  id: number;
  role: string;
  display_name: string;
  login: string;
};

type Group = { id: number; teacher_user_id: number; name: string };

type Invite = {
  id: number;
  teacher_user_id: number;
  kind: "personal" | "group";
  group_id: number | null;
  code: string;
  expires_at: Date;
  revoked_at: Date | null;
};

type RequestRow = { id: number; student_id: number };

type State = {
  users: User[];
  links: string[];
  groups: Group[];
  members: Record<string, number>;
  invites: Invite[];
  requests: RequestRow[];
};

const NOW = new Date("2026-09-21T12:00:00.000Z");
const LATER = new Date("2026-10-05T12:00:00.000Z");
const PAST = new Date("2026-09-01T12:00:00.000Z");

function key(teacherId: number, studentId: number): string {
  return `${teacherId}:${studentId}`;
}

function createHarness(initial: Partial<State> = {}) {
  const state: State = {
    users: [
      {
        id: 2,
        role: "teacher",
        display_name: "Ігор Петренко",
        login: "demo-teacher",
      },
      {
        id: 1,
        role: "student",
        display_name: "Олена Коваленко",
        login: "demo-student",
      },
      ...(initial.users ?? []),
    ],
    links: [...(initial.links ?? [])],
    groups: [...(initial.groups ?? [])],
    members: { ...(initial.members ?? {}) },
    invites: [...(initial.invites ?? [])],
    requests: [...(initial.requests ?? [])],
  };

  let snapshot: State | null = null;

  const connection: SqlConnection = {
    beginTransaction: async () => {
      snapshot = structuredClone(state);
    },
    commit: async () => {
      snapshot = null;
    },
    rollback: async () => {
      if (!snapshot) return;
      const restored = structuredClone(snapshot);
      state.users = restored.users;
      state.links = restored.links;
      state.groups = restored.groups;
      state.members = restored.members;
      state.invites = restored.invites;
      state.requests = restored.requests;
      snapshot = null;
    },
    query: async <T,>(sql: string, params: unknown[] = []) => {
      if (sql.includes("FROM student_invites i")) {
        const invite = state.invites.find((row) => row.code === params[0]);
        if (!invite) return [] as T[];
        const teacher = state.users.find((user) => user.id === invite.teacher_user_id);
        const group = state.groups.find(
          (row) =>
            row.id === invite.group_id &&
            row.teacher_user_id === invite.teacher_user_id,
        );
        return [
          {
            ...invite,
            teacher_name: teacher?.display_name ?? "",
            group_name: group?.name ?? null,
          },
        ] as T[];
      }
      if (sql.includes("FROM consultation_requests")) {
        const request = state.requests.find((row) => row.id === params[0]);
        if (!request) return [] as T[];
        const student = state.users.find((user) => user.id === request.student_id);
        return [
          {
            id: request.id,
            student_id: request.student_id,
            role: student?.role ?? "",
            display_name: student?.display_name ?? "",
            login: student?.login ?? "",
          },
        ] as T[];
      }
      if (sql.includes("FROM student_group_members")) {
        const groupId = state.members[key(Number(params[0]), Number(params[1]))];
        if (groupId == null) return [] as T[];
        return [{ group_id: groupId }] as T[];
      }
      if (sql.includes("FROM student_groups")) {
        const group = state.groups.find(
          (row) => row.id === params[0] && row.teacher_user_id === params[1],
        );
        return (group ? [{ id: group.id, name: group.name }] : []) as T[];
      }
      if (sql.includes("FROM teacher_students")) {
        const linked = state.links.includes(
          key(Number(params[0]), Number(params[1])),
        );
        return (linked ? [{ teacher_user_id: params[0] }] : []) as T[];
      }
      if (sql.includes("FROM app_users")) {
        const user = state.users.find((row) => row.id === params[0]);
        return (user ? [user] : []) as T[];
      }
      return [] as T[];
    },
    execute: async (sql, params = []) => {
      if (sql.includes("CREATE TABLE")) {
        return { insertId: 0, affectedRows: 0 };
      }
      if (sql.includes("INSERT INTO teacher_students")) {
        const pair = key(Number(params[0]), Number(params[1]));
        if (state.links.includes(pair)) {
          throw Object.assign(new Error("Duplicate entry"), { errno: 1062 });
        }
        state.links.push(pair);
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("DELETE FROM student_group_members")) {
        const pair = key(Number(params[0]), Number(params[1]));
        if (!(pair in state.members)) return { insertId: 0, affectedRows: 0 };
        delete state.members[pair];
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("INSERT INTO student_group_members")) {
        const pair = key(Number(params[0]), Number(params[1]));
        if (pair in state.members) {
          throw Object.assign(new Error("Duplicate entry"), { errno: 1062 });
        }
        if (!state.links.includes(pair)) {
          throw Object.assign(new Error("Foreign key"), { errno: 1452 });
        }
        state.members[pair] = Number(params[2]);
        return { insertId: 0, affectedRows: 1 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    release: () => {},
  };

  return {
    state,
    deps: { getConnection: async () => connection, now: () => NOW },
  };
}

function baseGroups(): Group[] {
  return [
    { id: 10, teacher_user_id: 2, name: "11-А" },
    { id: 11, teacher_user_id: 2, name: "11-Б" },
  ];
}

test("redeem personal invite links the student and does not assign a group", async () => {
  const harness = createHarness({
    invites: [
      {
        id: 1,
        teacher_user_id: 2,
        kind: "personal",
        group_id: null,
        code: "ABCD23WXYZ",
        expires_at: LATER,
        revoked_at: null,
      },
    ],
  });

  const result = await redeemStudentInvite(
    { studentUserId: 1, code: "abcd-23wxyz" },
    harness.deps,
  );

  assert.equal(result.linkCreated, true);
  assert.equal(result.placement, "personal");
  assert.equal(result.membership, "kept");
  assert.equal(result.groupName, null);
  assert.deepEqual(harness.state.links, ["2:1"]);
  assert.deepEqual(harness.state.members, {});
});

test("redeem personal invite keeps an existing group", async () => {
  const harness = createHarness({
    links: ["2:1"],
    groups: baseGroups(),
    members: { "2:1": 10 },
    invites: [
      {
        id: 1,
        teacher_user_id: 2,
        kind: "personal",
        group_id: null,
        code: "ABCD23WXYZ",
        expires_at: LATER,
        revoked_at: null,
      },
    ],
  });

  const result = await redeemStudentInvite(
    { studentUserId: 1, code: "ABCD23WXYZ" },
    harness.deps,
  );

  assert.equal(result.linkCreated, false);
  assert.equal(result.membership, "kept");
  assert.deepEqual(harness.state.members, { "2:1": 10 });
});

test("redeem group invite links the student and places them in that group", async () => {
  const harness = createHarness({
    groups: baseGroups(),
    invites: [
      {
        id: 2,
        teacher_user_id: 2,
        kind: "group",
        group_id: 11,
        code: "HJKM23WXYZ",
        expires_at: LATER,
        revoked_at: null,
      },
    ],
  });

  const result = await redeemStudentInvite(
    { studentUserId: 1, code: "HJKM23WXYZ" },
    harness.deps,
  );

  assert.equal(result.linkCreated, true);
  assert.equal(result.groupName, "11-Б");
  assert.equal(result.membership, "placed");
  assert.deepEqual(harness.state.links, ["2:1"]);
  assert.deepEqual(harness.state.members, { "2:1": 11 });
});

test("one group per teacher: a second group invite replaces membership", async () => {
  const harness = createHarness({
    links: ["2:1"],
    groups: baseGroups(),
    members: { "2:1": 10 },
    invites: [
      {
        id: 3,
        teacher_user_id: 2,
        kind: "group",
        group_id: 11,
        code: "NPQR23WXYZ",
        expires_at: LATER,
        revoked_at: null,
      },
    ],
  });

  const result = await redeemStudentInvite(
    { studentUserId: 1, code: "NPQR23WXYZ" },
    harness.deps,
  );

  assert.equal(result.membership, "moved");
  assert.equal(Object.keys(harness.state.members).length, 1);
  assert.equal(harness.state.members["2:1"], 11);
});

test("placeStudentInGroup replaces the previous group and can clear it", async () => {
  const harness = createHarness({
    links: ["2:1"],
    groups: baseGroups(),
    members: { "2:1": 10 },
  });

  const moved = await placeStudentInGroup(
    { teacherUserId: 2, studentUserId: 1, groupId: 11 },
    harness.deps,
  );
  assert.equal(moved, "moved");
  assert.deepEqual(harness.state.members, { "2:1": 11 });

  const cleared = await placeStudentInGroup(
    { teacherUserId: 2, studentUserId: 1, groupId: null },
    harness.deps,
  );
  assert.equal(cleared, "cleared");
  assert.deepEqual(harness.state.members, {});
  assert.deepEqual(harness.state.links, ["2:1"]);
});

test("placeStudentInGroup refuses a student who is not on the roster", async () => {
  const harness = createHarness({ groups: baseGroups() });
  await assert.rejects(
    () =>
      placeStudentInGroup(
        { teacherUserId: 2, studentUserId: 1, groupId: 10 },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "not_linked",
  );
  assert.deepEqual(harness.state.members, {});
});

test("expired and revoked invites are rejected without linking", async () => {
  const harness = createHarness({
    invites: [
      {
        id: 4,
        teacher_user_id: 2,
        kind: "personal",
        group_id: null,
        code: "STUV23WXYZ",
        expires_at: PAST,
        revoked_at: null,
      },
      {
        id: 5,
        teacher_user_id: 2,
        kind: "personal",
        group_id: null,
        code: "WXYZ234567",
        expires_at: LATER,
        revoked_at: NOW,
      },
    ],
  });

  await assert.rejects(
    () =>
      redeemStudentInvite(
        { studentUserId: 1, code: "STUV23WXYZ" },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "invite_expired",
  );
  await assert.rejects(
    () =>
      redeemStudentInvite(
        { studentUserId: 1, code: "WXYZ234567" },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "invite_revoked",
  );
  assert.deepEqual(harness.state.links, []);
});

test("a teacher account cannot redeem an invite", async () => {
  const harness = createHarness({
    invites: [
      {
        id: 6,
        teacher_user_id: 2,
        kind: "personal",
        group_id: null,
        code: "CDFGH23456",
        expires_at: LATER,
        revoked_at: null,
      },
    ],
  });

  await assert.rejects(
    () =>
      redeemStudentInvite(
        { studentUserId: 2, code: "CDFGH23456" },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "forbidden",
  );
});

test("attach from consultation links personally without a group", async () => {
  const harness = createHarness({
    requests: [{ id: 7, student_id: 1 }],
  });

  const result = await attachConsultationStudent(
    {
      teacherUserId: 2,
      requestId: 7,
      placement: "personal",
      groupId: null,
    },
    harness.deps,
  );

  assert.equal(result.linkCreated, true);
  assert.equal(result.groupName, null);
  assert.equal(result.membership, "kept");
  assert.deepEqual(harness.state.links, ["2:1"]);
  assert.deepEqual(harness.state.members, {});
});

test("attach from consultation into a group replaces any previous group", async () => {
  const harness = createHarness({
    links: ["2:1"],
    groups: baseGroups(),
    members: { "2:1": 10 },
    requests: [{ id: 8, student_id: 1 }],
  });

  const result = await attachConsultationStudent(
    {
      teacherUserId: 2,
      requestId: 8,
      placement: "group",
      groupId: 11,
    },
    harness.deps,
  );

  assert.equal(result.linkCreated, false);
  assert.equal(result.membership, "moved");
  assert.equal(result.groupName, "11-Б");
  assert.equal(Object.keys(harness.state.members).length, 1);
  assert.equal(harness.state.members["2:1"], 11);
});

test("attach from consultation reports a missing request", async () => {
  const harness = createHarness();
  await assert.rejects(
    () =>
      attachConsultationStudent(
        {
          teacherUserId: 2,
          requestId: 99,
          placement: "personal",
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "not_found",
  );
});
