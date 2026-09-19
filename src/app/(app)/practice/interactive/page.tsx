import { redirect } from "next/navigation";
import { requireSessionUserId } from "@/modules/auth/getCurrentUser";

type LegacyInteractivePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Legacy URL: interactive formats now live as the second tab of the
 * "Тест за обраною темою" home. Keep old links working and forward their query.
 */
export default async function InteractiveFormatsRedirect({
  searchParams,
}: LegacyInteractivePageProps) {
  await requireSessionUserId();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (key === "tab") continue;
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item);
    }
  }
  params.set("tab", "interactive");
  redirect(`/?${params.toString()}`);
}
