import { getTranslations } from "next-intl/server";
import Link from "next/link";
import clsx from "clsx";
import css from "../auth.module.css";

type VerifyEmailErrorCode = "invalid" | "expired" | "used" | "generic";

type VerifyEmailResultProps = {
  code: VerifyEmailErrorCode;
};

export async function VerifyEmailResult({ code }: VerifyEmailResultProps) {
  const t = await getTranslations("VerifyEmail");

  return (
    <div className={css.card}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        <p className={clsx(css.alert, css.alertError)} role="alert">
          {t(`errors.${code}`)}
        </p>
      </header>

      <p className={css.switch}>
        <Link href="/register/check-email" className={css.switchLink}>
          {t("resendLink")}
        </Link>
        {" · "}
        <Link href="/login" className={css.switchLink}>
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
