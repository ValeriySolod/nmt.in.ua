import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageFrame } from "@/components/dashboard/PageFrame";
import {
  joinMarathonAction,
  linkBotAction,
  notifyPrefsAction,
} from "@/modules/marathons/daily/actions";
import { formatKyivWhen } from "@/modules/marathons/daily/calendar";
import type { DailyMarathon, DayProgress, Participant } from "@/modules/marathons/daily/store";
import { marathonErrorText } from "./errors";
import css from "./marathon.module.css";

type DayState = {
  dayNumber: number;
  topic: string;
  open: boolean;
  unlockAt: Date | null;
  progress?: DayProgress;
};

type MarathonMapViewProps = {
  marathon: DailyMarathon;
  days: DayState[];
  participant: Participant | null;
  locale: string;
  botReady: boolean;
  error?: string;
};

export async function MarathonMapView({
  marathon,
  days,
  participant,
  locale,
  botReady,
  error,
}: MarathonMapViewProps) {
  const t = await getTranslations("Marathon");
  const message = marathonErrorText(t, error);
  return (
    <div className={css.narrow}>
      <PageFrame
        kicker={t("kicker")}
        title={marathon.title}
        lead={t("mapLead", { days: marathon.daysCount })}
      >
        <div className={css.stack}>
          {message ? <p className={css.alert} role="alert">{message}</p> : null}
          {participant ? (
            <p className={css.meta}>{t("streak", { count: participant.streak })}</p>
          ) : (
            <form action={joinMarathonAction} className={css.actions}>
              <input type="hidden" name="slug" value={marathon.slug} />
              <button type="submit" className={css.button}>{t("join")}</button>
            </form>
          )}
          <ol className={css.days}>
            {days.map((day) => {
              const body = (
                <>
                  <span className={css.kicker}>{t("dayLabel", { n: day.dayNumber })}</span>
                  <strong>{day.topic}</strong>
                  <span className={css.meta}>
                    {day.progress?.completedAt != null
                      ? day.progress.passed
                        ? t("markPassed", { score: day.progress.score ?? 0 })
                        : t("markFailed", { score: day.progress.score ?? 0 })
                      : day.open
                        ? t("open")
                        : t("opensAt", {
                            when: day.unlockAt ? formatKyivWhen(day.unlockAt, locale) : "",
                          })}
                  </span>
                </>
              );
              if (!day.open || !participant) {
                return (
                  <li key={day.dayNumber} className={`${css.day} ${css.locked}`}>
                    {body}
                  </li>
                );
              }
              return (
                <li key={day.dayNumber}>
                  <Link
                    href={`/marathon/${marathon.slug}/day/${day.dayNumber}`}
                    className={`${css.day} ${day.progress?.passed ? css.passed : ""}`}
                  >
                    {body}
                  </Link>
                </li>
              );
            })}
          </ol>
          {participant ? (
            <>
              <p>
                <Link href={`/marathon/${marathon.slug}/final`} className={css.buttonQuiet}>
                  {t("toFinal")}
                </Link>
              </p>
              <section className={css.card} aria-labelledby="marathon-notify" id="notify">
                <h2 id="marathon-notify">{t("notifyTitle")}</h2>
                <form action={notifyPrefsAction} className={css.form}>
                  <input type="hidden" name="slug" value={marathon.slug} />
                  <div className={css.checks}>
                    <label>
                      <input type="checkbox" name="notifyEmail" value="1" defaultChecked={participant.notifyEmail} />
                      {t("notifyEmail")}
                    </label>
                    <label>
                      <input type="checkbox" name="notifyBot" value="1" defaultChecked={participant.notifyBot} />
                      {t("notifyBot")}
                    </label>
                  </div>
                  <button type="submit" className={css.button}>{t("save")}</button>
                </form>
                {botReady ? (
                  <form action={linkBotAction}>
                    <input type="hidden" name="slug" value={marathon.slug} />
                    <button type="submit" className={css.buttonQuiet}>
                      {participant.telegramChatId ? t("botLinked") : t("linkBot")}
                    </button>
                  </form>
                ) : (
                  <p className={css.meta}>{t("botOff")}</p>
                )}
              </section>
            </>
          ) : null}
        </div>
      </PageFrame>
    </div>
  );
}
