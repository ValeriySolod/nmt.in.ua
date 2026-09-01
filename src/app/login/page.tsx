import { LoginForm } from "@/components/auth/LoginForm/LoginForm";
import { createPageMetadata } from "@/constants/seo";

export const metadata = createPageMetadata({
  title: "Вхід",
  description: "Увійдіть до навчального кабінету NMT.",
  path: "/login",
  noIndex: true,
});

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

function readNext(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = readNext(params.next);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(165deg, rgb(255 255 255 / 96%), rgb(232 248 238 / 72%))",
      }}
    >
      <LoginForm nextPath={nextPath} />
    </div>
  );
}
