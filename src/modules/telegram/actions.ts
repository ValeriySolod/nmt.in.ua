"use server";

import { createLinkForCurrentUser } from "./createLinkForCurrentUser";

export type TelegramLinkActionState =
  | { status: "idle" }
  | { status: "success"; url: string }
  | { status: "error" };

export async function createTelegramLinkAction(
  _previous: TelegramLinkActionState,
): Promise<TelegramLinkActionState> {
  return createLinkForCurrentUser();
}
