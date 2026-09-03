"use server";

import { redirect } from "next/navigation";

import { verifyPassword } from "./password";
import {
  clearSessionCookie,
  requireUser,
  setSessionCookie,
} from "./getCurrentUser";
import { findUserByLogin } from "./users";

export type LoginErrorCode = "requiredFields" | "invalidCredentials";

export type LoginActionState =
  | { status: "idle" }
  | { status: "error"; code: LoginErrorCode };

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/").trim() || "/";

  if (!login || !password) {
    return { status: "error", code: "requiredFields" };
  }

  const user = await findUserByLogin(login);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { status: "error", code: "invalidCredentials" };
  }

  await setSessionCookie(user);
  redirect(nextPath.startsWith("/") ? nextPath : "/");
}

export async function demoLoginAction(
  login: string,
  nextPath = "/",
): Promise<void> {
  const user = await findUserByLogin(login);
  if (!user) {
    redirect("/login");
  }
  await setSessionCookie(user);
  redirect(nextPath.startsWith("/") ? nextPath : "/");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export async function logoutActionFromHeader(): Promise<void> {
  await requireUser();
  await clearSessionCookie();
  redirect("/login");
}
