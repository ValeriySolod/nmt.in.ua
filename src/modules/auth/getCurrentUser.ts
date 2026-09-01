import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthUser, UserRole } from "./types";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SEC,
} from "./sessionToken";
import { findUserById } from "./users";
import { verifySessionToken } from "./sessionToken";

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Returns the logged-in user or null. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const payload = await getSessionPayload();
  if (!payload) return null;
  return findUserById(payload.userId);
}

/** Returns user id or null — for optional auth contexts. */
export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/** Redirects to /login when unauthenticated. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireUserId(): Promise<number> {
  const user = await requireUser();
  return user.id;
}

export async function requireRole(roles: UserRole[]): Promise<AuthUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/");
  }
  return user;
}

export async function setSessionCookie(user: AuthUser): Promise<void> {
  const token = await createSessionToken(user.id, user.role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
