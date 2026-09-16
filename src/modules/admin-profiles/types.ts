import type { UserRole } from "@/modules/auth/types";

export type AdminProfile = {
  id: number;
  login: string;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  role: UserRole;
  isBanned: boolean;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
};

export type AdminProfilesErrorCode =
  | "invalid_input"
  | "not_found"
  | "forbidden"
  | "self_action"
  | "protected_account"
  | "last_admin"
  | "db_error";

export class AdminProfilesError extends Error {
  constructor(
    message: string,
    public readonly code: AdminProfilesErrorCode,
  ) {
    super(message);
    this.name = "AdminProfilesError";
  }
}
