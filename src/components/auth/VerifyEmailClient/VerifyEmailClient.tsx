"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { verifyEmailAction } from "@/modules/auth/actions";
import css from "../auth.module.css";

type VerifyEmailClientProps = {
  token: string;
};

export function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const t = useTranslations("VerifyEmail");
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "ok" | "error">("pending");
  const [errorCode, setErrorCode] = useState<string>("generic");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!token) {
        if (!cancelled) {
          setStatus("error");
          setErrorCode("invalid");
        }
        return;
      }
      const result = await verifyEmailAction(token);
      if (cancelled) return;
      if (result.status === "ok") {
        setStatus("ok");
        window.setTimeout(() => router.replace("/"), 1200);
        return;
      }
      setStatus("error");
      setErrorCode(result.code);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, router]);

  return (
    <div className={css.card}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        {status === "pending" ? <p className={css.lead}>{t("pending")}</p> : null}
        {status === "ok" ? (
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("success")}
          </p>
        ) : null}
        {status === "error" ? (
          <p className={clsx(css.alert, css.alertError)} role="alert">
            {t(`errors.${errorCode}`)}
          </p>
        ) : null}
      </header>

      {status === "error" ? (
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
