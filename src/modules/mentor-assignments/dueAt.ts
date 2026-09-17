import {
  MentorAssignmentsError,
  type AssignmentScheduleMode,
} from "./types";

export type AssignmentScheduleWindow = {
  availableAt: number;
  dueAt: number;
};

/**
 * Вікно задає викладач у формі призначення.
 * «На зараз» — available = now, due = обраний дедлайн.
 * «На дату/час» — available = дата відкриття, due = дедлайн (після відкриття).
 */
export function resolveAssignmentSchedule(
  mode: AssignmentScheduleMode,
  availableAtUnix: number | null,
  dueAtUnix: number | null,
  nowSec: number,
): AssignmentScheduleWindow {
  if (
    dueAtUnix == null ||
    !Number.isFinite(dueAtUnix) ||
    !Number.isInteger(dueAtUnix)
  ) {
    throw new MentorAssignmentsError(
      "dueAt must be a unix timestamp.",
      "invalid_input",
    );
  }

  if (mode === "now") {
    if (dueAtUnix <= nowSec) {
      throw new MentorAssignmentsError(
        "dueAt must be in the future.",
        "invalid_input",
      );
    }
    return { availableAt: nowSec, dueAt: dueAtUnix };
  }

  if (
    availableAtUnix == null ||
    !Number.isFinite(availableAtUnix) ||
    !Number.isInteger(availableAtUnix)
  ) {
    throw new MentorAssignmentsError(
      "availableAt must be a unix timestamp for datetime mode.",
      "invalid_input",
    );
  }
  if (availableAtUnix < nowSec) {
    throw new MentorAssignmentsError(
      "availableAt must not be in the past.",
      "invalid_input",
    );
  }
  if (dueAtUnix <= availableAtUnix) {
    throw new MentorAssignmentsError(
      "dueAt must be after availableAt.",
      "invalid_input",
    );
  }
  return { availableAt: availableAtUnix, dueAt: dueAtUnix };
}

/** @deprecated — use resolveAssignmentSchedule with explicit dueAt */
export function resolveAssignmentDueAt(
  mode: AssignmentScheduleMode,
  scheduledAtUnix: number | null,
  nowSec: number,
  windowSec = 86_400,
): number {
  if (mode === "now") {
    return resolveAssignmentSchedule("now", null, nowSec + windowSec, nowSec)
      .dueAt;
  }
  return resolveAssignmentSchedule(
    "datetime",
    scheduledAtUnix,
    (scheduledAtUnix ?? nowSec) + windowSec,
    nowSec,
  ).dueAt;
}
