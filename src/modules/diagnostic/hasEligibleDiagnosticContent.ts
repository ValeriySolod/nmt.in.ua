import type { SqlConnection } from "@/lib/db/mysql";
import {
  isDiagnosticBankEligible,
  SQL_BANK_ELIGIBILITY,
} from "./startDiagnosticTest";

type HasEligibleDiagnosticContentDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Entry-page check: enough tasks (≥10) across ≥2 themes so the adaptive
 * intro test can run without immediately failing.
 */
export async function hasEligibleDiagnosticContent(
  deps: HasEligibleDiagnosticContentDeps = {
    getConnection: loadDefaultConnection,
  },
): Promise<boolean> {
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<{
      task_count: number | string;
      theme_count: number | string;
    }>(SQL_BANK_ELIGIBILITY);
    const row = rows[0];
    return row != null && isDiagnosticBankEligible(row);
  } finally {
    connection.release();
  }
}
