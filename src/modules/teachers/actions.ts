"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { canReviewConsultationRequests } from "@/modules/auth/types";
import { saveTeacherProfile, TeacherProfileError } from "./store";
import { rateTeacher, RateTeacherError } from "./rateTeacher";
import { canEditTeacherProfile, teacherPublicPath } from "./types";
import type { TeacherProfileFieldError } from "./types";
import { validateTeacherProfileInput } from "./validateProfile";

export type SaveTeacherProfileActionState =
  | { status: "idle" }
  | { status: "ok"; slug: string }
  | { status: "error"; code: TeacherProfileFieldError };

export async function saveTeacherProfileAction(
  _prev: SaveTeacherProfileActionState,
  formData: FormData,
): Promise<SaveTeacherProfileActionState> {
  const user = await requireUser();
  if (!canEditTeacherProfile(user.role)) {
    return { status: "error", code: "forbidden" };
  }

  const validated = validateTeacherProfileInput({
    slug: String(formData.get("slug") ?? ""),
    headline: String(formData.get("headline") ?? ""),
    bio: String(formData.get("bio") ?? ""),
    experience: String(formData.get("experience") ?? ""),
    publications: String(formData.get("publications") ?? ""),
    city: String(formData.get("city") ?? ""),
    country: String(formData.get("country") ?? ""),
    subjects: String(formData.get("subjects") ?? ""),
    teachingLevels: formData.getAll("teachingLevels").map(String),
    teachingLanguages: formData.getAll("teachingLanguages").map(String),
    contactUrl: String(formData.get("contactUrl") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    lessonPrice: String(formData.get("lessonPrice") ?? ""),
    lessonCurrency: String(formData.get("lessonCurrency") ?? ""),
    lessonDurationMinutes: String(formData.get("lessonDurationMinutes") ?? ""),
    joinMotivation: String(formData.get("joinMotivation") ?? ""),
  });

  if (!validated.ok) {
    return { status: "error", code: validated.code };
  }

  try {
    const saved = await saveTeacherProfile(user.id, user.role, validated.value);
    revalidatePath("/account");
    revalidatePath("/");
    revalidatePath("/welcome");
    revalidatePath(teacherPublicPath(saved.slug));
    return { status: "ok", slug: saved.slug };
  } catch (error) {
    if (error instanceof TeacherProfileError) {
      return { status: "error", code: error.code };
    }
    console.error("saveTeacherProfileAction failed", error);
    return { status: "error", code: "serverError" };
  }
}

export type RateTeacherActionResult =
  | {
      ok: true;
      teacherUserId: number;
      score: number;
      avgRating: number | null;
      ratingCount: number;
    }
  | {
      ok: false;
      code: "invalid_input" | "forbidden" | "not_found" | "generic";
    };

/** Student rates a public teacher 1–5. Id and score come from trusted session + args. */
export async function rateTeacherAction(
  teacherUserId: number,
  score: number,
): Promise<RateTeacherActionResult> {
  const user = await requireUser();
  if (canReviewConsultationRequests(user.role) || user.role !== "student") {
    return { ok: false, code: "forbidden" };
  }

  try {
    const result = await rateTeacher({
      teacherUserId,
      studentUserId: user.id,
      score,
    });
    revalidatePath("/consultations");
    return {
      ok: true,
      teacherUserId: result.teacherUserId,
      score: result.score,
      avgRating: result.avgRating,
      ratingCount: result.ratingCount,
    };
  } catch (error) {
    if (error instanceof RateTeacherError) {
      if (
        error.code === "invalid_input" ||
        error.code === "forbidden" ||
        error.code === "not_found"
      ) {
        return { ok: false, code: error.code };
      }
    }
    console.error("rateTeacherAction failed", error);
    return { ok: false, code: "generic" };
  }
}
