import {
  changePasswordErrorCode,
  changePasswordSchema,
} from "@/validations/authValidation";
import { validateSchema } from "@/validations/parse";

export type ChangePasswordFieldError =
  | "requiredFields"
  | "passwordTooShort"
  | "passwordTooLong"
  | "passwordMismatch"
  | "samePassword";

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type ValidatedChangePassword = {
  currentPassword: string;
  newPassword: string;
};

export function validateChangePasswordInput(
  input: ChangePasswordInput,
):
  | { ok: true; value: ValidatedChangePassword }
  | { ok: false; code: ChangePasswordFieldError } {
  const parsed = validateSchema(changePasswordSchema, input);
  if (!parsed.ok) {
    return { ok: false, code: changePasswordErrorCode(parsed.detail) };
  }
  const { newPasswordConfirm: _confirm, ...value } = parsed.value;
  return { ok: true, value };
}
