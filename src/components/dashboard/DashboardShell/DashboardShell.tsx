"use client";

import { useEffect, useSyncExternalStore } from "react";
import clsx from "clsx";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { RecentResults } from "@/components/dashboard/RecentResults";
import type { RecentResultItem } from "@/modules/results/getRecentResults";
import css from "./DashboardShell.module.css";

const STORAGE_KEY = "nmt-sidebar-open";

type DashboardShellProps = {
  children: React.ReactNode;
  recentResults: RecentResultItem[];
};

const listeners = new Set<() => void>();

function emitSidebarChange() {
  listeners.forEach((listener) => listener());
}

function subscribeSidebar(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readSidebarOpen(): boolean {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "0") return false;
  if (saved === "1") return true;
  return window.matchMedia("(min-width: 768px)").matches;
}

function getServerSidebarOpen() {
  return true;
}

function setSidebarOpen(next: boolean | ((prev: boolean) => boolean)) {
  const value = typeof next === "function" ? next(readSidebarOpen()) : next;
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  emitSidebarChange();
}

export function DashboardShell({ children, recentResults }: DashboardShellProps) {
  const sidebarOpen = useSyncExternalStore(
    subscribeSidebar,
    readSidebarOpen,
    getServerSidebarOpen,
  );

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    document.body.style.overflow = sidebarOpen && isMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className={css.shell}>
      <AppHeader
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
      />

      {sidebarOpen ? (
        <button
          type="button"
          className={css.backdrop}
          aria-label="Сховати меню"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className={css.body}>
        <div
          className={clsx(
            css.sidebarSlot,
            sidebarOpen ? css.sidebarSlotOpen : css.sidebarSlotClosed,
          )}
        >
          <AppSidebar
            open={sidebarOpen}
            onNavigate={() => {
              if (window.matchMedia("(max-width: 767px)").matches) {
                setSidebarOpen(false);
              }
            }}
          />
        </div>

        <div className={css.content}>
          <main className={css.main}>{children}</main>
          <RecentResults items={recentResults} />
        </div>
      </div>
    </div>
  );
}
