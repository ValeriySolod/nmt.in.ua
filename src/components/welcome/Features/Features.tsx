import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import landing from "../landing.module.css";
import css from "./Features.module.css";

const FEATURE_KEYS = [
  "topics",
  "simulator",
  "materials",
  "results",
  "recommendations",
  "sessions",
] as const;

const BOOK_SLOT = [
  "slotA",
  "slotB",
  "slotC",
  "slotD",
  "slotE",
  "slotF",
] as const;

const CLOSED_SLOTS = ["closedA", "closedB", "closedC", "closedD"] as const;

export async function Features() {
  const t = await getTranslations("WelcomeLanding.features");

  return (
    <section
      id="features"
      className={landing.section}
      aria-labelledby="features-title"
    >
      <div className={landing.container}>
        <Reveal className={landing.sectionHead}>
          <p className={landing.kicker}>{t("kicker")}</p>
          <h2 id="features-title" className={landing.sectionTitle}>
            {t("title")}
          </h2>
          <p className={landing.sectionLead}>{t("lead")}</p>
        </Reveal>

        <Reveal className={css.stage}>
          <div className={css.scatter} aria-hidden>
            {CLOSED_SLOTS.map((slot) => (
              <span key={slot} className={`${css.closedBook} ${css[slot]}`}>
                <span className={css.closedPages} />
                <span className={css.closedCover} />
              </span>
            ))}
          </div>

          <div className={css.stationery} aria-hidden>
            <span className={`${css.pencil} ${css.pencilA}`} />
            <span className={`${css.pencil} ${css.pencilB}`} />
            <span className={`${css.pen} ${css.penA}`} />
            <span className={`${css.pen} ${css.penB}`} />
            <span className={`${css.ruler} ${css.rulerA}`} />
            <span className={`${css.triangle} ${css.triangleA}`} />
            <span className={`${css.compass} ${css.compassA}`}>
              <span className={css.compassLeg} />
              <span className={css.compassLegAlt} />
              <span className={css.compassKnob} />
            </span>
          </div>

          <div className={css.studentWrap}>
            <Image
              className={css.student}
              src="/landing/features-student.webp"
              alt={t("imageAlt")}
              width={864}
              height={1152}
              sizes="(min-width: 1240px) 28rem, (min-width: 768px) 24rem, 18rem"
              priority={false}
            />
          </div>

          <ul className={css.openBooks}>
            {FEATURE_KEYS.map((key, index) => (
              <li
                key={key}
                className={`${css.openBook} ${css[BOOK_SLOT[index]]}`}
              >
                <div className={css.spread} aria-hidden>
                  <span className={css.pageSheet} />
                </div>
                <div className={css.openBookCopy}>
                  <h3 className={css.bookTitle}>{t(`items.${key}.title`)}</h3>
                  <p className={css.bookText}>{t(`items.${key}.text`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
