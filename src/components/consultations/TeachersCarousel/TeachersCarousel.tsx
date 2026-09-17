"use client";

import clsx from "clsx";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/components/account/UserAvatar";
import { ModeTabs } from "@/components/ui/ModeTabs";
import { rateTeacherAction } from "@/modules/teachers/actions";
import type { TeacherCarouselItem } from "@/modules/teachers/types";
import css from "./TeachersCarousel.module.css";

export type TeacherSortId = "rating" | "name" | "city";

export type TeachersCarouselProps = {
  teachers: TeacherCarouselItem[];
  selectedTeacherUserId: number | null;
  onSelectPersonal: (teacher: TeacherCarouselItem) => void;
};

function sortTeachers(
  teachers: TeacherCarouselItem[],
  sort: TeacherSortId,
): TeacherCarouselItem[] {
  const copy = [...teachers];
  copy.sort((a, b) => {
    if (sort === "name") {
      return a.displayName.localeCompare(b.displayName, "uk");
    }
    if (sort === "city") {
      const cityCmp = (a.city || "\uffff").localeCompare(b.city || "\uffff", "uk");
      if (cityCmp !== 0) return cityCmp;
      return a.displayName.localeCompare(b.displayName, "uk");
    }
    const aRating = a.avgRating ?? -1;
    const bRating = b.avgRating ?? -1;
    if (bRating !== aRating) return bRating - aRating;
    if (b.ratingCount !== a.ratingCount) return b.ratingCount - a.ratingCount;
    return a.displayName.localeCompare(b.displayName, "uk");
  });
  return copy;
}

function StarRating({
  value,
  label,
  onPick,
  disabled,
}: {
  value: number | null;
  label: string;
  onPick: (score: number) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Consultations");
  const current = value ?? 0;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const key = event.key;
    if (key >= "1" && key <= "5") {
      event.preventDefault();
      onPick(Number(key));
    }
  }

  return (
    <div
      className={css.stars}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {[1, 2, 3, 4, 5].map((score) => {
        const active = score <= current;
        return (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={score === current}
            aria-label={t("ratingStar", { score })}
            className={clsx(css.star, active && css.starOn)}
            disabled={disabled}
            onClick={() => onPick(score)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="currentColor"
                d="M12 3.6 14.7 9l6 .5-4.6 4 1.4 5.8L12 16.8 6.5 19.3l1.4-5.8L3.3 9.5l6-.5L12 3.6z"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

export function TeachersCarousel({
  teachers,
  selectedTeacherUserId,
  onSelectPersonal,
}: TeachersCarouselProps) {
  const t = useTranslations("Consultations");
  const trackRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<TeacherSortId>("rating");
  const [items, setItems] = useState(teachers);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sorted = useMemo(() => sortTeachers(items, sort), [items, sort]);

  const scrollByCard = useCallback((dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(`.${css.card}`);
    const step = card ? card.offsetWidth + 16 : 280;
    track.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  function rate(teacherUserId: number, score: number) {
    setError(null);
    setPendingId(teacherUserId);
    startTransition(async () => {
      const result = await rateTeacherAction(teacherUserId, score);
      setPendingId(null);
      if (!result.ok) {
        setError(t(`ratingErrors.${result.code}`));
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.userId === teacherUserId
            ? {
                ...item,
                myRating: result.score,
                avgRating: result.avgRating,
                ratingCount: result.ratingCount,
              }
            : item,
        ),
      );
    });
  }

  if (teachers.length === 0) {
    return (
      <section className={css.section} aria-labelledby="teachers-carousel-title">
        <header className={css.header}>
          <h2 id="teachers-carousel-title" className={css.title}>
            {t("carouselTitle")}
          </h2>
          <p className={css.lead}>{t("carouselEmpty")}</p>
        </header>
      </section>
    );
  }

  return (
    <section className={css.section} aria-labelledby="teachers-carousel-title">
      <header className={css.header}>
        <div className={css.headerCopy}>
          <h2 id="teachers-carousel-title" className={css.title}>
            {t("carouselTitle")}
          </h2>
          <p className={css.lead}>{t("carouselLead")}</p>
        </div>
        <ModeTabs
          value={sort}
          onChange={setSort}
          ariaLabel={t("sortAria")}
          options={[
            { id: "rating", label: t("sortRating") },
            { id: "name", label: t("sortName") },
            { id: "city", label: t("sortCity") },
          ]}
        />
      </header>

      {error ? (
        <p className={css.error} role="alert">
          {error}
        </p>
      ) : null}

      <div className={css.controls}>
        <button
          type="button"
          className={css.navBtn}
          onClick={() => scrollByCard(-1)}
          aria-label={t("scrollPrev")}
        >
          ‹
        </button>
        <button
          type="button"
          className={css.navBtn}
          onClick={() => scrollByCard(1)}
          aria-label={t("scrollNext")}
        >
          ›
        </button>
      </div>

      <div
        ref={trackRef}
        className={css.track}
        tabIndex={0}
        aria-label={t("carouselAria")}
      >
        {sorted.map((teacher) => {
          const selected = selectedTeacherUserId === teacher.userId;
          const ratingBusy = isPending && pendingId === teacher.userId;
          return (
            <article
              key={teacher.userId}
              className={clsx(css.card, selected && css.cardSelected)}
              aria-labelledby={`teacher-card-${teacher.userId}`}
            >
              <div className={css.identity}>
                <UserAvatar
                  user={{
                    id: teacher.userId,
                    login: teacher.login,
                    displayName: teacher.displayName,
                    role: teacher.role,
                    avatarRev: teacher.avatarRev,
                  }}
                  className={css.avatar}
                />
                <div className={css.identityCopy}>
                  <h3
                    id={`teacher-card-${teacher.userId}`}
                    className={css.name}
                  >
                    {teacher.displayName}
                  </h3>
                  {teacher.headline ? (
                    <p className={css.headline}>{teacher.headline}</p>
                  ) : null}
                  {teacher.city ? (
                    <p className={css.city}>{teacher.city}</p>
                  ) : null}
                </div>
              </div>

              {teacher.subjects.length > 0 ? (
                <ul className={css.chips}>
                  {teacher.subjects.slice(0, 4).map((subject) => (
                    <li key={subject} className={css.chip}>
                      {subject}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className={css.ratingBlock}>
                <p className={css.ratingMeta}>
                  {teacher.avgRating != null
                    ? t("ratingSummary", {
                        avg: teacher.avgRating.toFixed(1),
                        count: teacher.ratingCount,
                      })
                    : t("ratingNone")}
                </p>
                <StarRating
                  value={teacher.myRating}
                  label={t("rateAria", { name: teacher.displayName })}
                  disabled={ratingBusy}
                  onPick={(score) => rate(teacher.userId, score)}
                />
              </div>

              <button
                type="button"
                className={css.personal}
                onClick={() => onSelectPersonal(teacher)}
              >
                {t("personalCta")}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
