"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { Select } from "@/components/ui/Select";
import {
  attachConsultationStudentAction,
  type AttachConsultationActionState,
} from "@/modules/consultations/actions";
import css from "./ConsultationsInbox.module.css";

const INITIAL: AttachConsultationActionState = { status: "idle" };

type GroupOption = {
  id: number;
  name: string;
};

export function AttachStudentForm({
  requestId,
  groups,
}: {
  requestId: number;
  groups: GroupOption[];
}) {
  const t = useTranslations("Consultations");
  const [state, action, pending] = useActionState(
    attachConsultationStudentAction,
    INITIAL,
  );

  return (
    <details className={css.attach}>
      <summary className={css.attachSummary}>{t("attach")}</summary>
      <form action={action} className={css.attachForm}>
        <input type="hidden" name="requestId" value={requestId} />
        <p className={css.attachLead}>{t("attachLead")}</p>
        <label className={css.choice}>
          <input
            type="radio"
            name="placement"
            value="personal"
            defaultChecked
          />
          <span>{t("attachPersonal")}</span>
        </label>
        <label className={clsx(css.choice, groups.length === 0 && css.choiceDisabled)}>
          <input
            type="radio"
            name="placement"
            value="group"
            disabled={groups.length === 0}
          />
          <span>{t("attachGroup")}</span>
        </label>
        {groups.length === 0 ? (
          <p className={css.attachHint}>{t("attachNoGroups")}</p>
        ) : null}
        {groups.length > 0 ? (
          <Select
            name="groupId"
            placeholder={t("attachPickGroup")}
            options={groups.map((group) => ({
              value: String(group.id),
              label: group.name,
            }))}
            aria-label={t("attachPickGroup")}
            disabled={pending}
          />
        ) : null}
        <button type="submit" className={css.close} disabled={pending}>
          {pending ? t("attachSaving") : t("attachSubmit")}
        </button>
        {state.status === "success" ? (
          <p className={css.attachOk} role="status">
            {state.groupName
              ? t("attachSuccessGroup", {
                  name: state.studentName,
                  group: state.groupName,
                })
              : t("attachSuccess", { name: state.studentName })}
          </p>
        ) : null}
        {state.status === "error" ? (
          <p className={css.error} role="alert">
            {t(`errors.${state.code}`)}
          </p>
        ) : null}
      </form>
    </details>
  );
}
