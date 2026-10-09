import { isMarathonCronAuthorized, runMarathonNotifications } from "@/modules/marathons/daily/notificationsJob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!isMarathonCronAuthorized(request.headers.get("authorization"))) {
    return new Response(null, { status: 401 });
  }
  try {
    const result = await runMarathonNotifications();
    return Response.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("marathon notifications", error);
    return new Response(null, { status: 500 });
  }
}
