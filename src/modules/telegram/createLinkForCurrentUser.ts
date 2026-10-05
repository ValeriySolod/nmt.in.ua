import "server-only";

import { requireUser } from "@/modules/auth/getCurrentUser";
import { readTelegramConfig } from "./config";
import { createTelegramLink } from "./link";

export async function createLinkForCurrentUser(
  deps: {
    requireUser: typeof requireUser;
    readConfig: typeof readTelegramConfig;
    createLink: typeof createTelegramLink;
  } = { requireUser, readConfig: readTelegramConfig, createLink: createTelegramLink },
): Promise<{ status: "success"; url: string } | { status: "error" }> {
  const user = await deps.requireUser();
  try {
    const { botUsername } = deps.readConfig();
    return { status: "success", url: await deps.createLink(user.id, botUsername) };
  } catch {
    return { status: "error" };
  }
}
