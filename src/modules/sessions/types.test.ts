import assert from "node:assert/strict";
import test from "node:test";

import {
  buildLearningSessionRows,
  resolveSessionDisplayStatus,
  SESSION_STATUS_COMPLETED,
  SESSION_STATUS_CREATED,
  SESSION_STATUS_PLANNED,
} from "./types";

test("resolveSessionDisplayStatus maps planned/unfinished vs. completed", () => {
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
      session_status: SESSION_STATUS_COMPLETED,
      tasks_number: 10,
      right_number: 10,
      time: 50,
    }),
    "completed",
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
    "planned",
  );
  assert.equal(
    resolveSessionDisplayStatus({
      session_status: SESSION_STATUS_CREATED,
      tasks_number: 5,
      right_number: 2,
      time: 30,
    }),
    "planned",
  );
});

test("buildLearningSessionRows formats an unfinished session as planned", () => {
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
  assert.equal(rows[0]?.status, "planned");
  assert.equal(rows[0]?.statusLabel, "Заплановано");
});

test("buildLearningSessionRows formats a completed session with percent and elapsed time", () => {
  const rows = buildLearningSessionRows([
    {
      id: 13,
      theme_id: 2,
      theme_name: "Арифметичні дії",
      tasks_number: 10,
      right_number: 8,
      time: 56,
      session_status: SESSION_STATUS_COMPLETED,
      session_type: 1,
      start_time: 1000,
    },
  ]);

  assert.equal(rows[0]?.status, "completed");
  assert.equal(rows[0]?.statusLabel, "Виконано");
  assert.equal(rows[0]?.percent, 80);
  assert.equal(rows[0]?.timeSec, 56);
});
