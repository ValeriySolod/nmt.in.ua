"use client";

import { useTranslations } from "next-intl";
import { MathText } from "@/components/ui/MathText";
import type { Stage2Format } from "@/modules/stage2/stage2Attempt";
import { useStage2HintLadder } from "./useStage2HintLadder";

export function Stage2Hints({ format, taskId, roundId }: { format: Stage2Format; taskId: number; roundId?: number }) {
  const t = useTranslations("Stage2");
  const hints = useStage2HintLadder(format, taskId, roundId);
  return <section aria-live="polite">
    {hints.rungs.map(rung => <MathText key={rung.level} text={rung.text} />)}
    {!hints.isFinal && <button type="button" disabled={hints.loading} onClick={() => void hints.requestNext()}>
      {hints.loading ? t("hintLoading") : t("showNextHint")}
    </button>}
  </section>;
}
