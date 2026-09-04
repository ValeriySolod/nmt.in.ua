import { JsonLd } from "@/components/seo";
import {
  buildOrganizationJsonLd,
  buildWebApplicationJsonLd,
  buildWebsiteJsonLd,
} from "@/constants/seo";
import { CtaBanner } from "../CtaBanner";
import { Faq } from "../Faq";
import { Features } from "../Features";
import { Hero } from "../Hero";
import { LandingFooter } from "../LandingFooter";
import { LandingHeader } from "../LandingHeader";
import { Steps } from "../Steps";
import css from "../landing.module.css";

const structuredData = [
  buildWebsiteJsonLd(),
  buildOrganizationJsonLd(),
  buildWebApplicationJsonLd(),
];

export async function WelcomeLanding() {
  return (
    <div className={css.page}>
      <JsonLd data={structuredData} />
      <div className={css.decor} aria-hidden>
        <span className={css.decorGrid} />
        <span className={css.decorOrbA} />
        <span className={css.decorOrbB} />
        <span className={css.decorOrbC} />
      </div>

      <div className={css.shell}>
        <LandingHeader />
        <main>
          <Hero />
          <Features />
          <Steps />
          <Faq />
          <CtaBanner />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
