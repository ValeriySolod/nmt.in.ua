import assert from "node:assert/strict";
import test from "node:test";
import { resolveAssignmentSchedule } from "@/modules/mentor-assignments/dueAt";
import {
  MentorAssignmentsError,
  resolveMemberProgress,
} from "@/modules/mentor-assignments/types";

test("resolveAssignmentSchedule for now uses teacher dueAt", () => {
  const now = 1_700_000_000;
  const due = now + 3_600;
  assert.deepEqual(resolveAssignmentSchedule("now", null, due, now), {
    availableAt: now,
    dueAt: due,
  });
});

test("resolveAssignmentSchedule for datetime needs available + later due", () => {
  const now = 1_700_000_000;
  const available = now + 3_600;
  const due = available + 7_200;
  assert.deepEqual(
    resolveAssignmentSchedule("datetime", available, due, now),
    { availableAt: available, dueAt: due },
  );
  assert.throws(
    () => resolveAssignmentSchedule("datetime", available, available, now),
    (error: unknown) =>
      error instanceof MentorAssignmentsError && error.code === "invalid_input",
  );
  assert.throws(
    () => resolveAssignmentSchedule("now", null, now - 1, now),
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
