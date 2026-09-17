import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AdminContentEditor } from "@/components/admin/AdminContentEditor";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PageFrame } from "@/components/dashboard/PageFrame";
import { TopicTestStart } from "@/components/dashboard/TopicTestStart";
import { UpgradeSessionCookie } from "@/components/auth/UpgradeSessionCookie";
import { pickClientMessages } from "@/i18n/clientMessages";
import {
  getAdminThemes,
  getQuizTasksByTheme,
} from "@/modules/admin-content";
import { canImportContent, type AuthUser } from "@/modules/auth/types";
import { getAvailableTopicThemes } from "@/modules/testing/getAvailableTopicThemes";

type CabinetHomeProps = {
  locale: string;
  user: AuthUser;
  displayName: string;
  initialThemeId?: number;
  needsCookieUpgrade: boolean;
};

/** Loaded only for authenticated `/` — keeps cabinet out of the guest graph. */
export async function CabinetHome({
  locale,
  user,
  displayName,
  initialThemeId,
  needsCookieUpgrade,
}: CabinetHomeProps) {
  if (user.role === "teacher") {
    redirect("/assign");
  }

  const messages = pickClientMessages(await getMessages(), "/home");

  if (canImportContent(user.role)) {
    const t = await getTranslations("AdminContent");
    const themes = await getAdminThemes();
    const themeId =
      initialThemeId && themes.some((theme) => theme.id === initialThemeId)
        ? initialThemeId
        : themes[0]?.id;
    const initialTasks = themeId ? await getQuizTasksByTheme(themeId) : [];

    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        {needsCookieUpgrade ? <UpgradeSessionCookie /> : null}
        <DashboardShell user={user}>
          <PageFrame
            kicker={t("kicker")}
            title={t("title")}
            lead={t("lead")}
          >
            <AdminContentEditor
              themes={themes}
              initialThemeId={themeId}
              initialTasks={initialTasks}
            />
          </PageFrame>
        </DashboardShell>
      </NextIntlClientProvider>
    );
  }

  const themes = await getAvailableTopicThemes();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {needsCookieUpgrade ? <UpgradeSessionCookie /> : null}
      <DashboardShell user={user}>
        <TopicTestStart
          themes={themes}
          initialThemeId={initialThemeId}
          displayName={displayName}
        />
      </DashboardShell>
    </NextIntlClientProvider>
  );
}
