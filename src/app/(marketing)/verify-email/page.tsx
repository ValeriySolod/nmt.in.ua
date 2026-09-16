import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmailClient } from "@/components/auth/VerifyEmailClient/VerifyEmailClient";
import { createPageMetadata } from "@/constants/seo";

export async function generateMetadata() {
  const t = await getTranslations("Metadata.verifyEmail");

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/verify-email",
    noIndex: true,
  });
}

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.token) ? params.token[0] : params.token;
  const token = (raw ?? "").trim();

  return (
    <AuthShell>
      <VerifyEmailClient token={token} />
    </AuthShell>
  );
}
