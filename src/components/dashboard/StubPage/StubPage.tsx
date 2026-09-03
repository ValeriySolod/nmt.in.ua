import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageFrame, SoonCard } from "@/components/dashboard/PageFrame";
import css from "./StubPage.module.css";

type StubPageProps = {
  title: string;
  description: string;
};

export async function StubPage({ title, description }: StubPageProps) {
  const t = await getTranslations("StubPage");
  const common = await getTranslations("Common");

  return (
    <PageFrame kicker={common("soon")} title={title} lead={description}>
      <div className={css.preview} aria-hidden>
        <div className={css.skeleton} />
        <div className={css.skeleton} />
        <div className={css.skeletonWide} />
      </div>

      <SoonCard
        title={t("developmentTitle")}
        description={t("developmentDescription")}
      />

      <Link href="/" className={css.cta}>
        {t("goToTest")}
      </Link>
    </PageFrame>
  );
}
