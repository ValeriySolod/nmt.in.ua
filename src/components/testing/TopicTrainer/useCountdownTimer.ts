"use client";

import { useEffect, useRef, useState } from "react";
import { markSessionStartedAction } from "@/modules/testing/actions";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";

type UseCountdownTimerOptions = {
  sessionId: number;
  enabled: boolean;
  durationSec: number;
  onExpire: () => void;
};

/**
 * Countdown from session `start_time` (Ultimate mode). Calls `onExpire` once at 0.
 */
export function useCountdownTimer({
  sessionId,
  enabled,
  durationSec,
  onExpire,
}: UseCountdownTimerOptions): number {
  const [remainingSec, setRemainingSec] = useState(durationSec);
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    if (!enabled) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function startClock() {
      const result = await markSessionStartedAction({ sessionId });
      if (cancelled) return;

      const originSec =
        result.status === "success" && result.startTime > 0
          ? result.startTime
          : nowUnixSec();
      const endSec = originSec + durationSec;

      const tick = () => {
        const left = Math.max(0, endSec - nowUnixSec());
        setRemainingSec(left);
        if (left === 0 && !expiredRef.current) {
          expiredRef.current = true;
          onExpireRef.current();
        }
      };
      tick();
      if (cancelled) return;
      intervalId = setInterval(tick, 1000);
    }

    void startClock();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, enabled, durationSec]);

  return remainingSec;
}
