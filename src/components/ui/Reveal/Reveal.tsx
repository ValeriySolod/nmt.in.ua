"use client";

import { createElement, useCallback } from "react";
import type { CSSProperties, ReactNode } from "react";
import css from "./Reveal.module.css";

type RevealTag = "div" | "span" | "li" | "section" | "article" | "header";

type RevealProps = {
  children: ReactNode;
  /** Element to render. Keeps list/section semantics intact. */
  as?: RevealTag;
  /** Stagger offset in milliseconds. */
  delay?: number;
  className?: string;
};

const REVEAL_MARGIN = "0px 0px -12% 0px";

export function Reveal({
  children,
  as = "div",
  delay = 0,
  className,
}: RevealProps) {
  const attach = useCallback((node: HTMLElement | null) => {
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      node.classList.add(css.shown);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.classList.add(css.shown);
          observer.disconnect();
        }
      },
      { rootMargin: REVEAL_MARGIN, threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref: attach,
      className: [css.reveal, className].filter(Boolean).join(" "),
      style: { "--reveal-delay": `${delay}ms` } as CSSProperties,
    },
    children,
  );
}
