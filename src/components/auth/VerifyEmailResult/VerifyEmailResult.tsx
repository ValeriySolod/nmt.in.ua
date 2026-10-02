import { getTranslations } from "next-intl/server";
import Link from "next/link";
import clsx from "clsx";
import { ResendVerificationForm } from "../ResendVerificationForm/ResendVerificationForm";
import css from "../auth.module.css";

type VerifyEmailErrorCode = "invalid" | "expired" | "used" | "generic";

type VerifyEmailResultProps =
  | { status: "success" }
  | { status: "error"; code: VerifyEmailErrorCode };

export async function VerifyEmailResult(props: VerifyEmailResultProps) {
  const t = await getTranslations("VerifyEmail");

  if (props.status === "success") {
    return (
      <div className={css.card}>
        <header className={css.intro}>
          <p className={css.kicker}>{t("kicker")}</p>
          <h1 className={css.title}>{t("title")}</h1>
          <p className={clsx(css.alert, css.alertSuccess)} role="status">
            {t("success")}
          </p>
          <p className={css.lead}>{t("successLead")}</p>
        </header>
        <div className={css.actions}>
          <Link href="/" className={css.submit}>
            {t("goToCabinet")}
          </Link>
          <Link href="/login" className={css.submitQuiet}>
            {t("goToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={css.card}>
      <header className={css.intro}>
        <p className={css.kicker}>{t("kicker")}</p>
        <h1 className={css.title}>{t("title")}</h1>
        <p className={clsx(css.alert, css.alertError)} role="alert">
          {t(`errors.${props.code}`)}
        </p>
        <p className={css.lead}>{t("resendLead")}</p>
      </header>

      <ResendVerificationForm />

      <p className={css.switch}>
        <Link href="/login" className={css.switchLink}>
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
