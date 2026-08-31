import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLearningSessionRows,
  resolveSessionDisplayStatus,
  SESSION_STATUS_CREATED,
  SESSION_STATUS_PLANNED,
} from "./types";

test("resolveSessionDisplayStatus maps planned, completed, and in-progress", () => {
  assert.equal(
    resolveSessionDisplayStatus({
      session_status: SESSION_STATUS_PLANNED,
      tasks_number: 10,
      right_number: 0,
      time: 0,
    }),
    "planned",
  );
  assert.equal(
    resolveSessionDisplayStatus({
      session_status: SESSION_STATUS_CREATED,
      tasks_number: 10,
      right_number: 10,
      time: 50,
    }),
    "completed",
  );
  assert.equal(
    resolveSessionDisplayStatus({
      session_status: SESSION_STATUS_CREATED,
      tasks_number: 5,
      right_number: 0,
      time: 0,
    }),
    "in_progress",
  );
});

test("buildLearningSessionRows formats table fields", () => {
  const rows = buildLearningSessionRows([
    {
      id: 12,
      theme_id: 2,
      theme_name: " Арифметичні дії ",
      tasks_number: 10,
      right_number: 8,
      time: 56,
      session_status: SESSION_STATUS_CREATED,
      session_type: 1,
      start_time: 0,
    },
  ]);

  assert.equal(rows[0]?.rowNumber, 1);
  assert.equal(rows[0]?.themeName, "Арифметичні дії");
  assert.equal(rows[0]?.percent, 80);
  assert.equal(rows[0]?.timePerTaskSec, 5.6);
  assert.equal(rows[0]?.createdByLabel, "Користувач");
  assert.equal(rows[0]?.statusLabel, "Створено");
});
