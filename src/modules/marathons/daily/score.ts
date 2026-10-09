export function scorePercent(correct: number, total: number): number {
  if (total <= 0) return 100;
  const safeCorrect = Math.max(0, Math.min(correct, total));
  return Math.round((safeCorrect / total) * 100);
}

export function isDayPassed(score: number, passThreshold: number): boolean {
  return score >= passThreshold;
}
