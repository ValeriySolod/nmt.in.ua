"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusScene } from "@/components/status/StatusScene";
import {
  readStatusLocaleFromCookie,
  statusCopy,
} from "@/i18n/statusPages";

type AppError = Error & { digest?: string };

export function StatusErrorView({
  error,
  reset,
  layout = "page",
}: {
  error: AppError;
  reset: () => void;
  layout?: "page" | "embed";
}) {
  const [locale, setLocale] = useState("uk");

  useEffect(() => {
    setLocale(readStatusLocaleFromCookie(document.cookie));
    console.error(error);
  }, [error]);

  const copy = useMemo(() => statusCopy(locale), [locale]);

  return (
    <StatusScene
      variant="error"
      copy={copy}
      layout={layout}
      reset={reset}
      digest={error.digest}
    />
  );
}
