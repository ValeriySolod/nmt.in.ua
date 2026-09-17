"use client";

import { StatusErrorView } from "@/components/status/StatusErrorView";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="uk">
      <body>
        <StatusErrorView error={error} reset={reset} />
      </body>
    </html>
  );
}
