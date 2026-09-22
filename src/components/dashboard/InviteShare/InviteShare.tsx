"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import css from "./InviteShare.module.css";

type InviteShareProps = {
  code: string;
  url: string;
  expiresAt: string;
};

function formatWhen(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function InviteShare({ code, url, expiresAt }: InviteShareProps) {
  const t = useTranslations("TeacherStudents");
  const locale = useLocale();
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  async function copy(value: string, which: "code" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className={css.share}>
      <label className={css.field}>
        <span className={css.label}>{t("codeLabel")}</span>
        <span className={css.row}>
          <input className={css.input} readOnly value={code} spellCheck={false} />
          <button
            type="button"
            className={css.copy}
            onClick={() => void copy(code, "code")}
          >
            {copied === "code" ? t("copied") : t("copy")}
          </button>
        </span>
      </label>
      <label className={css.field}>
        <span className={css.label}>{t("linkLabel")}</span>
        <span className={css.row}>
          <input className={css.input} readOnly value={url} spellCheck={false} />
          <button
            type="button"
            className={css.copy}
            onClick={() => void copy(url, "url")}
          >
            {copied === "url" ? t("copied") : t("copy")}
          </button>
        </span>
      </label>
      <p className={css.expires}>
        {t("expires", { when: formatWhen(expiresAt, locale) })}
      </p>
    </div>
  );
}
