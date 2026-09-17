import assert from "node:assert/strict";
import test from "node:test";
import { resolveAssignmentDueAt } from "@/modules/mentor-assignments/dueAt";
import {
  MentorAssignmentsError,
  resolveMemberProgress,
} from "@/modules/mentor-assignments/types";
import { SESSION_LIFETIME_SEC } from "@/modules/testing/sessionExpiry";

test("resolveAssignmentDueAt for now uses 24h window", () => {
  const now = 1_700_000_000;
  assert.equal(
    resolveAssignmentDueAt("now", null, now),
    now + SESSION_LIFETIME_SEC,
  );
});

test("resolveAssignmentDueAt for datetime requires future stamp", () => {
  const now = 1_700_000_000;
  assert.equal(
    resolveAssignmentDueAt("datetime", now + 3600, now),
    now + 3600,
  );
  assert.throws(
    () => resolveAssignmentDueAt("datetime", now - 1, now),
    (error: unknown) =>
      error instanceof MentorAssignmentsError && error.code === "invalid_input",
  );
});

test("resolveMemberProgress maps completed / overdue / pending", () => {
  const due = 1000;
  assert.equal(
    resolveMemberProgress(
      { session_status: 1, tasks_number: 10, right_number: 10, time: 40 },
      due,
      2000,
    ),
    "completed",
  );
  assert.equal(
    resolveMemberProgress(
      { session_status: 3, tasks_number: 10, right_number: 0, time: 0 },
      due,
      2000,
    ),
    "overdue",
  );
  assert.equal(
    resolveMemberProgress(
      { session_status: 3, tasks_number: 10, right_number: 0, time: 0 },
      due,
      500,
    ),
    "pending",
  );
  assert.equal(resolveMemberProgress(null, due, 2000), "overdue");
});
