/** Keys for WelcomeLanding.teachers.features.* — teacher cabinet highlights */
export const TEACHER_OFFER_IDS = [
  "profile",
  "students",
  "assign",
  "results",
  "sessions",
  "consultations",
] as const;

export type TeacherOfferId = (typeof TEACHER_OFFER_IDS)[number];
