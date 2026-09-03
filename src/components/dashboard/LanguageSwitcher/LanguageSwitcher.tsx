"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/i18n/actions";
import css from "./LanguageSwitcher.module.css";

const locales = ["uk", "en", "de"] as const;

type Locale = (typeof locales)[number];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  async function changeLocale(nextLocale: Locale) {
    await setLocale(nextLocale);
    router.refresh();
  }

  return (
    <div className={css.switcher} aria-label="Language">
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          className={css.button}
          data-active={locale === item}
          onClick={() => changeLocale(item)}
          disabled={locale === item}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
