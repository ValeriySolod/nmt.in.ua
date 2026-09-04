import { DEMO_ACCOUNTS } from "./types";

export type PublicDemoAccount = {
  login: string;
  displayName: string;
  role: (typeof DEMO_ACCOUNTS)[number]["role"];
};

type DemoLoginEnv = {
  NODE_ENV?: string;
  ALLOW_DEMO_LOGIN?: string;
};

/** One-click demo login is off in production unless explicitly enabled. */
export function isDemoLoginEnabled(
  env: DemoLoginEnv = process.env,
): boolean {
  if (env.ALLOW_DEMO_LOGIN === "1") return true;
  if (env.ALLOW_DEMO_LOGIN === "0") return false;
  return env.NODE_ENV !== "production";
}

export function isDemoAccountLogin(login: string): boolean {
  const normalized = login.trim().toLowerCase();
  return DEMO_ACCOUNTS.some(
    (account) => account.login.toLowerCase() === normalized,
  );
}

export function publicDemoAccounts(): PublicDemoAccount[] {
  return DEMO_ACCOUNTS.map(({ login, displayName, role }) => ({
    login,
    displayName,
    role,
  }));
}
