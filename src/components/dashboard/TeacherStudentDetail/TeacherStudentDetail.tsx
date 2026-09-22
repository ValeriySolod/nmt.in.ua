import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TeacherClassSessions } from "@/components/dashboard/TeacherClassSessions";
import { TopicResultsTable } from "@/components/dashboard/TopicResultsTable";
import type { TopicResultRow } from "@/modules/results/types";
import type { TeacherLearningSessionRow } from "@/modules/sessions/teacherLearningSessions";
import css from "./TeacherStudentDetail.module.css";

type TeacherStudentDetailProps = {
  studentUserId: number;
  displayName: string;
  login: string;
  groupName: string | null;
  rows: TopicResultRow[];
  sessions: TeacherLearningSessionRow[];
};

export async function TeacherStudentDetail({
  studentUserId,
  displayName,
  login,
  groupName,
  rows,
  sessions,
}: TeacherStudentDetailProps) {
  const t = await getTranslations("TeacherStudents");
  const results = await getTranslations("TeacherStudentResults");
  const sessionCopy = await getTranslations("TeacherStudentSessions");

  return (
    <div className={css.stack}>
      <p className={css.meta}>
        @{login}
        {groupName ? <span className={css.badge}>{groupName}</span> : null}
      </p>
      <p className={css.links}>
        <Link className={css.back} href="/students">
          {t("backToList")}
        </Link>
        <Link className={css.link} href={`/results?student=${studentUserId}`}>
          {t("openResults")}
        </Link>
        <Link className={css.link} href={`/sessions?student=${studentUserId}`}>
          {t("openSessions")}
        </Link>
      </p>
      <TopicResultsTable
        rows={rows}
        readOnly
        hideEmptyThemes
        headingLevel="h2"
        title={results("title", { name: displayName })}
        lead={results("lead")}
      />
      <TeacherClassSessions
        rows={sessions}
        showStudent={false}
        headingLevel="h2"
        title={sessionCopy("studentTitle", { name: displayName })}
        lead={sessionCopy("studentLead")}
        empty={sessionCopy("studentEmpty")}
      />
    </div>
  );
}
