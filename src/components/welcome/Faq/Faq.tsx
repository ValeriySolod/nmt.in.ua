import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo";
import { Reveal } from "@/components/ui/Reveal";
import { PlusIcon } from "../icons";
import css from "../landing.module.css";

const FAQ_KEYS = ["price", "who", "mobile", "recommendations", "teacher"] as const;

export async function Faq() {
  const t = await getTranslations("WelcomeLanding.faq");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_KEYS.map((key) => ({
      "@type": "Question",
      name: t(`items.${key}.q`),
      acceptedAnswer: { "@type": "Answer", text: t(`items.${key}.a`) },
    })),
  };

  return (
    <section id="faq" className={css.section} aria-labelledby="faq-title">
      <JsonLd data={faqJsonLd} />
      <div className={css.container}>
        <Reveal className={css.sectionHead}>
          <p className={css.kicker}>{t("kicker")}</p>
          <h2 id="faq-title" className={css.sectionTitle}>
            {t("title")}
          </h2>
          <p className={css.sectionLead}>{t("lead")}</p>
        </Reveal>

        <div className={css.faqList}>
          {FAQ_KEYS.map((key, index) => (
            <Reveal key={key} delay={index * 60}>
              <details className={css.faqItem}>
                <summary className={css.faqSummary}>
                  {t(`items.${key}.q`)}
                  <PlusIcon size={20} className={css.faqIcon} />
                </summary>
                <p className={css.faqAnswer}>{t(`items.${key}.a`)}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
