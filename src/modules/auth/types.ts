export type StudentOption = {
  id: number;
  displayName: string;
};

export const USER_ROLES = ["student", "teacher", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: number;
  login: string;
  displayName: string;
  role: UserRole;
  /** Unix seconds of the stored avatar; omitted when the user has none. */
  avatarRev?: number;
  /** True when an admin banned the account (blocks login). */
  isBanned?: boolean;
  /** Normalized email when present (new registrations). */
  email?: string;
  /** True when email_verified_at is set (or demo bypass). */
  emailVerified?: boolean;
};

export type SessionPayload = {
  userId: number;
  role: UserRole;
  exp: number;
  /** Present on tokens issued after the layout-DB skip; older cookies omit these. */
  displayName?: string;
  login?: string;
  /** Present on tokens issued after avatar upload landed; older cookies omit it. */
  avatarRev?: number;
};

export function avatarSrc(
  user: Pick<AuthUser, "id" | "avatarRev">,
): string | null {
  if (!user.avatarRev) return null;
  return `/api/avatar/${user.id}?v=${user.avatarRev}`;
}

export const DEMO_ACCOUNTS = [
  {
    login: "demo-student",
    password: "demo123",
    displayName: "Олена Коваленко",
    role: "student" as const,
    id: 1,
    description: "Учень — тести, результати, сесії",
  },
  {
    login: "demo-teacher",
    password: "demo123",
    displayName: "Ігор Петренко",
    role: "teacher" as const,
    id: 2,
    description: "Викладач — призначення mentor-сесій",
  },
  {
    login: "demo-admin",
    password: "demo123",
    displayName: "Адміністратор",
    role: "admin" as const,
    id: 3,
    description: "Адмін — редактор завдань і профілів",
  },
] as const;

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "student":
      return "Учень";
    case "teacher":
      return "Викладач";
    case "admin":
      return "Адмін";
  }
}

export function userInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function canImportContent(role: UserRole): boolean {
  return role === "admin";
}

export function canAssignMentorSessions(role: UserRole): boolean {
  return role === "teacher" || role === "admin";
}

export function canReviewConsultationRequests(role: UserRole): boolean {
  return role === "teacher" || role === "admin";
}

/** Teacher roster («Мої учні») — same staff roles as mentor assign. */
export function canManageStudents(role: UserRole): boolean {
  return role === "teacher" || role === "admin";
}

/** Platform account list (filter / ban / delete) — admin only. */
export function canManageProfiles(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Sidebar hrefs for the content-editor admin cabinet.
 * Student/teacher learning paths stay available via URL, but not in the menu.
 */
export const ADMIN_NAV_HREFS = [
  "/",
  "/profiles",
  "/materials/textbook",
  "/problems",
  "/feedback",
  "/settings",
] as const;
