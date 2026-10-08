export type SessionAggregateInput = {
  tasksNumber: number;
  rightNumber: number;
  timeSec: number;
};

export type StandingAggregate = {
  sessionsCount: number;
  avgPercent: number | null;
  avgSecPerTask: number | null;
};

export function sessionPercent(
  tasksNumber: number,
  rightNumber: number,
): number | null {
  if (tasksNumber <= 0) return null;
  return (rightNumber / tasksNumber) * 100;
}

export function sessionSecPerTask(
  tasksNumber: number,
  timeSec: number,
): number | null {
  if (tasksNumber <= 0 || timeSec <= 0) return null;
  return timeSec / tasksNumber;
}

export function aggregateSessions(
  sessions: readonly SessionAggregateInput[],
  minTasks: number,
): StandingAggregate {
  const eligible = sessions.filter((s) => s.tasksNumber >= minTasks);
  if (eligible.length === 0) {
    return { sessionsCount: 0, avgPercent: null, avgSecPerTask: null };
  }

  let percentSum = 0;
  let speedSum = 0;
  let speedCount = 0;

  for (const session of eligible) {
    const pct = sessionPercent(session.tasksNumber, session.rightNumber);
    if (pct != null) percentSum += pct;
    const speed = sessionSecPerTask(session.tasksNumber, session.timeSec);
    if (speed != null) {
      speedSum += speed;
      speedCount += 1;
    }
  }

  return {
    sessionsCount: eligible.length,
    avgPercent: percentSum / eligible.length,
    avgSecPerTask: speedCount > 0 ? speedSum / speedCount : null,
  };
}

export function compareStandings(
  a: StandingAggregate,
  b: StandingAggregate,
): number {
  const aPct = a.avgPercent ?? -1;
  const bPct = b.avgPercent ?? -1;
  if (bPct !== aPct) return bPct - aPct;

  const aSpeed = a.avgSecPerTask ?? Number.POSITIVE_INFINITY;
  const bSpeed = b.avgSecPerTask ?? Number.POSITIVE_INFINITY;
  if (aSpeed !== bSpeed) return aSpeed - bSpeed;

  return b.sessionsCount - a.sessionsCount;
}
