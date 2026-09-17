import { SESSION_LIFETIME_SEC } from "@/modules/testing/sessionExpiry";
import {
  MentorAssignmentsError,
  type AssignmentScheduleMode,
} from "./types";

export function resolveAssignmentDueAt(
  mode: AssignmentScheduleMode,
  dueAtUnix: number | null,
  nowSec: number,
): number {
  if (mode === "now") {
    return nowSec + SESSION_LIFETIME_SEC;
  }
  if (
    dueAtUnix == null ||
    !Number.isFinite(dueAtUnix) ||
    !Number.isInteger(dueAtUnix) ||
    dueAtUnix <= nowSec
  ) {
    throw new MentorAssignmentsError(
      "dueAt must be a future unix timestamp for datetime mode.",
      "invalid_input",
    );
  }
  return dueAtUnix;
}
