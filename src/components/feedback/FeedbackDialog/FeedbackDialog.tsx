"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { ModeTabs } from "@/components/ui/ModeTabs";
import {
  dialogHidden,
  dialogShown,
  overlayHidden,
  overlayShown,
  tweenFast,
} from "@/lib/motionPresets";
import { useIsClient } from "@/lib/useIsClient";
import { submitFeedbackAction } from "@/modules/feedback/actions";
import type { SubmitFeedbackActionErrorCode } from "@/modules/feedback/actions";
import {
  MESSAGE_MAX_LEN,
  isFeedbackCommentRequired,
  type FeedbackSource,
} from "@/modules/feedback/types";
import css from "./FeedbackDialog.module.css";

const SCORE_IDS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
] as const;
type ScoreId = (typeof SCORE_IDS)[number];
type ScoreTab = ScoreId | "none";

type FeedbackDialogProps = {
  open: boolean;
  onClose: () => void;
  source: FeedbackSource;
  sessionId?: number;
  isGuest: boolean;
};

export function FeedbackDialog({
  open,
  onClose,
  source,
  sessionId,
  isGuest,
}: FeedbackDialogProps) {
  const t = useTranslations("Feedback");
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const mounted = useIsClient();
  const [score, setScore] = useState<ScoreTab>("none");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [errorCode, setErrorCode] = useState<SubmitFeedbackActionErrorCode | null>(
    null,
  );
  const [done, setDone] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!errorCode) return;
    if (errorCode === "message_required") {
      messageRef.current?.focus();
      return;
    }
    if (errorCode === "invalid_email") {
      emailRef.current?.focus();
      return;
    }
    errorRef.current?.focus();
  }, [errorCode]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const FOCUSABLE =
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const nodes = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => !node.hasAttribute("disabled") && node.tabIndex !== -1,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const numericScore = score === "none" ? null : Number(score);
  const showMessage =
    numericScore !== null && isFeedbackCommentRequired(numericScore);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (numericScore === null || pending) return;

    setPending(true);
    setErrorCode(null);

    const result = await submitFeedbackAction({
      score: numericScore,
      message: showMessage ? message : "",
      email: isGuest ? email : undefined,
      source,
      sessionId,
    });

    setPending(false);

    if (result.status !== "success") {
      setErrorCode(result.code);
      return;
    }

    setDone(true);
  }

  // Sidebar uses transform + overflow, which would trap position:fixed.
  return createPortal(
    <AnimatePresence>
      {open ? (
    <motion.div
      className={css.overlay}
      role="presentation"
      onClick={onClose}
      initial={reduceMotion ? false : overlayHidden}
      animate={overlayShown}
      exit={overlayHidden}
      transition={reduceMotion ? { duration: 0.01 } : tweenFast}
    >
      <motion.div
        ref={dialogRef}
        className={css.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        initial={reduceMotion ? false : dialogHidden}
        animate={dialogShown}
        exit={reduceMotion ? overlayHidden : dialogHidden}
        transition={reduceMotion ? { duration: 0.01 } : tweenFast}
      >
        {done ? (
          <div className={css.success}>
            <p className={css.kicker}>{t("kicker")}</p>
            <h2 id={titleId} className={css.title}>
              {t("thanksTitle")}
            </h2>
            <p className={css.lead}>{t("thanksLead")}</p>
            <div className={css.actions}>
              <button type="button" className={css.submit} onClick={onClose}>
                {t("close")}
              </button>
            </div>
          </div>
        ) : (
          <>
            <header>
              <p className={css.kicker}>{t("kicker")}</p>
              <h2 id={titleId} className={css.title}>
                {t("title")}
              </h2>
              <p className={css.lead}>{t("lead")}</p>
            </header>

            <form className={css.form} onSubmit={(event) => void handleSubmit(event)}>
              <div className={css.field}>
                <span className={css.label} id={`${titleId}-score`}>
                  {t("scoreLabel")}
                </span>
                <div className={css.scoreWrap}>
                  <ModeTabs<ScoreTab>
                    value={score}
                    onChange={(next) => {
                      setScore(next);
                      setErrorCode(null);
                    }}
                    options={SCORE_IDS.map((id) => ({
                      id,
                      label: t("scoreValue", { score: id }),
                    }))}
                    ariaLabel={t("scoreAria")}
                  />
                </div>
                {score === "none" ? (
                  <p className={css.hint}>{t("scoreHint")}</p>
                ) : null}
              </div>

              {showMessage ? (
                <label className={css.field}>
                  <span className={css.prompt}>{t("messageRequired")}</span>
                  <textarea
                    ref={messageRef}
                    className={css.textarea}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={MESSAGE_MAX_LEN}
                    required
                    disabled={pending}
                  />
                </label>
              ) : null}

              {isGuest ? (
                <label className={css.field}>
                  <span className={css.label}>{t("emailLabel")}</span>
                  <input
                    ref={emailRef}
                    className={css.input}
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    spellCheck={false}
                    disabled={pending}
                  />
                  <span className={css.hint}>{t("emailHint")}</span>
                </label>
              ) : null}

              {errorCode ? (
                <p
                  ref={errorRef}
                  className={clsx(css.alert, css.alertError)}
                  role="alert"
                  tabIndex={-1}
                >
                  {t(`errors.${errorCode}`)}
                </p>
              ) : null}

              <div className={css.actions}>
                <button
                  type="submit"
                  className={css.submit}
                  disabled={pending || score === "none"}
                >
                  {pending ? t("sending") : t("submit")}
                </button>
                <button
                  type="button"
                  className={css.later}
                  onClick={onClose}
                  disabled={pending}
                >
                  {t("later")}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
