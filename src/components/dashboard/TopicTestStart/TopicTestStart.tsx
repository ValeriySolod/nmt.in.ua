import css from "./TopicTestStart.module.css";

/** Starting shell for “Тест за обраною темою” — controls are placeholders for now. */
export function TopicTestStart() {
  return (
    <section className={css.section} aria-labelledby="topic-test-title">
      <header className={css.intro}>
        <h1 id="topic-test-title" className={css.title}>
          Тест за обраною темою
        </h1>
        <p className={css.lead}>
          Оберіть тему й кількість завдань — повна логіка тесту підключиться
          наступними ітераціями.
        </p>
      </header>

      <div className={css.controls}>
        <label className={css.field}>
          <span className={css.label}>Обери тему</span>
          <select className={css.select} defaultValue="1" disabled>
            <option value="1">1. Елементарна математика</option>
            <option value="2">2. Арифметичні дії</option>
            <option value="3">3. Елементарна планіметрія</option>
          </select>
        </label>

        <label className={css.field}>
          <span className={css.label}>Пройти завдань</span>
          <input
            className={css.input}
            type="number"
            min={1}
            max={30}
            defaultValue={10}
            disabled
            aria-label="Кількість завдань"
          />
        </label>

        <button type="button" className={css.start} disabled>
          Старт
        </button>
      </div>

      <article className={css.preview} aria-label="Приклад картки завдання">
        <h2 className={css.previewTitle}>Назва завдання</h2>
        <p className={css.previewText}>
          Опис тексту завдання, у тому числі формули — тут зʼявиться контент
          банку питань.
        </p>
        <div className={css.answers}>
          <button type="button" className={css.answer} disabled>
            Відповідь №1
          </button>
          <button type="button" className={css.answer} disabled>
            Відповідь №2
          </button>
          <button type="button" className={css.answer} disabled>
            Відповідь №3
          </button>
          <button type="button" className={css.answer} disabled>
            Відповідь №4
          </button>
        </div>
      </article>

      <dl className={css.stats}>
        <div>
          <dt>Правильних відповідей</dt>
          <dd>9 з 10 · краще ніж 80%</dd>
        </div>
        <div>
          <dt>Середній час відповіді</dt>
          <dd>5,6 с · краще ніж 70%</dd>
        </div>
      </dl>
    </section>
  );
}
