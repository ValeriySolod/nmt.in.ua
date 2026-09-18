export type RateTeacherInput = {
  teacherUserId: number;
  studentUserId: number;
  score: number;
};

export type RateTeacherErrorCode =
  | "invalid_input"
  | "forbidden"
  | "not_found"
  | "db_error";

export class RateTeacherError extends Error {
  constructor(
    message: string,
    public readonly code: RateTeacherErrorCode,
  ) {
    super(message);
    this.name = "RateTeacherError";
  }
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function validateRateTeacherInput(raw: unknown): RateTeacherInput {
  if (typeof raw !== "object" || raw === null) {
    throw new RateTeacherError("Payload must be an object.", "invalid_input");
  }
  const { teacherUserId, studentUserId, score } = raw as Record<
    string,
    unknown
  >;
  if (!isPositiveInt(teacherUserId) || !isPositiveInt(studentUserId)) {
    throw new RateTeacherError(
      "teacherUserId and studentUserId must be positive integers.",
      "invalid_input",
    );
  }
  if (teacherUserId === studentUserId) {
    throw new RateTeacherError("Cannot rate yourself.", "forbidden");
  }
  if (
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > 5
  ) {
    throw new RateTeacherError("score must be an integer 1–5.", "invalid_input");
  }
  return { teacherUserId, studentUserId, score };
}
