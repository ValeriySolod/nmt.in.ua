"use client";

import { useRef, type KeyboardEvent } from "react";
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveTo(index: number) {
    const option = options[index];
    if (!option || disabled) return;
    onChange(option.id);
    tabRefs.current[index]?.focus();
  }

  const selectedIndex = options.findIndex((option) => option.id === value);
  const focusIndex = selectedIndex >= 0 ? selectedIndex : 0;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled || options.length === 0) return;

    const current = focusIndex;
    const last = options.length - 1;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveTo(current >= last ? 0 : current + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveTo(current <= 0 ? last : current - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveTo(last);
    }
  }

  return (
    <div
      className={clsx(css.tabs, stretch && css.tabsStretch, className)}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      {options.map((option, index) => {
        const active = value === option.id;
        const isUltimate = option.tone === "ultimate";
        return (
          <button
            key={option.id}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={index === focusIndex ? 0 : -1}
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
