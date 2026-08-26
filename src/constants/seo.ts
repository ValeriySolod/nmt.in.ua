import type { Metadata } from "next";

export const SITE_NAME = "Підготовка до НМТ";
export const SITE_TAGLINE = "Тренажер і практика з математики для НМТ";

export const SITE_DESCRIPTION =
  "Онлайн-підготовка до НМТ з математики: тести за темами, результати, симулятор і навчальні матеріали. Зручний дашборд для системних тренувань.";

export const SITE_KEYWORDS = [
  "НМТ",
  "НМТ 2026",
  "підготовка до НМТ",
  "математика",
  "тести НМТ",
  "тренажер НМТ",
  "УЦОЯО",
];

export const DEFAULT_SITE_URL = "https://nmt.in.ua";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return DEFAULT_SITE_URL;
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;
  const isHome = path === "/" || path === "";

  return {
    title: isHome ? { absolute: fullTitle } : title,
    description,
    keywords: SITE_KEYWORDS,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "uk_UA",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}
