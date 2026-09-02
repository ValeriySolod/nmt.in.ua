"use server";

import { cookies } from "next/headers";

type Locale = "uk" | "en" | "de";

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();

  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
