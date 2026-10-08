import assert from "node:assert/strict";
import test from "node:test";
import { aggregateSessions, compareStandings } from "./scoring";

test("aggregateSessions ignores sessions below min tasks", () => {
  const agg = aggregateSessions(
    [{ tasksNumber: 3, rightNumber: 3, timeSec: 60 }],
    5,
  );
  assert.equal(agg.sessionsCount, 0);
  assert.equal(agg.avgPercent, null);
});

test("compareStandings sorts by percent then speed", () => {
  const highSlow = aggregateSessions(
    [{ tasksNumber: 10, rightNumber: 9, timeSec: 200 }],
    5,
  );
  const highFast = aggregateSessions(
    [{ tasksNumber: 10, rightNumber: 9, timeSec: 100 }],
    5,
  );
  const low = aggregateSessions(
    [{ tasksNumber: 10, rightNumber: 5, timeSec: 50 }],
    5,
  );

  assert.ok(compareStandings(highFast, highSlow) < 0);
  assert.ok(compareStandings(highSlow, low) < 0);
});
