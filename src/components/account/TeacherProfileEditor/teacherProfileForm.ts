import type { TeacherProfile } from "@/modules/teachers/types";

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,46}[a-z0-9])$/;
export const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*$/;
export const LESSON_CURRENCIES = ["UAH", "EUR", "USD", "PLN"] as const;

export type TeacherProfileFormValues = {
  slug: string;
  headline: string;
  bio: string;
  experience: string;
  publications: string;
  city: string;
  country: string;
  subjects: string;
  teachingLevels: string[];
  teachingLanguages: string[];
  contactUrl: string;
  phone: string;
  lessonPrice: string;
  lessonCurrency: string;
  lessonDurationMinutes: string;
  joinMotivation: string;
};

export type TeacherProfileFormField = keyof TeacherProfileFormValues;

export function getTeacherProfileDefaultValues(
  profile: TeacherProfile,
  suggestedSlug: string,
): TeacherProfileFormValues {
  return {
    slug: profile.slug || suggestedSlug,
    headline: profile.headline,
    bio: profile.bio,
    experience: profile.experience,
    publications: profile.publications,
    city: profile.city,
    country: profile.country,
    subjects: profile.subjects.join(", "),
    teachingLevels: profile.teachingLevels,
    teachingLanguages: profile.teachingLanguages,
    contactUrl: profile.contactUrl,
    phone: profile.phone,
    lessonPrice: profile.lessonPrice?.toString() ?? "",
    lessonCurrency: profile.lessonCurrency,
    lessonDurationMinutes: profile.lessonDurationMinutes?.toString() ?? "",
    joinMotivation: profile.joinMotivation,
  };
}

export function teacherProfileToFormData(
  values: TeacherProfileFormValues,
): FormData {
  const formData = new FormData();

  formData.set("slug", values.slug);
  formData.set("headline", values.headline);
  formData.set("bio", values.bio);
  formData.set("experience", values.experience);
  formData.set("publications", values.publications);
  formData.set("city", values.city);
  formData.set("country", values.country);
  formData.set("subjects", values.subjects);

  values.teachingLevels.forEach((value) =>
    formData.append("teachingLevels", value),
  );
  values.teachingLanguages.forEach((value) =>
    formData.append("teachingLanguages", value),
  );

  formData.set("contactUrl", values.contactUrl);
  formData.set("phone", values.phone);
  formData.set("lessonPrice", values.lessonPrice);
  formData.set("lessonCurrency", values.lessonCurrency);
  formData.set("lessonDurationMinutes", values.lessonDurationMinutes);
  formData.set("joinMotivation", values.joinMotivation);

  return formData;
}
