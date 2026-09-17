"use client";

import { createElement, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { revealHidden, revealShown, tweenSlow } from "@/lib/motionPresets";
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

const TAGS = {
  div: motion.div,
  span: motion.span,
  li: motion.li,
  section: motion.section,
  article: motion.article,
  header: motion.header,
} as const;

export function Reveal({
  children,
  as = "div",
  delay = 0,
  className,
}: RevealProps) {
  const reduce = useReducedMotion();
  const classNames = [css.reveal, className].filter(Boolean).join(" ");

  if (reduce) {
    return createElement(as, { className: classNames }, children);
  }

  const Tag = TAGS[as];
  return (
    <Tag
      className={classNames}
      initial={revealHidden}
      whileInView={revealShown}
      viewport={{ once: true, margin: "0px 0px -12% 0px", amount: 0.05 }}
      transition={{ ...tweenSlow, delay: delay / 1000 }}
    >
      {children}
    </Tag>
  );
}
