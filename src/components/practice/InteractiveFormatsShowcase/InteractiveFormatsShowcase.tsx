"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { OrderTaskCard } from "@/components/practice/OrderTaskCard";
import { FindErrorTaskCard } from "@/components/practice/FindErrorTaskCard";
import { GraphTaskCard } from "@/components/practice/GraphTaskCard";
import { MatchingTaskCard } from "@/components/practice/MatchingTaskCard";
import { BlankTaskCard } from "@/components/practice/BlankTaskCard";
import { Select } from "@/components/ui/Select";
import { startRoundAction, getRoundAction, listRoundsAction, finishRoundAction, skipRoundTaskAction, startMistakeRoundAction } from "@/modules/stage2/roundActions";
import type { RoundSnapshot, RoundSummary } from "@/modules/stage2/rounds";
import css from "./InteractiveFormatsShowcase.module.css";

export function InteractiveFormatsShowcase() {
  const t = useTranslations("Stage2");
  const [round, setRound] = useState<RoundSnapshot | null>(null);
  const [history, setHistory] = useState<RoundSummary[]>([]);
  const [position, setPosition] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => { let live = true; void listRoundsAction().then(result => {
    if (!live) return;
    if (result.status === "success") setHistory(result.rounds); else setError(true);
  }); return () => { live = false; }; }, []);

  async function run(work: () => ReturnType<typeof getRoundAction>, reset = false) {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      const result = await work();
      if (result.status !== "success") { setError(true); return; }
      setRound(result.round);
      if (reset) setPosition(0);
      setRevision(value => value + 1);
      const recent = await listRoundsAction();
      if (recent.status === "success") setHistory(recent.rounds);
    } catch { setError(true); } finally { setBusy(false); }
  }
  const task = round?.tasks[position];
  const diagnostic = round?.mode === "diagnostic" && !round.completed;
  const labels = { order: t("formatOrder"), find_error: t("formatFindError"), graph: t("formatGraph"), matching: t("formatMatching"), blank: t("formatBlank") };
  const props = task && round ? { taskId: task.taskId, roundId: round.id, diagnostic,
    onAnswered: () => { if (diagnostic) void run(() => getRoundAction(round.id)); } } : null;
  return <div className={css.frame}>
    <h1 className={css.title}>{t("pageTitle")}</h1>
    <p className={css.lead}>{t("roundLead")}</p>
    <div className={css.tabs}>
      <button className={css.tab} disabled={busy} onClick={() => void run(() => startRoundAction("practice"), true)}>{t("practiceRound")}</button>
      <button className={css.tab} disabled={busy} onClick={() => void run(() => startRoundAction("diagnostic"), true)}>{t("diagnosticRound")}</button>
    </div>
    <label className={css.roundHistory}>
      <span className={css.roundHistoryLabel}>{t("roundHistory")}</span>
      <Select
        className={css.roundHistorySelect}
        value={round?.id ? String(round.id) : ""}
        placeholder={t("selectRound")}
        disabled={busy}
        options={history.map((item) => ({
          value: String(item.id),
          label: `#${item.id} — ${t(item.mode === "practice" ? "practiceRound" : "diagnosticRound")} — ${t(item.completed ? "roundCompleted" : "roundActive")}`,
        }))}
        onChange={(next) => {
          const parsed = Number(next);
          if (parsed) void run(() => getRoundAction(parsed), true);
        }}
      />
    </label>
    {error && <p role="alert">{t("checkError")}</p>}
    {round && <>
      <p role="status">{round.completed ? t("roundScore", { correct: round.firstCorrectCount ?? 0, total: round.tasks.length }) : t("roundActive")}</p>
      <div className={css.taskPicker} role="group" aria-label={t("taskPickerLabel")}>
        {round.tasks.map((item, index) => <button key={item.position} className={css.taskPickerItem} aria-pressed={position === index} disabled={busy} onClick={() => setPosition(index)}>
          {index + 1}. {labels[item.format]} {item.answered || item.skipped ? "✓" : ""}
        </button>)}
      </div>
      {task && props && <fieldset className={css.card} disabled={busy || Boolean(diagnostic && task.answered) || task.skipped} key={`${round.id}-${position}-${revision}`}>
        <legend className={css.cardLegend}>{labels[task.format]}</legend>
        {diagnostic && task.answered && <p role="status">{t("answerSaved")}</p>}
        {task.format === "order" && <OrderTaskCard {...props} />}
        {task.format === "find_error" && <FindErrorTaskCard {...props} />}
        {task.format === "graph" && <GraphTaskCard {...props} />}
        {task.format === "matching" && <MatchingTaskCard {...props} />}
        {task.format === "blank" && <BlankTaskCard {...props} />}
      </fieldset>}
      {!round.completed && <div className={css.tabs}>
        {task && !task.answered && !task.skipped && <button className={css.tab} disabled={busy} onClick={() => void run(() => skipRoundTaskAction(round.id, task.format, task.taskId))}>{t("skipRoundTask")}</button>}
        <button className={css.tab} disabled={busy} onClick={() => void run(() => finishRoundAction(round.id))}>{t("finishRound")}</button>
      </div>}
      {round.completed && round.tasks.some(item => item.firstCorrect !== true) && <button className={css.tab} disabled={busy} onClick={() => void run(() => startMistakeRoundAction(round.id), true)}>{t("mistakeRound")}</button>}
    </>}
  </div>;
}
