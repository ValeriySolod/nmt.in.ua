import Link from "next/link";
import clsx from "clsx";
import { formatPercent, formatSpeed } from "@/modules/results/types";
import type { MarathonLeaderboardView as LeaderboardData } from "@/modules/marathons/types";
import { getTranslations } from "next-intl/server";
import { MarathonJoinForm } from "./MarathonJoinForm";
import css from "./MarathonLeaderboard.module.css";

export type MarathonLeaderboardMode = "student" | "teacher" | "admin";

type Props = {
  data: LeaderboardData;
  mode: MarathonLeaderboardMode;
};

function formatAvgSec(sec: number | null): string {
  if (sec == null) return "—";
  return formatSpeed(sec);
}

function visibleLogin(
  mode: MarathonLeaderboardMode,
  row: {
    login: string;
    isCurrentUser: boolean;
    isRosterStudent: boolean;
  },
): string | null {
  if (row.isCurrentUser || mode === "admin") return row.login;
  if (mode === "teacher" && row.isRosterStudent) return row.login;
  return null;
}

export async function MarathonLeaderboardView({ data, mode }: Props) {
  const t = await getTranslations("MarathonLeaderboard");
  const {
    marathon,
    rows,
    participantCount,
    isParticipant,
    currentUserRank,
    rosterParticipantCount,
    rosterSize,
  } = data;

  return (
    <div className={css.root}>
      <div className={css.marathonMeta}>
        <p className={css.marathonTitle}>{marathon.title}</p>
        {marathon.description ? (
          <p className={css.marathonDesc}>{marathon.description}</p>
        ) : null}
        <p className={css.marathonRules}>{t("rules", { min: marathon.min_tasks_per_session })}</p>
      </div>

      {mode === "teacher" ? (
        <p className={css.monitorBanner} role="status">
          {t("teacherRoster", {
            joined: rosterParticipantCount,
            total: rosterSize,
          })}
          {rosterSize > 0 ? (
            <>
              {" "}
              <Link href="/students" className={css.monitorLink}>
                {t("teacherStudentsLink")}
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      {mode === "admin" ? (
        <p className={css.monitorBanner} role="status">
          {t("adminMonitor", { count: participantCount })}
        </p>
      ) : null}

      {mode === "student" && !isParticipant ? (
        <section className={css.joinPanel} aria-labelledby="marathon-join-title">
          <h2 id="marathon-join-title" className={css.joinTitle}>
            {t("joinTitle")}
          </h2>
          <MarathonJoinForm />
        </section>
      ) : null}

      {mode === "student" && isParticipant && currentUserRank != null ? (
        <p className={css.myRank} role="status">
          {t("yourRank", { rank: currentUserRank, total: participantCount })}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={css.empty} role="status">
          {t("empty")}
        </p>
      ) : (
        <>
          <ul className={css.cardList} aria-label={t("tableAria")}>
            {rows.map((row) => {
              const login = visibleLogin(mode, row);
              return (
              <li
                key={row.userId}
                className={clsx(
                  css.card,
                  row.isCurrentUser && css.cardSelf,
                  mode === "teacher" &&
                    row.isRosterStudent &&
                    css.cardRoster,
                )}
              >
                <div className={css.cardTop}>
                  <span className={css.rank}>#{row.rank}</span>
                  <span className={css.name}>
                    {row.displayName}
                    {login ? <span className={css.login}>@{login}</span> : null}
                  </span>
                </div>
                <dl className={css.meta}>
                  <div>
                    <dt>{t("avgPercent")}</dt>
                    <dd>{formatPercent(row.avgPercent)}</dd>
                  </div>
                  <div>
                    <dt>{t("speed")}</dt>
                    <dd>{formatAvgSec(row.avgSecPerTask)}</dd>
                  </div>
                  <div>
                    <dt>{t("sessions")}</dt>
                    <dd>{row.sessionsCount}</dd>
                  </div>
                </dl>
              </li>
              );
            })}
          </ul>

          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th scope="col">{t("colRank")}</th>
                  <th scope="col">{t("colName")}</th>
                  <th scope="col">{t("avgPercent")}</th>
                  <th scope="col">{t("speed")}</th>
                  <th scope="col">{t("sessions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const login = visibleLogin(mode, row);
                  return (
                  <tr
                    key={row.userId}
                    className={clsx(
                      row.isCurrentUser && css.rowSelf,
                      mode === "teacher" &&
                        row.isRosterStudent &&
                        css.rowRoster,
                    )}
                  >
                    <td className={css.colRank}>{row.rank}</td>
                    <td className={css.colName}>
                      {row.displayName}
                      {login ? <span className={css.login}>@{login}</span> : null}
                    </td>
                    <td className={css.colMetric}>
                      {formatPercent(row.avgPercent)}
                    </td>
                    <td className={css.colMetric}>
                      {formatAvgSec(row.avgSecPerTask)}
                    </td>
                    <td className={css.colMetric}>{row.sessionsCount}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className={css.hint}>{t("hint")}</p>
    </div>
  );
}
