"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { VerifyEmailActionState } from "@/modules/auth/actions";
import css from "../auth.module.css";

type VerifyEmailResultProps = {
  result: Exclude<VerifyEmailActionState, { status: "idle" }>;
};

export function VerifyEmailResult({ result }: VerifyEmailResultProps) {
  const t = useTranslations("VerifyEmail");
  const router = useRouter();

  useEffect(() => {
    if (result.status !== "ok") return;
    const timer = window.setTimeout(() => router.replace("/"), 1200);
    return () => window.clearTimeout(timer);
  }, [result, router]);

  return (
    <div className={css.card}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        {result.status === "ok" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("success")}
          </p>
        ) : (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${result.code}`)}
          </p>
        )}
      </header>

      {result.status === "error" ? (
        <p className={css.switch}>
          <Link href="/register/check-email" className={css.switchLink}>
            {t("resendLink")}
          </Link>
          {" · "}
          <Link href="/login" className={css.switchLink}>
            {t("backToLogin")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
