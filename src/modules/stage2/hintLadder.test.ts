import assert from "node:assert/strict";
import test from "node:test";
import type { SqlConnection } from "@/lib/db/mysql";
import { resolveStage2Rung, getStage2HintLevel, Stage2HintError } from "./hintLadder";

const CONTENT = { direction: "dir", rule: "rule", explanation: "explanation" };

test("resolveStage2Rung: rungs 1/2 available regardless of retry state", () => {
  assert.deepEqual(resolveStage2Rung(CONTENT, 1, false), { text: "dir", isFinal: false });
  assert.deepEqual(resolveStage2Rung(CONTENT, 2, false), { text: "rule", isFinal: false });
});

test("resolveStage2Rung: rung 3 withheld until the retry is consumed (answer-leakage gate)", () => {
  assert.deepEqual(resolveStage2Rung(CONTENT, 3, false), { text: null, isFinal: false });
  assert.deepEqual(resolveStage2Rung(CONTENT, 3, true), { text: "explanation", isFinal: true });
});

test("resolveStage2Rung: legacy content with no ladder is entirely gated until retry consumed", () => {
  const legacy = { direction: null, rule: null, explanation: "explanation" };
  assert.deepEqual(resolveStage2Rung(legacy, 1, false), { text: null, isFinal: false });
  assert.deepEqual(resolveStage2Rung(legacy, 1, true), { text: "explanation", isFinal: true });
});

function makeConnection(row: { status: number; retry_used: number; hint_level_unlocked: number } | null) {
  const current = row ? { id: 1, ...row } : null;
  const connection: SqlConnection = {
    beginTransaction: async () => {},
    query: async <T,>() => (current ? [current] : []) as unknown as T[],
    execute: async (_sql: string, params: unknown[] = []) => {
      const [level] = params as number[];
      if (current) current.hint_level_unlocked = level;
      return { insertId: 0, affectedRows: 1 };
    },
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
  };
  return { connection, get row() { return current; } };
}

test("getStage2HintLevel: not eligible before any wrong attempt", async () => {
  const mock = makeConnection(null);
  const result = await getStage2HintLevel(mock.connection, "order", 1, 1, 1, CONTENT);
  assert.deepEqual(result, { available: false, level: null, text: null, isFinal: false });
});

test("getStage2HintLevel: level 1 available and unlocks the ratchet", async () => {
  const mock = makeConnection({ status: -1, retry_used: 0, hint_level_unlocked: 0 });
  const result = await getStage2HintLevel(mock.connection, "order", 1, 1, 1, CONTENT);
  assert.deepEqual(result, { available: true, level: 1, text: "dir", isFinal: false });
  assert.equal(mock.row?.hint_level_unlocked, 1);
});

test("getStage2HintLevel: rejects skipping ahead to level 3", async () => {
  const mock = makeConnection({ status: -1, retry_used: 0, hint_level_unlocked: 0 });
  await assert.rejects(
    () => getStage2HintLevel(mock.connection, "order", 1, 1, 3, CONTENT),
    (e: unknown) => e instanceof Stage2HintError && e.code === "not_eligible",
  );
});

test("getStage2HintLevel: rung 3 unavailable before retry consumed even when ratchet allows it", async () => {
  const mock = makeConnection({ status: -1, retry_used: 0, hint_level_unlocked: 2 });
  const result = await getStage2HintLevel(mock.connection, "order", 1, 1, 3, CONTENT);
  assert.deepEqual(result, { available: false, level: null, text: null, isFinal: false });
});

test("getStage2HintLevel: rung 3 available once retry is consumed", async () => {
  const mock = makeConnection({ status: -1, retry_used: 1, hint_level_unlocked: 2 });
  const result = await getStage2HintLevel(mock.connection, "order", 1, 1, 3, CONTENT);
  assert.deepEqual(result, { available: true, level: 3, text: "explanation", isFinal: true });
});

test("authored analogous example unlocks sequentially before retry without current explanation", async () => {
  const mock = makeConnection({ status: -1, retry_used: 0, hint_level_unlocked: 0 });
  const content = { ...CONTENT, example: "Other data: 2z=18 gives z=9." };
  for (const level of [1, 2, 3] as const) {
    const result = await getStage2HintLevel(mock.connection, "order", 1, 1, level, content);
    assert.equal(result.available, true);
    assert.notEqual(result.text, CONTENT.explanation);
  }
  assert.equal(mock.row?.hint_level_unlocked, 3);
  const restored = await getStage2HintLevel(mock.connection, "order", 1, 1, 3, content);
  assert.deepEqual(restored, { available: true, level: 3, text: content.example, isFinal: true });
});
