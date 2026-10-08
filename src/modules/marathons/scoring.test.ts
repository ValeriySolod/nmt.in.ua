import assert from "node:assert/strict";
import test from "node:test";
import {
  aggregateSessions,
  compareStandings,
  countsTowardMarathon,
} from "./scoring";

test("aggregateSessions ignores sessions below min tasks", () => {
  const agg = aggregateSessions(
    [{ tasksNumber: 3, rightNumber: 3, timeSec: 60 }],
    5,
  );
  assert.equal(agg.sessionsCount, 0);
  assert.equal(agg.avgPercent, null);
});

test("countsTowardMarathon ignores sessions started before join", () => {
  const marathonStartsAt = 1_000;
  const marathonEndsAt = 5_000;
  const joinedAtUnix = 3_000;

  assert.equal(
    countsTowardMarathon({
      startTime: 2_000,
      marathonStartsAt,
      marathonEndsAt,
      joinedAtUnix,
    }),
    false,
  );
  assert.equal(
    countsTowardMarathon({
      startTime: 3_000,
      marathonStartsAt,
      marathonEndsAt,
      joinedAtUnix,
    }),
    true,
  );
  assert.equal(
    countsTowardMarathon({
      startTime: 5_001,
      marathonStartsAt,
      marathonEndsAt,
      joinedAtUnix,
    }),
    false,
  );
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
