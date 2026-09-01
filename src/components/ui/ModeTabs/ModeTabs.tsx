"use client";

import clsx from "clsx";
import css from "./ModeTabs.module.css";

export type ModeTabOption<T extends string> = {
  id: T;
  label: string;
  tone?: "default" | "ultimate";
};

type ModeTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ModeTabOption<T>[];
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
  /** Equal-width tabs in one row. */
  stretch?: boolean;
};

export function ModeTabs<T extends string>({
  value,
  onChange,
  options,
  disabled = false,
  ariaLabel,
  className,
  stretch = false,
}: ModeTabsProps<T>) {
  return (
    <div
      className={clsx(css.tabs, stretch && css.tabsStretch, className)}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const active = value === option.id;
        const isUltimate = option.tone === "ultimate";
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={clsx(
              css.tab,
              active && css.tabActive,
              isUltimate && css.tabUltimate,
            )}
            onClick={() => onChange(option.id)}
            disabled={disabled}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
