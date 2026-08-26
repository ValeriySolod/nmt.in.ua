"use client";

import Link from "next/link";
import { SITE_NAME } from "@/constants/seo";
import { PLACEHOLDER_USER } from "@/constants/navigation";
import css from "./AppHeader.module.css";

type AppHeaderProps = {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
};

export function AppHeader({ onToggleSidebar, sidebarOpen }: AppHeaderProps) {
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
            <span className={css.brandSub}>математика · практика · прогрес</span>
          </span>
        </Link>

        <div className={css.profile} title={PLACEHOLDER_USER.displayName}>
          <span className={css.avatar} aria-hidden>
            {PLACEHOLDER_USER.initials}
          </span>
          <span className={css.profileMeta}>
            <span className={css.profileName}>{PLACEHOLDER_USER.displayName}</span>
            <span className={css.profileRole}>Учень</span>
          </span>
        </div>
      </div>
    </header>
  );
}
