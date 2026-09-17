"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { queryHref } from "@/lib/queryHref";
import { formatPercent } from "@/modules/results/types";
import css from "./TeacherStudentResultsPicker.module.css";

export const ALL_STUDENTS_VALUE = "all";

export type TeacherStudentOption = {
  studentUserId: number;
  login: string;
  displayName: string;
  /** Overall average across attempted themes; used for sort + label. */
  overallAverage: number | null;
};

type TeacherStudentResultsPickerProps = {
  students: TeacherStudentOption[];
  /** `all` or a student id string. */
  selectedValue: string;
};

function resultsHref(student: string): string {
  if (student === ALL_STUDENTS_VALUE) return "/results";
  return queryHref("/results", { student });
}

/** Keep local Select value in sync when the server prop changes after navigation. */
function useStateSynced(selectedValue: string) {
  const [value, setValue] = useState(selectedValue);
  const [prev, setPrev] = useState(selectedValue);
  if (selectedValue !== prev) {
    setPrev(selectedValue);
    setValue(selectedValue);
  }
  return [value, setValue] as const;
}

export function TeacherStudentResultsPicker({
  students,
  selectedValue,
}: TeacherStudentResultsPickerProps) {
  const t = useTranslations("TeacherStudentResults");
  const router = useRouter();
  const [value, setValue] = useStateSynced(selectedValue);

  if (students.length === 0) {
    return <p className={css.empty}>{t("noStudents")}</p>;
  }

  const showingOne = value !== ALL_STUDENTS_VALUE;

  return (
    <div className={css.bar}>
      <label className={css.field}>
        <span className={css.label}>{t("student")}</span>
        <Select
          value={value}
          onChange={(next) => {
            const student = next || ALL_STUDENTS_VALUE;
            setValue(student);
            router.push(resultsHref(student), { scroll: false });
          }}
          options={[
            { value: ALL_STUDENTS_VALUE, label: t("allStudents") },
            ...students.map((student) => ({
              value: String(student.studentUserId),
              label: t("studentOption", {
                name: student.displayName,
                login: student.login,
                score: formatPercent(student.overallAverage),
              }),
            })),
          ]}
        />
      </label>
      {showingOne ? (
        <Link
          href="/results"
          className={css.backAll}
          onClick={() => setValue(ALL_STUDENTS_VALUE)}
        >
          {t("backToAll")}
        </Link>
      ) : null}
    </div>
  );
}
