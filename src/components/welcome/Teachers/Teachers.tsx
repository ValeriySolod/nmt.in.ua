import { getTranslations } from "next-intl/server";
import { TEACHERS_DEMO } from "./demoTeachers";
import { TEACHER_OFFER_IDS } from "./offerFeatures";
import { TeachersPanel } from "./TeachersPanel";

export async function Teachers() {
  const t = await getTranslations("WelcomeLanding.teachers");

  const teachers = TEACHERS_DEMO.map((meta) => ({
    id: meta.id,
    photoSrc: meta.photoSrc,
    rating: meta.rating,
    reviewCount: meta.reviewCount,
    name: t(`demo.${meta.id}.name`),
    subject: t(`demo.${meta.id}.subject`),
    education: t(`demo.${meta.id}.education`),
    experience: t(`demo.${meta.id}.experience`),
    nextSlot: t(`demo.${meta.id}.nextSlot`),
    bioLead: t(`demo.${meta.id}.bioLead`),
    bioRest: t(`demo.${meta.id}.bioRest`),
  }));

  const features = TEACHER_OFFER_IDS.map((id) => ({
    id,
    title: t(`features.${id}.title`),
    text: t(`features.${id}.text`),
  }));

  return (
    <TeachersPanel
      teachers={teachers}
      features={features}
      labels={{
        kicker: t("kicker"),
        title: t("title"),
        lead: t("lead"),
        verified: t("verified"),
        education: t("education"),
        experience: t("experience"),
        nextSlot: t("nextSlot"),
        reviews: t.raw("reviews") as string,
        empty: t("empty"),
        carouselAria: t("carouselAria"),
        prev: t("prev"),
        next: t("next"),
        counter: t.raw("counter") as string,
        offerTitle: t("offerTitle"),
        offerLead: t("offerLead"),
        joinCta: t("joinCta"),
      }}
    />
  );
}
