import type {
  LessonCurrency,
  TeacherLevel,
  TeacherModerationStatus,
  TeachingLanguage,
} from "@/modules/teachers/types";

export type TeacherModerationApplication = {
  userId: number;

  // Account
  displayName: string;
  email: string | null;

  // Teacher profile
  slug: string;
  headline: string;
  bio: string;
  experience: string;
  publications: string;
  city: string;
  country: string;
  subjects: string[];
  teachingLevels: TeacherLevel[];
  teachingLanguages: TeachingLanguage[];
  contactUrl: string;
  phone: string;
  lessonPrice: number | null;
  lessonCurrency: LessonCurrency | "";
  lessonDurationMinutes: number | null;
  joinMotivation: string;

  // Moderation
  moderationStatus: TeacherModerationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: number | null;
  rejectionReason: string;
};

export type ReviewTeacherApplicationInput = {
  reviewerUserId: number;
  teacherUserId: number;
};

export type RejectTeacherApplicationInput = ReviewTeacherApplicationInput & {
  rejectionReason: string;
};

export type TeacherModerationErrorCode =
  | "invalid_input"
  | "not_found"
  | "invalid_status"
  | "invalid_rejection_reason"
  | "db_error";

export class TeacherModerationError extends Error {
  constructor(
    message: string,
    readonly code: TeacherModerationErrorCode,
  ) {
    super(message);
    this.name = "TeacherModerationError";
  }
}
