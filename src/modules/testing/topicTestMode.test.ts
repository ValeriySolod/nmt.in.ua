import { test } from "node:test";
import assert from "node:assert/strict";
import {
  previewTaskCount,
  taskLimitForMode,
  ULTIMATE_TASK_LIMIT,
  TOPIC_TEST_TASK_COUNT,
} from "./topicTestMode";

test("taskLimitForMode returns 10 for standard and 20 for ultimate", () => {
  assert.equal(taskLimitForMode("standard"), TOPIC_TEST_TASK_COUNT);
  assert.equal(taskLimitForMode("ultimate"), ULTIMATE_TASK_LIMIT);
});

test("previewTaskCount caps by bank size", () => {
  assert.equal(previewTaskCount("standard", 25), 10);
  assert.equal(previewTaskCount("ultimate", 25), 20);
  assert.equal(previewTaskCount("ultimate", 8), 8);
});
