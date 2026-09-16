"use server";

import { redirect } from "next/navigation";

import { safeInternalPath } from "@/lib/safeInternalPath";
import { claimGuestProgress } from "@/modules/diagnostic/claimGuestProgress";
import { clearGuestCookie } from "./guestToken";
import { isDemoAccountLogin, isDemoLoginEnabled } from "./demoLogin";
import { verifyPassword } from "./password";
import {
  clearSessionCookie,
  renewSessionCookie,
  requireUser,
  setSessionCookie,
} from "./getCurrentUser";
import { changePassword, ChangePasswordError } from "./changePassword";
import type { ChangePasswordErrorCode } from "./changePassword";
import {
  createUser,
  CreateUserError,
  findUserByEmail,
  findUserById,
  findUserByLogin,
  markEmailVerified,
  updateUserPassword,
} from "./users";
import { recordLoginPresence } from "./presence";
import {
  consumeAuthToken,
  countRecentAuthTokens,
} from "./authTokens";
import {
  sendEmailVerificationMail,
  sendPasswordResetMail,
} from "./emailMessages";
import { needsEmailVerification } from "./needsEmailVerification";
import {
  removeAvatar,
  uploadAvatar,
  UploadAvatarError,
  type UploadAvatarErrorCode,
} from "./avatar/upload";
import { revalidatePath } from "next/cache";
import type { AuthUser } from "./types";
import {
  normalizeEmail,
  PASSWORD_MAX_LEN,
  PASSWORD_MIN_LEN,
  validateRegistrationInput,
  type RegistrationFieldError,
} from "./validateRegistration";

export type LoginErrorCode =
  | "requiredFields"
  | "invalidCredentials"
  | "accountBanned"
  | "emailUnverified";

export type LoginActionState =
  | { status: "idle" }
  | { status: "error", code: LoginErrorCode };

export type RegisterActionState =
  | { status: "idle" }
  | { status: "error", code: RegistrationFieldError | "serverError" };

export { needsEmailVerification } from "./needsEmailVerification";

export async function loginAction(
  _prev: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextPath = safeInternalPath(formData.get("next"));

  if (!login || !password) {
    return { status: "error", code: "requiredFields" };
  }

  if (password.length > PASSWORD_MAX_LEN) {
    return { status: "error", code: "invalidCredentials" };
  }

  const user = await findUserByLogin(login);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { status: "error", code: "invalidCredentials" };
  }

  if (user.isBanned) {
    return { status: "error", code: "accountBanned" };
  }

  if (needsEmailVerification(user)) {
    return { status: "error", code: "emailUnverified" };
  }

  await recordLoginPresence(user.id);
  await setSessionCookie(user);
  redirect(nextPath);
}

/**
 * Public self-registration. Creates a student, sends verify email,
 * does **not** open a session until the email is confirmed.
 */
export async function registerAction(
  _prev: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const validated = validateRegistrationInput({
    login: String(formData.get("login") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  });

  if (!validated.ok) {
    return { status: "error", code: validated.code };
  }

  let userId: number;
  try {
    const user = await createUser({
      login: validated.value.login,
      displayName: validated.value.displayName,
      email: validated.value.email,
      password: validated.value.password,
      role: "student",
    });
    userId = user.id;
  } catch (error) {
    if (error instanceof CreateUserError && error.code === "login_taken") {
      return { status: "error", code: "loginTaken" };
    }
    if (error instanceof CreateUserError && error.code === "email_taken") {
      return { status: "error", code: "emailTaken" };
    }
    console.error("registerAction: unexpected error", error);
    return { status: "error", code: "serverError" };
  }

  if (formData.get("from") === "diagnostic") {
    try {
      const result = await claimGuestProgress(userId);
      if (result.claimed) {
        await clearGuestCookie();
      }
    } catch (error) {
      console.error("registerAction: claimGuestProgress failed", error);
    }
  }

  try {
    await sendEmailVerificationMail({
      userId,
      email: validated.value.email,
      displayName: validated.value.displayName,
    });
  } catch (error) {
    console.error("registerAction: send verify mail failed", error);
  }

  redirect(
    `/register/check-email?email=${encodeURIComponent(validated.value.email)}`,
  );
}

export async function demoLoginAction(
  login: string,
  nextPath = "/",
): Promise<void> {
  if (!isDemoLoginEnabled() || !isDemoAccountLogin(login)) {
    redirect("/login");
  }

  const user = await findUserByLogin(login);
  if (!user || user.isBanned) {
    redirect("/login");
  }
  await recordLoginPresence(user.id);
  await setSessionCookie(user);
  redirect(safeInternalPath(nextPath));
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export type ChangePasswordActionState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error", code: ChangePasswordErrorCode };

export async function changePasswordAction(
  _prev: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const user = await requireUser();

  try {
    await changePassword({
      user,
      currentPassword: String(formData.get("currentPassword") ?? ""),
      newPassword: String(formData.get("newPassword") ?? ""),
      newPasswordConfirm: String(formData.get("newPasswordConfirm") ?? ""),
    });
    return { status: "ok" };
  } catch (error) {
    if (error instanceof ChangePasswordError) {
      return { status: "error", code: error.code };
    }
    console.error("changePasswordAction: unexpected error", error);
    return { status: "error", code: "serverError" };
  }
}

/**
 * Re-issues the session cookie with displayName/login for legacy tokens.
 * Safe to call repeatedly; no-ops when the cookie is already upgraded.
 */
export async function upgradeSessionCookieAction(): Promise<{ ok: boolean }> {
  const { getSessionPayload } = await import("./getCurrentUser");
  const payload = await getSessionPayload();
  if (!payload) return { ok: false };
  if (payload.displayName && payload.login) return { ok: true };

  const user = await findUserById(payload.userId);
  if (!user) return { ok: false };
  const ok = await renewSessionCookie(user);
  return { ok };
}

export type UploadAvatarActionState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error", code: UploadAvatarErrorCode };

function profileWithoutAvatar(user: AuthUser): AuthUser {
  return {
    id: user.id,
    login: user.login,
    displayName: user.displayName,
    role: user.role,
    email: user.email,
    emailVerified: user.emailVerified,
    isBanned: user.isBanned,
  };
}

export async function uploadAvatarAction(
  _prev: UploadAvatarActionState,
  formData: FormData,
): Promise<UploadAvatarActionState> {
  const user = await requireUser();

  try {
    const avatarRev = await uploadAvatar({
      user,
      file: formData.get("avatar"),
    });
    const renewed = await renewSessionCookie({ ...user, avatarRev });
    if (!renewed) {
      console.error(
        "uploadAvatarAction: renewSessionCookie failed after a successful upload",
      );
    }
    revalidatePath("/", "layout");
    return { status: "ok" };
  } catch (error) {
    if (error instanceof UploadAvatarError) {
      return { status: "error", code: error.code };
    }
    console.error("uploadAvatarAction: unexpected error", error);
    return { status: "error", code: "serverError" };
  }
}

export async function removeAvatarAction(
  _prev: UploadAvatarActionState,
  _formData: FormData,
): Promise<UploadAvatarActionState> {
  const user = await requireUser();

  try {
    await removeAvatar(user);
    const renewed = await renewSessionCookie(profileWithoutAvatar(user));
    if (!renewed) {
      console.error(
        "removeAvatarAction: renewSessionCookie failed after a successful removal",
      );
    }
    revalidatePath("/", "layout");
    return { status: "ok" };
  } catch (error) {
    if (error instanceof UploadAvatarError) {
      return { status: "error", code: error.code };
    }
    console.error("removeAvatarAction: unexpected error", error);
    return { status: "error", code: "serverError" };
  }
}

export type ResendVerifyActionState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error", code: "invalid_email" | "rate_limited" | "generic" };

export async function resendVerificationAction(
  _prev: ResendVerifyActionState,
  formData: FormData,
): Promise<ResendVerifyActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { status: "error", code: "invalid_email" };

  const user = await findUserByEmail(email);
  if (!user || user.emailVerified || user.isBanned) {
    return { status: "ok" };
  }

  const recent = await countRecentAuthTokens(
    user.id,
    "email_verify",
    15 * 60 * 1000,
  );
  if (recent >= 3) {
    return { status: "error", code: "rate_limited" };
  }

  try {
    await sendEmailVerificationMail({
      userId: user.id,
      email: user.email ?? email,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error("resendVerificationAction failed", error);
    return { status: "error", code: "generic" };
  }
  return { status: "ok" };
}

export type VerifyEmailActionState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error", code: "invalid" | "expired" | "used" | "generic" };

export async function verifyEmailAction(
  token: string,
): Promise<VerifyEmailActionState> {
  try {
    const consumed = await consumeAuthToken(token, "email_verify");
    if (!consumed.ok) {
      return { status: "error", code: consumed.code };
    }
    await markEmailVerified(consumed.userId);
    const user = await findUserById(consumed.userId);
    if (user && !user.isBanned) {
      await recordLoginPresence(user.id);
      await setSessionCookie(user);
    }
    return { status: "ok" };
  } catch (error) {
    console.error("verifyEmailAction failed", error);
    return { status: "error", code: "generic" };
  }
}

export type ForgotPasswordActionState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error", code: "invalid_email" | "rate_limited" | "generic" };

export async function forgotPasswordAction(
  _prev: ForgotPasswordActionState,
  formData: FormData,
): Promise<ForgotPasswordActionState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) return { status: "error", code: "invalid_email" };

  const user = await findUserByEmail(email);
  if (!user || user.isBanned || !user.emailVerified) {
    return { status: "ok" };
  }

  const recent = await countRecentAuthTokens(
    user.id,
    "password_reset",
    15 * 60 * 1000,
  );
  if (recent >= 3) {
    return { status: "error", code: "rate_limited" };
  }

  try {
    await sendPasswordResetMail({
      userId: user.id,
      email: user.email ?? email,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error("forgotPasswordAction failed", error);
    return { status: "error", code: "generic" };
  }
  return { status: "ok" };
}

export type ResetPasswordActionState =
  | { status: "idle" }
  | { status: "ok" }
  | {
      status: "error";
      code:
        | "invalid_token"
        | "expired"
        | "used"
        | "passwordTooShort"
        | "passwordTooLong"
        | "passwordMismatch"
        | "generic";
    };

export async function resetPasswordAction(
  _prev: ResetPasswordActionState,
  formData: FormData,
): Promise<ResetPasswordActionState> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!token) return { status: "error", code: "invalid_token" };
  if (password.length < PASSWORD_MIN_LEN) {
    return { status: "error", code: "passwordTooShort" };
  }
  if (password.length > PASSWORD_MAX_LEN) {
    return { status: "error", code: "passwordTooLong" };
  }
  if (password !== passwordConfirm) {
    return { status: "error", code: "passwordMismatch" };
  }

  try {
    const consumed = await consumeAuthToken(token, "password_reset");
    if (!consumed.ok) {
      if (consumed.code === "expired") {
        return { status: "error", code: "expired" };
      }
      if (consumed.code === "used") {
        return { status: "error", code: "used" };
      }
      return { status: "error", code: "invalid_token" };
    }
    await updateUserPassword(consumed.userId, password);
    return { status: "ok" };
  } catch (error) {
    console.error("resetPasswordAction failed", error);
    return { status: "error", code: "generic" };
  }
}
