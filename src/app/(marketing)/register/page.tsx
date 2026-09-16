import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import {
  RegisterRolePicker,
  type RegisterRole,
} from "@/components/auth/RegisterRolePicker/RegisterRolePicker";
import { createPageMetadata } from "@/constants/seo";
import { safeInternalPath } from "@/lib/safeInternalPath";

export async function generateMetadata() {
  const t = await getTranslations("Metadata.register");

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: "/register",
    noIndex: true,
  });
}

type RegisterPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    from?: string | string[];
    role?: string | string[];
  }>;
};

function pickRole(raw: string | string[] | undefined): RegisterRole {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "teacher" ? "teacher" : "student";
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
  const nextPath = safeInternalPath(rawNext);
  const from = rawFrom === "diagnostic" ? "diagnostic" : undefined;
  const role = pickRole(params.role);

  const hrefForRole = (nextRole: RegisterRole) => {
    const query = new URLSearchParams();
    query.set("role", nextRole);
    if (nextPath !== "/") query.set("next", nextPath);
    if (from) query.set("from", from);
    return `/register?${query.toString()}`;
  };

  const cardPicker = (
    <RegisterRolePicker
      role={role}
      hrefForRole={hrefForRole}
      placement="card"
    />
  );
  const asidePicker = (
    <RegisterRolePicker
      role={role}
      hrefForRole={hrefForRole}
      placement="aside"
    />
  );

  return (
    <AuthShell asideExtra={asidePicker}>
      <RegisterForm
        nextPath={nextPath}
        role={role}
        rolePicker={cardPicker}
        from={from}
      />
    </AuthShell>
  );
}
