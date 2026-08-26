"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { DASHBOARD_NAV } from "@/constants/navigation";
import css from "./AppSidebar.module.css";

type AppSidebarProps = {
  open: boolean;
  onNavigate: () => void;
};

const NAV_ICONS: Record<string, string> = {
  "/": "∑",
  "/results": "%",
  "/sessions": "⏱",
  "/simulator": "◎",
  "/materials": "▣",
  "/problems": "ƒ",
  "/settings": "⚙",
  "/consultations": "✉",
};

export function AppSidebar({ open, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="dashboard-sidebar"
      className={clsx(css.sidebar, open ? css.open : css.closed)}
      aria-label="Навігація дашборду"
      aria-hidden={!open}
      inert={!open}
    >
      <div className={css.scrollInner}>
        <div className={css.decor} aria-hidden />

        <div className={css.top}>
          <p className={css.kicker}>Меню навчання</p>
          <p className={css.hint}>Обирай розділ і тренуйся системно</p>
        </div>

        <nav className={css.nav}>
          <ul className={css.list}>
            {DASHBOARD_NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={clsx(css.link, active && css.active)}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    tabIndex={open ? undefined : -1}
                  >
                    <span className={css.icon} aria-hidden>
                      {NAV_ICONS[item.href] ?? "•"}
                    </span>
                    <span className={css.label}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={css.footerCard} aria-hidden>
          <span className={css.footerFormula}>a² + b² = c²</span>
          <span className={css.footerNote}>Формули поруч — прогрес попереду</span>
        </div>
      </div>
    </aside>
  );
}
