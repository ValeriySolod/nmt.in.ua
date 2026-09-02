"use client";

import Link from "next/link";
import { SITE_NAME } from "@/constants/seo";
import type { AuthUser } from "@/modules/auth/client";
import { roleLabel, userInitials } from "@/modules/auth/client";
import { logoutActionFromHeader } from "@/modules/auth/actions";
import { LanguageSwitcher } from "@/components/dashboard/LanguageSwitcher/LanguageSwitcher";
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
  return (
    <header className={css.header}>
      <div className={css.wash} aria-hidden />
      <div className={css.ribbon} aria-hidden />

      <div className={css.inner}>
        <button
          type="button"
          className={css.toggle}
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
          aria-label={sidebarOpen ? "Сховати сайдбар" : "Показати сайдбар"}
          title={sidebarOpen ? "Сховати меню" : "Показати меню"}
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
          aria-label={`${SITE_NAME} — на головну`}
        >
          <span className={css.logo} aria-hidden>
            <span className={css.logoEq}>∑</span>
          </span>
          <span className={css.brandCopy}>
            <span className={css.brandText}>{SITE_NAME}</span>
            <span className={css.brandSub}>
              математика · практика · прогрес
            </span>
          </span>
        </Link>

        <div className={css.actions}>
          <LanguageSwitcher />
          <form action={logoutActionFromHeader} className={css.profileForm}>
            <button
              type="submit"
              className={css.profile}
              title={`${user.displayName} — вийти`}
            >
              <span className={css.avatar} aria-hidden>
                {userInitials(user.displayName)}
              </span>
              <span className={css.profileMeta}>
                <span className={css.profileName}>{user.displayName}</span>
                <span className={css.profileRole}>{roleLabel(user.role)}</span>
              </span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
