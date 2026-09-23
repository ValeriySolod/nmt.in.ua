import type { SqlConnection } from "@/lib/db/mysql";
import {
  DIAGNOSTIC_MAX_THEMES,
  SQL_ELIGIBLE_THEMES,
} from "./startDiagnosticTest";

type HasEligibleDiagnosticContentDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Read-only availability check for the diagnostic entry page: is there at
 * at least five themes with enough tasks for a real attempt right now? Lets the
 * page disable the start button and explain instead of creating an attempt
 * that `startDiagnosticTest` would reject with `insufficient_tasks`.
 */
export async function hasEligibleDiagnosticContent(
  deps: HasEligibleDiagnosticContentDeps = { getConnection: loadDefaultConnection },
): Promise<boolean> {
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<{ theme_id: number }>(SQL_ELIGIBLE_THEMES);
    return rows.length >= DIAGNOSTIC_MAX_THEMES;
  } finally {
    connection.release();
  }
}
