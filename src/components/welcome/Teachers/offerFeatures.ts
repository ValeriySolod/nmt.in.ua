/** Keys for WelcomeLanding.teachers.features.* */
export const TEACHER_OFFER_IDS = [
  "profile",
  "students",
  "assign",
  "results",
  "consultations",
] as const;

export type TeacherOfferId = (typeof TEACHER_OFFER_IDS)[number];
