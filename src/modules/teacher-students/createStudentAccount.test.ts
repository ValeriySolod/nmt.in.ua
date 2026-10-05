import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { createStudentForTeacher } from "./createStudentAccount";
import { TeacherStudentsError } from "./types";

type User = {
  id: number;
  login: string;
  email: string;
  display_name: string;
  role: string;
  password_hash: string;
  email_verified: boolean;
};

type Group = { id: number; teacher_user_id: number; name: string };

type State = {
  users: User[];
  links: string[];
  groups: Group[];
  members: Record<string, number>;
  inserts: string[];
};

function key(teacherId: number, studentId: number): string {
  return `${teacherId}:${studentId}`;
}

function createHarness(
  initial: Partial<State> = {},
  options: { failLink?: boolean } = {},
) {
  const state: State = {
    users: [
      {
        id: 7,
        login: "taken-login",
        email: "taken@example.com",
        display_name: "Taken",
        role: "student",
        password_hash: "existing",
        email_verified: true,
      },
      ...(initial.users ?? []),
    ],
    links: [...(initial.links ?? [])],
    groups: [
      { id: 10, teacher_user_id: 2, name: "11-А" },
      ...(initial.groups ?? []),
    ],
    members: { ...(initial.members ?? {}) },
    inserts: [],
  };
  let nextId = 40;
  let snapshot: State | null = null;
  let hashCalls = 0;

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
      state.inserts = restored.inserts;
      snapshot = null;
    },
    query: async <T,>(sql: string, params: unknown[] = []) => {
      if (sql.includes("information_schema") || sql.includes("COUNT(*)")) {
        return [{ count: 1, COLUMN_NAME: "email", INDEX_NAME: "uq_app_users_email" }] as T[];
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
      return [] as T[];
    },
    execute: async (sql, params = []) => {
      if (
        sql.includes("CREATE TABLE") ||
        sql.includes("ALTER TABLE") ||
        sql.includes("ON DUPLICATE KEY")
      ) {
        return { insertId: 0, affectedRows: 0 };
      }
      if (sql.includes("INSERT INTO app_users") && sql.includes("'student'")) {
        assert.match(sql, /CURRENT_TIMESTAMP/);
        assert.equal(params.length, 4);
        const [login, passwordHash, displayName, email] = params as string[];
        state.inserts.push(sql);
        if (state.users.some((user) => user.login === login)) {
          throw Object.assign(
            new Error("Duplicate entry for key 'uq_app_users_login'"),
            { errno: 1062 },
          );
        }
        if (state.users.some((user) => user.email === email)) {
          throw Object.assign(
            new Error("Duplicate entry for key 'uq_app_users_email'"),
            { errno: 1062 },
          );
        }
        const id = nextId;
        nextId += 1;
        state.users.push({
          id,
          login,
          email,
          display_name: displayName,
          role: "student",
          password_hash: passwordHash,
          email_verified: true,
        });
        return { insertId: id, affectedRows: 1 };
      }
      if (sql.includes("INSERT INTO teacher_students")) {
        if (options.failLink) {
          throw Object.assign(new Error("link failed"), { errno: 1452 });
        }
        const pair = key(Number(params[0]), Number(params[1]));
        state.links.push(pair);
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("INSERT INTO student_group_members")) {
        const pair = key(Number(params[0]), Number(params[1]));
        if (pair in state.members) {
          throw Object.assign(new Error("Duplicate entry"), { errno: 1062 });
        }
        state.members[pair] = Number(params[2]);
        return { insertId: 0, affectedRows: 1 };
      }
      if (sql.includes("DELETE FROM student_group_members")) {
        return { insertId: 0, affectedRows: 0 };
      }
      return { insertId: 0, affectedRows: 0 };
    },
    release: () => {},
  };

  return {
    state,
    hashCalls: () => hashCalls,
    deps: {
      getConnection: async () => connection,
      hashPassword: (password: string) => {
        hashCalls += 1;
        assert.equal(password.includes("\n"), false);
        return `hashed:${password.length}`;
      },
    },
  };
}

const PASSWORD = "correct-horse";

test("createStudentForTeacher rejects a short password before writing", async () => {
  const harness = createHarness();
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "new.pupil",
          email: "pupil@school.ua",
          password: "short",
          passwordConfirm: "short",
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) => {
      assert.ok(error instanceof TeacherStudentsError);
      assert.equal(error.code, "password_too_short");
      return true;
    },
  );
  assert.equal(harness.hashCalls(), 0);
  assert.equal(harness.state.users.length, 1);
  assert.equal(harness.state.links.length, 0);
});

test("createStudentForTeacher rejects an invalid email and a reserved login", async () => {
  const harness = createHarness();
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "new.pupil",
          email: "not-an-email",
          password: PASSWORD,
          passwordConfirm: PASSWORD,
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "invalid_email",
  );
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "demo-student",
          email: "pupil@school.ua",
          password: PASSWORD,
          passwordConfirm: PASSWORD,
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "reserved_login",
  );
  assert.equal(harness.hashCalls(), 0);
  assert.equal(harness.state.links.length, 0);
});

test("createStudentForTeacher rejects a mismatched password", async () => {
  const harness = createHarness();
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "new.pupil",
          email: "pupil@school.ua",
          password: PASSWORD,
          passwordConfirm: "other-horse",
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError &&
      error.code === "password_mismatch",
  );
  assert.equal(harness.hashCalls(), 0);
});

test("createStudentForTeacher maps a duplicate login and a duplicate email", async () => {
  const harness = createHarness();
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "taken-login",
          email: "fresh@school.ua",
          password: PASSWORD,
          passwordConfirm: PASSWORD,
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "login_taken",
  );
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "fresh.login",
          email: "TAKEN@example.com",
          password: PASSWORD,
          passwordConfirm: PASSWORD,
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "email_taken",
  );
  assert.equal(harness.state.users.length, 1);
  assert.equal(harness.state.links.length, 0);
});

test("createStudentForTeacher links the new student to the teacher", async () => {
  const harness = createHarness();
  const created = await createStudentForTeacher(
    {
      teacherUserId: 2,
      login: "Olena.K",
      email: "Olena@School.ua",
      password: PASSWORD,
      passwordConfirm: PASSWORD,
      groupId: null,
    },
    harness.deps,
  );

  assert.equal(created.login, "olena.k");
  assert.equal(created.displayName, "Olena.K");
  assert.equal(created.email, "olena@school.ua");
  assert.equal(created.groupId, null);
  assert.equal("password" in created, false);
  assert.deepEqual(harness.state.links, [`2:${created.studentUserId}`]);
  const user = harness.state.users.find((row) => row.id === created.studentUserId);
  assert.equal(user?.role, "student");
  assert.equal(user?.email_verified, true);
  assert.equal(user?.password_hash, `hashed:${PASSWORD.length}`);
  assert.equal(user?.password_hash.includes(PASSWORD), false);
  assert.deepEqual(harness.state.members, {});
  assert.match(harness.state.inserts[0] ?? "", /'student'/);
});

test("createStudentForTeacher can place the student in one owned group", async () => {
  const harness = createHarness();
  const created = await createStudentForTeacher(
    {
      teacherUserId: 2,
      login: "group.pupil",
      email: "group@school.ua",
      password: PASSWORD,
      passwordConfirm: PASSWORD,
      groupId: 10,
    },
    harness.deps,
  );

  assert.equal(created.groupId, 10);
  assert.equal(created.groupName, "11-А");
  assert.deepEqual(harness.state.members, {
    [`2:${created.studentUserId}`]: 10,
  });
  assert.equal(Object.keys(harness.state.members).length, 1);
});

test("createStudentForTeacher rolls back when the group is not owned", async () => {
  const harness = createHarness();
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "orphan.pupil",
          email: "orphan@school.ua",
          password: PASSWORD,
          passwordConfirm: PASSWORD,
          groupId: 99,
        },
        harness.deps,
      ),
    (error: unknown) =>
      error instanceof TeacherStudentsError && error.code === "group_not_found",
  );
  assert.equal(
    harness.state.users.some((user) => user.login === "orphan.pupil"),
    false,
  );
  assert.equal(harness.state.links.length, 0);
});

test("createStudentForTeacher rolls back the new user if linking fails", async () => {
  const harness = createHarness({}, { failLink: true });
  await assert.rejects(
    () =>
      createStudentForTeacher(
        {
          teacherUserId: 2,
          login: "rollback.pupil",
          email: "rollback@school.ua",
          password: PASSWORD,
          passwordConfirm: PASSWORD,
          groupId: null,
        },
        harness.deps,
      ),
    (error: unknown) => error instanceof Error && error.message === "link failed",
  );
  assert.equal(
    harness.state.users.some((user) => user.login === "rollback.pupil"),
    false,
  );
  assert.equal(harness.state.links.length, 0);
});
