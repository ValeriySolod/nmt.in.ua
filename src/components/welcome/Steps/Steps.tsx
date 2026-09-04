import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import css from "../landing.module.css";

const STEP_KEYS = ["signup", "diagnose", "train", "track"] as const;

export async function Steps() {
  const t = await getTranslations("WelcomeLanding.steps");

  return (
    <section id="steps" className={css.section} aria-labelledby="steps-title">
      <div className={css.container}>
        <Reveal className={css.sectionHead}>
          <p className={css.kicker}>{t("kicker")}</p>
          <h2 id="steps-title" className={css.sectionTitle}>
            {t("title")}
          </h2>
          <p className={css.sectionLead}>{t("lead")}</p>
        </Reveal>

        <ol className={`${css.grid} ${css.gridFour} ${css.steps}`}>
          {STEP_KEYS.map((key, index) => (
            <Reveal as="li" key={key} delay={index * 80}>
              <div className={css.step}>
                <span className={css.stepNum} aria-hidden>
                  {index + 1}
                </span>
                <h3 className={css.cardTitle}>{t(`items.${key}.title`)}</h3>
                <p className={css.cardText}>{t(`items.${key}.text`)}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
