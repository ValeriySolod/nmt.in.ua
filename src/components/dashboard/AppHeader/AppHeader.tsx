"use client";

import Link from "next/link";
import type { AuthUser } from "@/modules/auth/client";
import { userInitials } from "@/modules/auth/client";
import { logoutActionFromHeader } from "@/modules/auth/actions";
import { useTranslations } from "next-intl";
import css from "./AppHeader.module.css";

type AppHeaderProps = {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  user: AuthUser;
};

export function AppHeader({
  onToggleSidebar,
  sidebarOpen,
  user,
}: AppHeaderProps) {
  const t = useTranslations("Header");
  return (
    <header className={css.header}>
      <div className={css.inner}>
        <button
          type="button"
          className={css.toggle}
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
          aria-label={sidebarOpen ? t("hideSidebar") : t("showSidebar")}
          title={sidebarOpen ? t("hideMenu") : t("showMenu")}
        >
          <span className={css.toggleGlyph} data-open={sidebarOpen} aria-hidden>
            <i />
            <i />
            <i />
          </span>
        </button>

        <Link
          href="/"
          className={css.brand}
          aria-label={t("siteName")}
        >
          <span className={css.logo} aria-hidden>
            <span className={css.logoEq}>∑</span>
          </span>
          <span className={css.brandCopy}>
            <span className={css.brandText}>{t("siteName")}</span>
            <span className={css.brandSub}>{t("tagline")}</span>
          </span>
        </Link>

        <div className={css.actions}>
          <Link href="/welcome" className={css.homeLink}>
            <span className={css.homeLinkShort}>{t("goHomeShort")}</span>
            <span className={css.homeLinkFull}>{t("goHome")}</span>
          </Link>
          <form action={logoutActionFromHeader} className={css.profileForm}>
            <button
              type="submit"
              className={css.profile}
              title={`${user.displayName} — ${t("logout")}`}
            >
              <span className={css.avatar} aria-hidden>
                {userInitials(user.displayName)}
              </span>
              <span className={css.profileMeta}>
                <span className={css.profileName}>{user.displayName}</span>
                <span className={css.profileRole}>
                  {t(`roles.${user.role}`)}
                </span>
              </span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
