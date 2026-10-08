import type { UtmParams } from "@/modules/marathons/daily/utm";

const KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export function UtmFields({ utm }: { utm: UtmParams }) {
  return (
    <>
      {KEYS.map((key) =>
        utm[key] ? (
          <input key={key} type="hidden" name={key} value={utm[key]} />
        ) : null,
      )}
    </>
  );
}
