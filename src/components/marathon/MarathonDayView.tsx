import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageFrame } from "@/components/dashboard/PageFrame";
import { MathText } from "@/components/ui/MathText/MathText";
import {
  markMaterialsAction,
  submitDayAction,
} from "@/modules/marathons/daily/actions";
import { formatKyivWhen } from "@/modules/marathons/daily/calendar";
import { loomEmbedSrc, renderSafeMarkdown, youtubeEmbedSrc } from "@/modules/marathons/daily/richText";
import type { DailyMarathon, DayProgress, MarathonDay, Material, PlayTask } from "@/modules/marathons/daily/store";
import { marathonErrorText } from "./errors";
import css from "./marathon.module.css";

type MarathonDayViewProps = {
  marathon: DailyMarathon;
  day: MarathonDay;
  materials: Material[];
  tasks: PlayTask[];
  progress: DayProgress | undefined;
  lockedUntil: Date | null;
  locale: string;
  error?: string;
};

export async function MarathonDayView(props: MarathonDayViewProps) {
  const t = await getTranslations("Marathon");
  const { marathon, day, materials, tasks, progress, lockedUntil, locale, error } = props;
  const message = marathonErrorText(t, error);
  return (
    <div className={css.narrow}>
      <PageFrame
        kicker={t("dayLabel", { n: day.dayNumber })}
        title={day.topic}
        lead={day.introText ?? undefined}
      >
        <div className={css.stack}>
          {message ? <p className={css.alert} role="alert">{message}</p> : null}
          {lockedUntil ? (
            <p className={css.alert}>
              {t("opensAt", { when: formatKyivWhen(lockedUntil, locale) })}
            </p>
          ) : (
            <>
              <section className={css.stack} aria-labelledby="day-materials">
                <h2 id="day-materials">{t("materialsTitle")}</h2>
                {materials.map((material) => (
                  <MaterialBlock key={material.id} material={material} title={day.topic} />
                ))}
                {!progress?.materialsViewed ? (
                  <form action={markMaterialsAction}>
                    <input type="hidden" name="slug" value={marathon.slug} />
                    <input type="hidden" name="day" value={day.dayNumber} />
                    <button type="submit" className={css.button}>{t("toTasks")}</button>
                  </form>
                ) : null}
              </section>
              {progress?.materialsViewed ? (
                <section className={css.stack} aria-labelledby="day-tasks">
                  <h2 id="day-tasks">{t("tasksTitle")}</h2>
                  {progress.completedAt != null ? (
                    <p className={css.alert} role="status">
                      {progress.passed
                        ? t("markPassed", { score: progress.score ?? 0 })
                        : t("markFailed", { score: progress.score ?? 0 })}
                    </p>
                  ) : null}
                  <form action={submitDayAction} className={css.stack}>
                    <input type="hidden" name="slug" value={marathon.slug} />
                    <input type="hidden" name="day" value={day.dayNumber} />
                    {tasks.map((task, index) => (
                      <fieldset key={task.id} className={css.card}>
                        <legend>
                          {index + 1}. <MathText text={task.prompt} as="span" />
                        </legend>
                        <div className={css.options}>
                          {task.options.map((option, optionIndex) => (
                            <label key={`${task.id}-${optionIndex}`} className={css.option}>
                              <input
                                type="radio"
                                name={`task_${task.id}`}
                                value={optionIndex + 1}
                                required
                              />
                              <MathText text={option} as="span" />
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    ))}
                    <button type="submit" className={css.button}>{t("submit")}</button>
                  </form>
                </section>
              ) : null}
            </>
          )}
          <Link href={`/marathon/${marathon.slug}/map`} className={css.buttonQuiet}>
            {t("backToMap")}
          </Link>
        </div>
      </PageFrame>
    </div>
  );
}

function MaterialBlock({ material, title }: { material: Material; title: string }) {
  if (material.type === "text") {
    return (
      <div
        className={`${css.card} ${css.prose}`}
        dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(material.urlOrBody) }}
      />
    );
  }
  const src = material.type === "youtube"
    ? youtubeEmbedSrc(material.urlOrBody)
    : loomEmbedSrc(material.urlOrBody);
  if (!src) return null;
  return (
    <div className={css.embed}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
