import assert from "node:assert/strict";
import test from "node:test";
import { diagnosticKnowledgeLevelToScore } from "./diagnosticKnowledgeLevel";

test("maps the three knowledge choices to the existing adaptive difficulty bands", () => {
  assert.equal(diagnosticKnowledgeLevelToScore("know"), 9);
  assert.equal(diagnosticKnowledgeLevelToScore("partial"), 6);
  assert.equal(diagnosticKnowledgeLevelToScore("unknown"), 2);
});

test("rejects values outside the three knowledge choices", () => {
  assert.equal(diagnosticKnowledgeLevelToScore("10"), null);
  assert.equal(diagnosticKnowledgeLevelToScore(""), null);
  assert.equal(diagnosticKnowledgeLevelToScore(null), null);
});
