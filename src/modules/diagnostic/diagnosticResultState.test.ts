import assert from "node:assert/strict";
import test from "node:test";
import { isPerfectDiagnosticResult } from "./diagnosticResultState";

test("only a completed 10/10 diagnostic receives the perfect result message", () => {
  assert.equal(isPerfectDiagnosticResult(10, 10), true);
  assert.equal(isPerfectDiagnosticResult(9, 10), false);
  assert.equal(isPerfectDiagnosticResult(0, 10), false);
  assert.equal(isPerfectDiagnosticResult(2, 2), false);
  assert.equal(isPerfectDiagnosticResult(0, 0), false);
});
