export type DemoTeacherId = "viktoriaK" | "viktoriaP" | "nazarii";

export type DemoTeacherMeta = {
  id: DemoTeacherId;
  photoSrc: string;
  rating: number;
  reviewCount: number;
};

/** Demo roster — copy lives in WelcomeLanding.teachers.demo.* */
export const TEACHERS_DEMO: readonly DemoTeacherMeta[] = [
  {
    id: "viktoriaK",
    photoSrc: "/landing/teachers/viktoria-k.webp",
    rating: 5,
    reviewCount: 24,
  },
  {
    id: "viktoriaP",
    photoSrc: "/landing/teachers/viktoria-p.webp",
    rating: 5,
    reviewCount: 18,
  },
  {
    id: "nazarii",
    photoSrc: "/landing/teachers/nazarii.webp",
    rating: 5,
    reviewCount: 10,
  },
] as const;
