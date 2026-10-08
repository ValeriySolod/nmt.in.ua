import { verifyUnsubscribeToken } from "@/modules/marathons/daily/notifications";
import { unsubscribeSecret } from "@/modules/marathons/daily/notificationsJob";
import { silenceEmail } from "@/modules/marathons/daily/store";

export const dynamic = "force-dynamic";

function page(ok: boolean): Response {
  const text = ok
    ? "Листи марафону вимкнено. Повернути їх можна в кабінеті марафону."
    : "Посилання недійсне. Вимкнути листи можна в кабінеті марафону.";
  const html = `<!doctype html><html lang="uk"><meta charset="utf-8"><title>${text}</title><body style="font-family:sans-serif;background:#efe8d7;color:#1f2320;padding:2rem"><p>${text}</p><p><a href="https://nmt.in.ua/">nmt.in.ua</a></p></body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const marathonId = Number(url.searchParams.get("m"));
  const userId = Number(url.searchParams.get("u"));
  const token = url.searchParams.get("t") ?? "";
  const secret = unsubscribeSecret();
  if (!secret || !Number.isInteger(marathonId) || !Number.isInteger(userId)) return page(false);
  if (!verifyUnsubscribeToken(marathonId, userId, token, secret)) return page(false);
  const updated = await silenceEmail(marathonId, userId);
  return page(updated);
}
