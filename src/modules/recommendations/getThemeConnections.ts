import type { SqlConnection } from "@/lib/db/mysql";

export type ThemeConnectionEdge = {
  fromThemeId: number;
  toThemeId: number;
};

type ThemeConnectionRow = {
  vertex_start: number;
  vertex_finish: number;
};

type GetThemeConnectionsDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Loads outgoing edges from `theme_connections` for the given start themes.
 */
export async function getThemeConnectionsForThemes(
  themeIds: number[],
  deps: GetThemeConnectionsDeps = { getConnection: loadDefaultConnection },
): Promise<ThemeConnectionEdge[]> {
  const validIds = themeIds.filter(isPositiveInt);
  if (validIds.length === 0) {
    return [];
  }

  const placeholders = validIds.map(() => "?").join(", ");
  const sql = `
    SELECT vertex_start, vertex_finish
    FROM theme_connections
    WHERE vertex_start IN (${placeholders})
    ORDER BY id ASC
  `;

  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<ThemeConnectionRow>(sql, validIds);
    return rows.map((row) => ({
      fromThemeId: row.vertex_start,
      toThemeId: row.vertex_finish,
    }));
  } finally {
    connection.release();
  }
}
