import { AsyncLocalStorage } from "node:async_hooks";
import type { Stage2Format } from "./stage2Attempt";
import { getRound, RoundError, type RoundDeps, type RoundMode } from "./rounds";

export type RoundContext = { roundId: number; userId: number; mode: RoundMode; completed: boolean };
const context = new AsyncLocalStorage<RoundContext>();

export function getRoundContext(): RoundContext | undefined {
  return context.getStore();
}

export async function withRound<T>(
  userId: number,
  roundId: number | undefined,
  format: Stage2Format,
  taskId: number,
  callback: () => Promise<T>,
  deps?: RoundDeps,
): Promise<T> {
  if (roundId === undefined) return callback();
  const round = await getRound(userId, roundId, deps);
  if (!round.tasks.some((task) => task.format === format && task.taskId === taskId)) {
    throw new RoundError("Task does not belong to this round.", "not_found");
  }
  return context.run({ roundId, userId, mode: round.mode, completed: round.completed }, callback);
}
