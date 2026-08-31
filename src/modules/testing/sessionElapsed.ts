/** Unix seconds for session `start_time` / `time` columns. */
export function nowUnixSec(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Duration stored at finish. Server clock minus `start_time`; at least 1s so
 * completed rows satisfy `time > 0` even if start and finish share a second.
 * Missing start (still 0) is recorded as "started now" with 1s elapsed.
 */
export function resolveSessionElapsedSec(
  startTime: number,
  nowSec: number,
): { timeSec: number; startTime: number } {
  if (!Number.isFinite(startTime) || startTime <= 0) {
    return { timeSec: 1, startTime: nowSec };
  }
  return {
    timeSec: Math.max(1, nowSec - startTime),
    startTime,
  };
}

/** Trainer header clock: `MM:SS` (minutes are unbounded). */
export function formatElapsedClock(totalSec: number): string {
  const safe =
    Number.isFinite(totalSec) && totalSec > 0 ? Math.floor(totalSec) : 0;
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
