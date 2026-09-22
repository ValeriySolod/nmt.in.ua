import {
  MAX_LEN_COMMENTS,
  MAX_LEN_TEXT,
  MAX_LEN_VARCHAR_100,
  MAX_LEN_VARCHAR_255,
  MAX_RIGHT_ANSWER,
  MIN_DIFFICULTY,
  MIN_RIGHT_ANSWER,
} from "@/modules/content-import/schema";
import {
  AdminContentError,
  isPositiveInt,
  type AdminQuizTaskInput,
} from "./types";
import { wrapMathForStorage, wrapRichTextForStorage } from "./mathField";

function trimRequired(value: unknown, maxLen: number, field: string): string {
  if (typeof value !== "string") {
    throw new AdminContentError(`Invalid ${field}.`, "invalid_input");
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) {
    throw new AdminContentError(`Invalid ${field}.`, "invalid_input");
  }
  return trimmed;
}

function trimOptional(value: unknown, maxLen: number): string {
  if (value == null) return "";
  if (typeof value !== "string") {
    throw new AdminContentError("Invalid comments.", "invalid_input");
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    throw new AdminContentError("Invalid comments.", "invalid_input");
  }
  return trimmed;
}

function readIntField(value: unknown, field: string): number {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value.trim())
        : NaN;
  if (!Number.isInteger(numeric)) {
    throw new AdminContentError(`Invalid ${field}.`, "invalid_input");
  }
  return numeric;
}

/** Validates and normalizes a quiz-task form payload for create/update. */
export function parseAdminQuizTaskInput(
  raw: Record<string, unknown>
): AdminQuizTaskInput {
  const name = trimRequired(raw.name, MAX_LEN_VARCHAR_100, "name");
  const taskText = wrapRichTextForStorage(
    trimRequired(raw.taskText, MAX_LEN_TEXT, "taskText")
  );
  if (taskText.length > MAX_LEN_TEXT) {
    throw new AdminContentError("Invalid taskText.", "invalid_input");
  }
  const themeId = readIntField(raw.themeId, "themeId");
  if (!isPositiveInt(themeId)) {
    throw new AdminContentError("Invalid themeId.", "invalid_input");
  }

  const answer1 = wrapMathForStorage(
    trimRequired(raw.answer1, MAX_LEN_VARCHAR_255, "answer1")
  );
  const answer2 = wrapMathForStorage(
    trimRequired(raw.answer2, MAX_LEN_VARCHAR_255, "answer2")
  );
  const answer3 = wrapMathForStorage(
    trimRequired(raw.answer3, MAX_LEN_VARCHAR_255, "answer3")
  );
  const answer4 = wrapMathForStorage(
    trimRequired(raw.answer4, MAX_LEN_VARCHAR_255, "answer4")
  );

  for (const [label, value] of [
    ["answer1", answer1],
    ["answer2", answer2],
    ["answer3", answer3],
    ["answer4", answer4],
  ] as const) {
    if (value.length > MAX_LEN_VARCHAR_255) {
      throw new AdminContentError(`Invalid ${label}.`, "invalid_input");
    }
  }

  const rightAnswerN = readIntField(raw.rightAnswerN, "rightAnswerN");
  if (rightAnswerN < MIN_RIGHT_ANSWER || rightAnswerN > MAX_RIGHT_ANSWER) {
    throw new AdminContentError("Invalid rightAnswerN.", "invalid_input");
  }

  const difficulty = readIntField(raw.difficulty, "difficulty");
  if (difficulty < MIN_DIFFICULTY) {
    throw new AdminContentError("Invalid difficulty.", "invalid_input");
  }

  const comments = wrapRichTextForStorage(
    trimOptional(raw.comments, MAX_LEN_COMMENTS)
  );
  if (comments.length > MAX_LEN_COMMENTS) {
    throw new AdminContentError("Invalid comments.", "invalid_input");
  }

  return {
    name,
    taskText,
    themeId,
    answer1,
    answer2,
    answer3,
    answer4,
    rightAnswerN,
    comments,
    difficulty,
  };
}

export function parseThemeId(raw: unknown): number {
  const themeId = readIntField(raw, "themeId");
  if (!isPositiveInt(themeId)) {
    throw new AdminContentError("Invalid themeId.", "invalid_input");
  }
  return themeId;
}

export function parseTaskId(raw: unknown): number {
  const taskId = readIntField(raw, "taskId");
  if (!isPositiveInt(taskId)) {
    throw new AdminContentError("Invalid taskId.", "invalid_input");
  }
  return taskId;
}
