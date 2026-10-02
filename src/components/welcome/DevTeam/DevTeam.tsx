import { getTranslations } from "next-intl/server";
import {
  DEV_TEAM_DEMO,
  DEV_TEAM_SERVICE_IDS,
} from "./demoMembers";
import { DevTeamPanel } from "./DevTeamPanel";

export async function DevTeam() {
  const t = await getTranslations("WelcomeLanding.devTeam");

  const members = DEV_TEAM_DEMO.map((member) => ({
    id: member.id,
    name: t(`members.${member.id}.name`),
    role: t(`members.${member.id}.role`),
    socials: [...member.socials],
  }));

  const services = DEV_TEAM_SERVICE_IDS.map((id) => ({
    id,
    title: t(`services.${id}.title`),
    text: t(`services.${id}.text`),
  }));

  return (
    <DevTeamPanel
      members={members}
      services={services}
      labels={{
        toggle: t("toggle"),
        collapse: t("collapse"),
        kicker: t("kicker"),
        title: t("title"),
        lead: t("lead"),
        socialLinkedin: t("socialLinkedin"),
        socialTelegram: t("socialTelegram"),
        carouselAria: t("carouselAria"),
        servicesTitle: t("servicesTitle"),
        servicesLead: t("servicesLead"),
        formCta: t("formCta"),
      }}
    />
  );
}
