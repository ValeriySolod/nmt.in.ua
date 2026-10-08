"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { LearningSessionRow } from "@/modules/sessions/types";
import { LearningSessionCard } from "./LearningSessionCard";
import css from "./LearningSessionsTable.module.css";

type LearningSessionsMobileSwiperProps = {
  rows: LearningSessionRow[];
  extended: boolean;
  readOnly: boolean;
  listLabel: string;
};

export function LearningSessionsMobileSwiper({
  rows,
  extended,
  readOnly,
  listLabel,
}: LearningSessionsMobileSwiperProps) {
  const t = useTranslations("LearningSessionsTable");
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, rows.length - 1));
    const slide = track.children.item(clamped) as HTMLElement | null;
    slide?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }, [rows.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || rows.length === 0) return;

    const slides = track.querySelectorAll<HTMLElement>("[data-slide-index]");
    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-slide-index"));
          if (!Number.isInteger(index)) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index, ratio: entry.intersectionRatio };
          }
        }
        if (best) setActiveIndex(best.index);
      },
      { root: track, threshold: [0.35, 0.55, 0.75] },
    );

    for (const slide of slides) observer.observe(slide);
    return () => observer.disconnect();
  }, [rows.length]);

  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= rows.length - 1;

  return (
    <div className={css.swipeRoot}>
      <div className={css.swipeToolbar}>
        <p className={css.swipeStatus} aria-live="polite">
          {t("swiperPosition", {
            current: activeIndex + 1,
            total: rows.length,
          })}
        </p>
        <div className={css.swipeNav}>
          <button
            type="button"
            className={clsx(css.swipeNavBtn, atStart && css.swipeNavBtnDisabled)}
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={atStart}
            aria-controls="learning-sessions-cards"
          >
            {t("swiperPrev")}
          </button>
          <button
            type="button"
            className={clsx(css.swipeNavBtn, atEnd && css.swipeNavBtnDisabled)}
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={atEnd}
            aria-controls="learning-sessions-cards"
          >
            {t("swiperNext")}
          </button>
        </div>
      </div>

      <ul
        id="learning-sessions-cards"
        ref={trackRef}
        className={css.swipeTrack}
        aria-label={listLabel}
      >
        {rows.map((row, index) => (
          <li
            key={row.id}
            className={css.swipeSlide}
            data-slide-index={index}
            aria-hidden={index !== activeIndex}
          >
            <LearningSessionCard
              row={row}
              extended={extended}
              readOnly={readOnly}
            />
          </li>
        ))}
      </ul>

      <p className={css.swipeHint}>{t("swiperHint")}</p>
    </div>
  );
}
