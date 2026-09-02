import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const locales = ["uk", "en", "de"] as const;
type Locale = (typeof locales)[number];

const DEFAULT_LOCALE: Locale = "uk";
const LOCALE_COOKIE = "NEXT_LOCALE";

function isSupportedLocale(value: string | undefined): value is Locale {
  return locales.includes(value as Locale);
}

function getBrowserLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const languages = acceptLanguage
    .split(",")
    .map((item) => item.split(";")[0]?.trim().toLowerCase());

  for (const language of languages) {
    const locale = language?.split("-")[0];

    if (isSupportedLocale(locale)) {
      return locale;
    }
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;

  const locale = isSupportedLocale(cookieLocale)
    ? cookieLocale
    : getBrowserLocale(headerStore.get("accept-language"));

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
