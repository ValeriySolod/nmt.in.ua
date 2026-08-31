import css from "./StubPage.module.css";

type StubPageProps = {
  title: string;
  description: string;
};

export function StubPage({ title, description }: StubPageProps) {
  return (
    <section className={css.section} aria-labelledby="stub-title">
      <header className={css.intro}>
        <p className={css.badge}>Незабаром</p>
        <h1 id="stub-title" className={css.title}>
          {title}
        </h1>
        <p className={css.lead}>{description}</p>
      </header>

      <div className={css.card} aria-hidden>
        <div className={css.skeleton} />
        <div className={css.skeleton} />
        <div className={css.skeletonWide} />
      </div>

      <p className={css.hint}>
        Розділ у розробці — зміст зʼявиться в наступних ітераціях команди.
      </p>
    </section>
  );
}
