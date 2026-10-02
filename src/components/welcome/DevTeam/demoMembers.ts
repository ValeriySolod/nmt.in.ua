export type DevSocialLink = {
  id: "linkedin" | "telegram";
  href: string;
};

export type DevMemberDemo = {
  id: string;
  socials: DevSocialLink[];
};

/** Demo roster keys — copy lives in WelcomeLanding.devTeam.members.* */
export const DEV_TEAM_DEMO: readonly DevMemberDemo[] = [
  {
    id: "olena",
    socials: [
      { id: "telegram", href: "#" },
      { id: "linkedin", href: "#" },
    ],
  },
  {
    id: "ihor",
    socials: [
      { id: "telegram", href: "#" },
      { id: "linkedin", href: "#" },
    ],
  },
  {
    id: "dmytro",
    socials: [
      { id: "telegram", href: "#" },
      { id: "linkedin", href: "#" },
    ],
  },
  {
    id: "pavlo",
    socials: [
      { id: "telegram", href: "#" },
      { id: "linkedin", href: "#" },
    ],
  },
  {
    id: "kateryna",
    socials: [
      { id: "telegram", href: "#" },
      { id: "linkedin", href: "#" },
    ],
  },
] as const;

export const DEV_TEAM_SERVICE_IDS = [
  "product",
  "support",
  "design",
  "mvp",
  "integrations",
] as const;
