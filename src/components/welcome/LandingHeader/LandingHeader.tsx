import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher/LanguageSwitcher";
import { SITE_NAME, SITE_TAGLINE } from "@/constants/seo";
import { getCurrentUser } from "@/modules/auth/getCurrentUser";
import css from "../landing.module.css";

const NAV_ITEMS = [
  { key: "features", href: "#features" },
  { key: "steps", href: "#steps" },
  { key: "faq", href: "#faq" },
] as const;

export async function LandingHeader() {
  const t = await getTranslations("WelcomeLanding.nav");
  const user = await getCurrentUser();

  return (
    <header className={css.header}>
      <div className={`${css.container} ${css.headerInner}`}>
        <Link href={user ? "/welcome" : "/"} className={css.brand} aria-label={SITE_NAME}>
          <span className={css.brandGlyph} aria-hidden>
            ∑
          </span>
          <span className={css.brandText}>
            <span className={css.brandName}>{SITE_NAME}</span>
            <span className={css.brandTagline}>{SITE_TAGLINE}</span>
          </span>
        </Link>

        <nav className={css.headerNav} aria-label={t("sectionsAria")}>
          {NAV_ITEMS.map((item) => (
            <a key={item.key} href={item.href} className={css.headerLink}>
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className={css.headerActions}>
          <LanguageSwitcher />
          {user ? (
            <Link
              href="/"
              className={`${css.btn} ${css.btnPrimary} ${css.btnSmall}`}
            >
              {t("cabinet")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`${css.btn} ${css.btnGhost} ${css.btnSmall} ${css.headerLogin}`}
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className={`${css.btn} ${css.btnPrimary} ${css.btnSmall}`}
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
