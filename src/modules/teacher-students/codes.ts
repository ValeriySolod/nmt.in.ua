/** Unambiguous alphabet: no 0/O/1/I. */
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 10;
/** Reusable until this TTL, or until the teacher generates a replacement. */
export const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const GROUP_NAME_MAX = 80;

const CODE_RE = new RegExp(
  `^[${INVITE_CODE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`,
);

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]+/g, "");
}

export function isInviteCode(value: string): boolean {
  return CODE_RE.test(value);
}

export function inviteJoinPath(code: string): string {
  return `/join/${code}`;
}

export function normalizeGroupName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
