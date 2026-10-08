import { parseUnlockHour } from "./calendar";
import { loomEmbedSrc, youtubeEmbedSrc } from "./richText";
import type { DailyStatus, MaterialType } from "./store";
import { normalizeCtaUrl, readUtm, serializeUtm, type UtmParams } from "./utm";

export function readText(raw: FormDataEntryValue | null, max: number): string {
  return String(raw ?? "").trim().slice(0, max);
}

export function readInt(raw: FormDataEntryValue | null): number | null {
  const value = Number(String(raw ?? "").trim());
  return Number.isInteger(value) ? value : null;
}

export function isSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 64;
}

export function isDailyStatus(value: string): value is DailyStatus {
  return value === "draft" || value === "active" || value === "finished";
}

export type MarathonInput = {
  slug: string;
  title: string;
  subject: string;
  startDate: string;
  unlockHour: string;
  daysCount: number;
  passThreshold: number;
  finalCtaText: string;
  finalCtaUrl: string;
};

export function parseMarathonInput(
  formData: FormData,
): { ok: true; value: MarathonInput } | { ok: false } {
  const slug = readText(formData.get("slug"), 64).toLowerCase();
  const title = readText(formData.get("title"), 255);
  const subject = readText(formData.get("subject"), 64) || "math";
  const startDate = readText(formData.get("startDate"), 10);
  const unlockHour = readText(formData.get("unlockHour"), 5);
  const daysCount = readInt(formData.get("daysCount"));
  const passThreshold = readInt(formData.get("passThreshold"));
  const finalCtaText = readText(formData.get("finalCtaText"), 500);
  const finalCtaUrl = normalizeCtaUrl(readText(formData.get("finalCtaUrl"), 500));
  if (!isSlug(slug) || title.length < 2) return { ok: false };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !parseUnlockHour(unlockHour)) {
    return { ok: false };
  }
  if (daysCount == null || daysCount < 1 || daysCount > 14) return { ok: false };
  if (passThreshold == null || passThreshold < 0 || passThreshold > 100) {
    return { ok: false };
  }
  if (!finalCtaText || !finalCtaUrl) return { ok: false };
  return {
    ok: true,
    value: {
      slug,
      title,
      subject,
      startDate,
      unlockHour,
      daysCount,
      passThreshold,
      finalCtaText,
      finalCtaUrl,
    },
  };
}

export function parseMaterial(
  formData: FormData,
): { order: number; type: MaterialType; urlOrBody: string } | null {
  const type = readText(formData.get("materialType"), 16);
  const urlOrBody = readText(formData.get("urlOrBody"), 20_000);
  const order = readInt(formData.get("order")) ?? 1;
  if (order < 1 || order > 50 || !urlOrBody) return null;
  if (type === "text") return { order, type, urlOrBody };
  if (type === "youtube" && youtubeEmbedSrc(urlOrBody)) {
    return { order, type, urlOrBody };
  }
  if (type === "loom" && loomEmbedSrc(urlOrBody)) {
    return { order, type, urlOrBody };
  }
  return null;
}

export function utmFromForm(formData: FormData): UtmParams {
  return readUtm({
    utm_source: readText(formData.get("utm_source"), 80),
    utm_medium: readText(formData.get("utm_medium"), 80),
    utm_campaign: readText(formData.get("utm_campaign"), 80),
    utm_content: readText(formData.get("utm_content"), 80),
    utm_term: readText(formData.get("utm_term"), 80),
  });
}

export function utmJsonFromForm(formData: FormData): string | null {
  return serializeUtm(utmFromForm(formData));
}

export function answersFromForm(formData: FormData): Record<number, number> {
  const answers: Record<number, number> = {};
  for (const [key, value] of formData.entries()) {
    const match = /^task_(\d+)$/.exec(key);
    if (!match) continue;
    const taskId = Number(match[1]);
    const choice = Number(value);
    if (Number.isInteger(taskId) && Number.isInteger(choice) && choice > 0) {
      answers[taskId] = choice;
    }
  }
  return answers;
}

export function isDuplicateKey(error: unknown): boolean {
  return (error as { errno?: number }).errno === 1062;
}
