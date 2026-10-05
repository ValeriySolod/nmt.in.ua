import assert from "node:assert/strict";
import test from "node:test";

import type { SqlConnection } from "@/lib/db/mysql";

import {
  approveTeacherApplication,
  getPendingTeacherApplications,
  rejectTeacherApplication,
} from "./store";
import { TeacherModerationError } from "./types";

function mockConnection(handlers: {
  query?: (sql: string, params?: unknown[]) => Promise<unknown[]>;
  execute?: (
    sql: string,
    params?: unknown[],
  ) => Promise<{ insertId: number; affectedRows: number }>;
}): SqlConnection {
  return {
    beginTransaction: async () => undefined,
    commit: async () => undefined,
    rollback: async () => undefined,
    release: () => undefined,

    query: async <T = unknown>(sql: string, params?: unknown[]) =>
      (handlers.query
        ? ((await handlers.query(sql, params)) as T[])
        : []) as T[],

    execute: async (sql, params) =>
      handlers.execute
        ? handlers.execute(sql, params)
        : { insertId: 0, affectedRows: 1 },
  };
}

test("approveTeacherApplication approves a pending application", async () => {
  let executedParams: unknown[] | undefined;

  await approveTeacherApplication(
    {
      reviewerUserId: 3,
      teacherUserId: 10,
    },
    {
      getConnection: async () =>
        mockConnection({
          execute: async (_sql, params) => {
            executedParams = params;

            return {
              insertId: 0,
              affectedRows: 1,
            };
          },
        }),
    },
  );

  assert.deepEqual(executedParams, [3, 10]);
});

test("approveTeacherApplication rejects a non-pending application", async () => {
  await assert.rejects(
    () =>
      approveTeacherApplication(
        {
          reviewerUserId: 3,
          teacherUserId: 10,
        },
        {
          getConnection: async () =>
            mockConnection({
              execute: async () => ({
                insertId: 0,
                affectedRows: 0,
              }),
            }),
        },
      ),
    (error: unknown) =>
      error instanceof TeacherModerationError &&
      error.code === "invalid_status",
  );
});

test("approveTeacherApplication rejects invalid user ids", async () => {
  await assert.rejects(
    () =>
      approveTeacherApplication({
        reviewerUserId: 0,
        teacherUserId: 10,
      }),
    (error: unknown) =>
      error instanceof TeacherModerationError && error.code === "invalid_input",
  );
});

test("rejectTeacherApplication rejects a pending application", async () => {
  let executedParams: unknown[] | undefined;

  await rejectTeacherApplication(
    {
      reviewerUserId: 3,
      teacherUserId: 10,
      rejectionReason: "  Profile needs more information.  ",
    },
    {
      getConnection: async () =>
        mockConnection({
          execute: async (_sql, params) => {
            executedParams = params;

            return {
              insertId: 0,
              affectedRows: 1,
            };
          },
        }),
    },
  );

  assert.deepEqual(executedParams, [3, "Profile needs more information.", 10]);
});

test("rejectTeacherApplication rejects an empty rejection reason", async () => {
  await assert.rejects(
    () =>
      rejectTeacherApplication({
        reviewerUserId: 3,
        teacherUserId: 10,
        rejectionReason: "   ",
      }),
    (error: unknown) =>
      error instanceof TeacherModerationError &&
      error.code === "invalid_rejection_reason",
  );
});

test("rejectTeacherApplication rejects a rejection reason over 1000 characters", async () => {
  await assert.rejects(
    () =>
      rejectTeacherApplication({
        reviewerUserId: 3,
        teacherUserId: 10,
        rejectionReason: "a".repeat(1001),
      }),
    (error: unknown) =>
      error instanceof TeacherModerationError &&
      error.code === "invalid_rejection_reason",
  );
});

test("rejectTeacherApplication rejects a non-pending application", async () => {
  await assert.rejects(
    () =>
      rejectTeacherApplication(
        {
          reviewerUserId: 3,
          teacherUserId: 10,
          rejectionReason: "Profile needs more information.",
        },
        {
          getConnection: async () =>
            mockConnection({
              execute: async () => ({
                insertId: 0,
                affectedRows: 0,
              }),
            }),
        },
      ),
    (error: unknown) =>
      error instanceof TeacherModerationError &&
      error.code === "invalid_status",
  );
});

test("getPendingTeacherApplications maps pending applications", async () => {
  const applications = await getPendingTeacherApplications({
    getConnection: async () =>
      mockConnection({
        query: async (sql) => {
          if (!sql.includes("FROM teacher_profiles p")) {
            return [];
          }

          return [
            {
              user_id: 10,
              display_name: "  Test Teacher  ",
              email: "teacher@example.com",
              avatar_rev: 1_700_000_111,
              slug: "test-teacher",
              headline: "Math teacher",
              bio: "About teacher",
              experience: "5 years",
              publications: null,
              city: "Kyiv",
              country: "Ukraine",
              subjects: JSON.stringify(["math"]),
              teaching_levels: JSON.stringify(["nmt", "grades_10_11"]),
              teaching_languages: JSON.stringify(["uk", "en"]),
              contact_url: null,
              phone: "+380 00 000 00 00",
              lesson_price: "500.00",
              lesson_currency: "UAH",
              lesson_duration_minutes: 60,
              join_motivation: "I want to help students.",
              moderation_status: "pending",
              submitted_at: "2026-10-04T12:00:00.000Z",
              reviewed_at: null,
              reviewed_by: null,
              rejection_reason: null,
            },
          ];
        },
      }),
  });

  assert.equal(applications.length, 1);

  assert.deepEqual(applications[0], {
    userId: 10,
    displayName: "Test Teacher",
    email: "teacher@example.com",

    avatarRev: 1_700_000_111,
    slug: "test-teacher",
    headline: "Math teacher",
    bio: "About teacher",
    experience: "5 years",
    publications: "",
    city: "Kyiv",
    country: "Ukraine",
    subjects: ["math"],
    teachingLevels: ["nmt", "grades_10_11"],
    teachingLanguages: ["uk", "en"],
    contactUrl: "",
    phone: "+380 00 000 00 00",
    lessonPrice: 500,
    lessonCurrency: "UAH",
    lessonDurationMinutes: 60,
    joinMotivation: "I want to help students.",

    moderationStatus: "pending",
    submittedAt: "2026-10-04T12:00:00.000Z",
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: "",
  });
});
