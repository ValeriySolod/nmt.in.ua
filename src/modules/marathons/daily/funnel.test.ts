import assert from "node:assert/strict";
import test from "node:test";
import { aggregateFunnel } from "./funnel";

test("funnel counts registered, verified, each day, final, and converted by UTM source", () => {
  const report = aggregateFunnel(
    [
      {
        source: "ads",
        emailVerified: true,
        daysCompleted: [true, true, false, false, false],
        finished: false,
        converted: false,
      },
      {
        source: "ads",
        emailVerified: true,
        daysCompleted: [true, true, true, true, true],
        finished: true,
        converted: true,
      },
      {
        source: null,
        emailVerified: false,
        daysCompleted: [false, false, false, false, false],
        finished: false,
        converted: false,
      },
    ],
    5,
  );
  assert.equal(report.totals.registered, 3);
  assert.equal(report.totals.emailVerified, 2);
  assert.deepEqual(report.totals.days, [2, 2, 1, 1, 1]);
  assert.equal(report.totals.final, 1);
  assert.equal(report.totals.converted, 1);
  assert.equal(report.bySource[0]?.source, "ads");
  assert.equal(report.bySource[0]?.counts.registered, 2);
  assert.equal(report.bySource[1]?.source, "(none)");
  assert.equal(report.bySource[1]?.counts.emailVerified, 0);
});
