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

function registerHref(
  role: RegisterRole,
  nextPath: string,
  from: "diagnostic" | undefined,
): string {
  const query = new URLSearchParams();
  query.set("role", role);
  if (nextPath !== "/") query.set("next", nextPath);
  if (from) query.set("from", from);
  return `/register?${query.toString()}`;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const rawFrom = Array.isArray(params.from) ? params.from[0] : params.from;
  const nextPath = safeInternalPath(rawNext);
  const from = rawFrom === "diagnostic" ? "diagnostic" : undefined;
  const role = pickRole(params.role);

  const studentHref = registerHref("student", nextPath, from);
  const teacherHref = registerHref("teacher", nextPath, from);

  const cardPicker = (
    <RegisterRolePicker
      role={role}
      studentHref={studentHref}
      teacherHref={teacherHref}
      placement="card"
    />
  );
  const asidePicker = (
    <RegisterRolePicker
      role={role}
      studentHref={studentHref}
      teacherHref={teacherHref}
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
