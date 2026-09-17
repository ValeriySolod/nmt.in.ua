import assert from "node:assert/strict";
import test from "node:test";
import {
  getOrderTaskAction,
  submitOrderTaskAction,
  submitFindErrorTaskAction,
  submitGraphTaskAction,
  submitMatchingTaskAction,
  submitBlankTaskAction,
  getStage2HintLevelAction,
} from "./actions";
import { OrderTaskError } from "./orderTask";
import { FindErrorTaskError } from "./findErrorTask";
import { MatchingTaskError } from "./matchingTask";
import { Stage2HintError } from "./hintLadder";

const mockAuth = { requireUserId: async () => 1 };

test("getOrderTaskAction trusts the session userId and forwards it (never a client-supplied id)", async () => {
  let capturedUserId: unknown;
  const spy = (async (taskId: number, userId: number) => {
    capturedUserId = userId;
    return { taskId, name: "n", taskText: "t", steps: [], priorResult: null };
  }) as typeof import("./orderTask").getOrderTask;
  const authSpy = { requireUserId: async () => 7 };
  const state = await getOrderTaskAction(5, { getOrderTask: spy, ...authSpy });
  assert.equal(state.status, "success");
  assert.equal(capturedUserId, 7);
});

test("submitOrderTaskAction: never trusts a client-supplied userId (input has none), maps domain errors", async () => {
  const spy = (async () => {
    throw new OrderTaskError("nope", "not_found");
  }) as typeof import("./orderTask").submitOrderTaskAnswer;
  const state = await submitOrderTaskAction(
    { taskId: 1, submittedOrder: [1, 2] },
    { submitOrderTaskAnswer: spy, ...mockAuth },
  );
  assert.deepEqual(state, { status: "error", code: "notFound" });
});

test("submitFindErrorTaskAction maps invalid_input", async () => {
  const spy = (async () => {
    throw new FindErrorTaskError("nope", "invalid_input");
  }) as typeof import("./findErrorTask").submitFindErrorAnswer;
  const state = await submitFindErrorTaskAction(
    { taskId: 1, submittedLineOrd: 1, submittedCorrectionN: 1 },
    { submitFindErrorAnswer: spy, ...mockAuth },
  );
  assert.deepEqual(state, { status: "error", code: "invalidInput" });
});

test("submitGraphTaskAction success passthrough", async () => {
  const spy = (async () => ({ correct: true, firstAttempt: true })) as typeof import("./graphTask").submitGraphTaskAnswer;
  const state = await submitGraphTaskAction(
    { taskId: 1, submittedPointIds: [1, 2] },
    { submitGraphTaskAnswer: spy, ...mockAuth },
  );
  assert.deepEqual(state, { status: "success", correct: true, firstAttempt: true });
});

test("submitMatchingTaskAction maps generic db_error", async () => {
  const spy = (async () => {
    throw new MatchingTaskError("nope", "db_error");
  }) as typeof import("./matchingTask").submitMatchingAnswer;
  const state = await submitMatchingTaskAction(
    { taskId: 1, submittedPairs: { 1: 1 } },
    { submitMatchingAnswer: spy, ...mockAuth },
  );
  assert.deepEqual(state, { status: "error", code: "generic" });
});

test("submitBlankTaskAction success passthrough includes perBlank", async () => {
  const spy = (async () => ({
    correct: false,
    firstAttempt: true,
    retryAvailable: true as const,
    perBlank: { 1: true, 2: false },
  })) as typeof import("./blankTask").submitBlankTaskAnswer;
  const state = await submitBlankTaskAction(
    { taskId: 1, submitted: { 1: "6", 2: "x" } },
    { submitBlankTaskAnswer: spy, ...mockAuth },
  );
  assert.deepEqual(state, {
    status: "success",
    correct: false,
    firstAttempt: true,
    retryAvailable: true,
    perBlank: { 1: true, 2: false },
  });
});

test("unauthenticated access never reaches the task loader — auth failure maps to a generic error, no task content leaks", async () => {
  let taskLoaderCalled = false;
  const spy = (async () => {
    taskLoaderCalled = true;
    return { taskId: 1, name: "n", taskText: "t", steps: [], priorResult: null };
  }) as typeof import("./orderTask").getOrderTask;
  const failingAuth = {
    requireUserId: async () => {
      throw new Error("redirect to /login");
    },
  };
  const state = await getOrderTaskAction(1, { getOrderTask: spy, ...failingAuth });
  assert.deepEqual(state, { status: "error", code: "generic" });
  assert.equal(taskLoaderCalled, false);
});

test("getStage2HintLevelAction dispatches to the right format's hint function and trusts the session userId", async () => {
  let captured: unknown;
  const spy = (async (input: { userId: number; taskId: number; level: 1 | 2 | 3 }) => {
    captured = input;
    return { available: true, level: 1 as const, text: "direction", isFinal: false };
  }) as typeof import("./blankTask").getBlankTaskHintLevel;

  const state = await getStage2HintLevelAction(
    { format: "blank", taskId: 4, level: 1 },
    { getBlankTaskHintLevel: spy, ...mockAuth } as unknown as Parameters<typeof getStage2HintLevelAction>[1],
  );
  assert.deepEqual(state, { status: "success", available: true, level: 1, text: "direction", isFinal: false });
  assert.deepEqual(captured, { userId: 1, taskId: 4, level: 1 });
});

test("getStage2HintLevelAction maps the answer-leakage gate error to notEligible", async () => {
  const spy = (async () => {
    throw new Stage2HintError("nope", "not_eligible");
  }) as typeof import("./orderTask").getOrderTaskHintLevel;

  const state = await getStage2HintLevelAction(
    { format: "order", taskId: 1, level: 3 },
    { getOrderTaskHintLevel: spy, ...mockAuth } as unknown as Parameters<typeof getStage2HintLevelAction>[1],
  );
  assert.deepEqual(state, { status: "error", code: "notEligible" });
});
