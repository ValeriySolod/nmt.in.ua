"use client";

import { useState } from "react";
import { getStage2HintLevelAction } from "@/modules/stage2/actions";
import type { Stage2Format } from "@/modules/stage2/stage2Attempt";

export type HintRung = { level: 1 | 2 | 3; text: string; isFinal: boolean };

/**
 * Shared client-side hint-ladder state for all 5 Stage 2 formats — mirrors
 * the "Показати підказку" → "Наступна підказка" affordance already wired
 * into `TopicTrainer` for Stage 1. Requests exactly one rung at a time via
 * `getStage2HintLevelAction`; the server enforces the sequential ratchet and
 * the answer-leakage gate (rung 3 withheld until the retry is consumed) —
 * this hook never assumes or fabricates rung content client-side.
 */
export function useStage2HintLadder(format: Stage2Format, taskId: number, roundId?: number) {
  const [rungs, setRungs] = useState<HintRung[]>([]);
  const [loading, setLoading] = useState(false);

  async function requestNext() {
    if (loading) return;
    const nextLevel = (rungs.length + 1) as 1 | 2 | 3;
    if (nextLevel > 3) return;
    setLoading(true);
    try {
      const state = await getStage2HintLevelAction({ format, taskId, roundId, level: nextLevel });
      if (state.status === "success" && state.available && state.text && state.level) {
        setRungs((prev) => [...prev, { level: state.level as 1 | 2 | 3, text: state.text as string, isFinal: state.isFinal }]);
      }
    } finally {
      setLoading(false);
    }
  }

  const isFinal = rungs.length > 0 && rungs[rungs.length - 1].isFinal;

  return { rungs, loading, requestNext, isFinal };
}
