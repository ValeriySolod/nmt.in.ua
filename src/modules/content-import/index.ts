/**
 * Модуль 2 — імпорт контенту (CSV / JSON → БД).
 *
 * Точка входу для команди: імпортуйте функції звідси.
 * UI-адмінка (майбутнє): сторінка налаштувань або окремий /admin/import.
 * HTTP: підключіть handlers у `src/app/api/import/route.ts`.
 */

export type ImportFormat = "csv" | "json";

export type ImportResult = {
  ok: boolean;
  inserted: number;
  updated: number;
  errors: string[];
};

/** Розібрати CSV-файл у масив записів завдань/тем. */
export async function parseCsv(file: File | string): Promise<unknown[]> {
  void file;
  // TODO(module-2): CSV parser (papaparse / власний)
  throw new Error("parseCsv: ще не реалізовано (модуль 2)");
}

/** Розібрати JSON-файл у масив записів завдань/тем. */
export async function parseJson(file: File | string): Promise<unknown[]> {
  void file;
  // TODO(module-2): JSON schema validation
  throw new Error("parseJson: ще не реалізовано (модуль 2)");
}

/**
 * Зберегти розпарсені записи в БД.
 * Викликати лише з серверного коду (Route Handler / Server Action).
 */
export async function importToDatabase(
  records: unknown[],
  format: ImportFormat,
): Promise<ImportResult> {
  void records;
  void format;
  // TODO(module-2): Prisma/Drizzle/SQL insert-upsert
  throw new Error("importToDatabase: ще не реалізовано (модуль 2)");
}

/** Зручний фасад: файл → parse → DB. */
export async function runContentImport(
  file: File | string,
  format: ImportFormat,
): Promise<ImportResult> {
  const records =
    format === "csv" ? await parseCsv(file) : await parseJson(file);
  return importToDatabase(records, format);
}
