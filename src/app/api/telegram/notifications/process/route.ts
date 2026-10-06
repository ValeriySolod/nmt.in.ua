import { handleNotificationTrigger } from "@/modules/telegram/notificationTrigger";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleNotificationTrigger(request);
}
