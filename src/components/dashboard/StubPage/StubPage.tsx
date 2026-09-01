import Link from "next/link";
import { PageFrame, SoonCard } from "@/components/dashboard/PageFrame";
import css from "./StubPage.module.css";

type StubPageProps = {
  title: string;
  description: string;
};

export function StubPage({ title, description }: StubPageProps) {
  return (
    <PageFrame kicker="Незабаром" title={title} lead={description}>
      <div className={css.preview} aria-hidden>
        <div className={css.skeleton} />
        <div className={css.skeleton} />
        <div className={css.skeletonWide} />
      </div>

      <SoonCard
        title="Розділ у розробці"
        description="Поки що тренуйтеся на головній: тест за темою, Ultimate-режим і перегляд результатів уже доступні."
      />

      <Link href="/" className={css.cta}>
        Перейти до тесту за темою
      </Link>
    </PageFrame>
  );
}
