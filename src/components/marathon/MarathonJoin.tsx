import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { registerMarathonAction } from "@/modules/marathons/daily/actions";
import type { UtmParams } from "@/modules/marathons/daily/utm";
import { marathonErrorText } from "./errors";
import { UtmFields } from "./UtmFields";
import css from "./marathon.module.css";

type MarathonJoinProps = {
  slug: string;
  title: string;
  utm: UtmParams;
  error?: string;
};

export async function MarathonJoin({ slug, title, utm, error }: MarathonJoinProps) {
  const t = await getTranslations("Marathon");
  const message = marathonErrorText(t, error);
  return (
    <div className={css.stack}>
      <p className={css.kicker}>{t("kicker")}</p>
      <h1 className={css.title}>{t("joinTitle")}</h1>
      <p className={css.lead}>{t("joinLead", { title })}</p>
      {/* TODO(marathon): Google sign-in is not in this repo. Add it next to
          this form when an OAuth provider exists; email registration stays. */}
      {message ? <p className={css.alert} role="alert">{message}</p> : null}
      <form action={registerMarathonAction} className={css.form}>
        <input type="hidden" name="slug" value={slug} />
        <UtmFields utm={utm} />
        <label className={css.field}>
          <span>{t("name")}</span>
          <input className={css.input} name="name" autoComplete="name" required minLength={2} maxLength={100} />
        </label>
        <label className={css.field}>
          <span>{t("email")}</span>
          <input className={css.input} name="email" type="email" autoComplete="email" spellCheck={false} required />
        </label>
        <label className={css.field}>
          <span>{t("password")}</span>
          <input className={css.input} name="password" type="password" autoComplete="new-password" required minLength={8} />
        </label>
        <label className={css.field}>
          <span>{t("passwordConfirm")}</span>
          <input className={css.input} name="passwordConfirm" type="password" autoComplete="new-password" required minLength={8} />
        </label>
        <button type="submit" className={css.button}>{t("join")}</button>
      </form>
      <p className={css.meta}>
        <Link href={`/login?next=${encodeURIComponent(`/marathon/${slug}/map`)}`}>{t("haveAccount")}</Link>
      </p>
    </div>
  );
}
