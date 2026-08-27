import type { RawRow } from "./validate";

/**
 * RFC 4180-style CSV parser: comma-separated, double-quote quoting,
 * `""` as an escaped quote inside a quoted field, and CRLF/LF/CR line
 * endings. No domain knowledge — returns a plain grid of strings.
 */
export function parseCsvTable(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let fieldStarted = false;

  const endField = () => {
    row.push(field);
    field = "";
    fieldStarted = false;
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  let i = 0;
  const len = text.length;
  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"' && field.length === 0 && !fieldStarted) {
      inQuotes = true;
      fieldStarted = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      if (text[i + 1] === "\n") i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    fieldStarted = true;
    i += 1;
  }

  if (inQuotes) {
    throw new Error("unterminated quoted field");
  }
  if (field.length > 0 || fieldStarted || row.length > 0) {
    endRow();
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/**
 * Splits a CSV document into a header check plus raw rows keyed by the
 * expected column names. Structural problems (parse failure, wrong header)
 * are returned as errors with no rows; per-cell validation is not performed
 * here — see `validate.ts`.
 */
export function parseCsvDataset(
  text: string,
  columns: readonly string[],
  datasetLabel: string,
): { rows: RawRow[]; errors: string[] } {
  let table: string[][];
  try {
    table = parseCsvTable(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { rows: [], errors: [`${datasetLabel}: malformed CSV (${reason})`] };
  }

  if (table.length === 0) {
    return { rows: [], errors: [`${datasetLabel}: empty file`] };
  }

  const header = table[0];
  const headerMatches =
    header.length === columns.length && header.every((h, i) => h === columns[i]);
  if (!headerMatches) {
    return {
      rows: [],
      errors: [
        `${datasetLabel}: expected header [${columns.join(", ")}], got [${header.join(", ")}]`,
      ],
    };
  }

  const errors: string[] = [];
  const rows: RawRow[] = [];
  for (let i = 1; i < table.length; i += 1) {
    const cols = table[i];
    const rowLabel = `${datasetLabel} row ${i + 1}`;
    if (cols.length !== columns.length) {
      errors.push(`${rowLabel}: expected ${columns.length} columns, got ${cols.length}`);
      continue;
    }
    const raw: Record<string, unknown> = {};
    columns.forEach((column, ci) => {
      raw[column] = cols[ci];
    });
    rows.push({ rowLabel, raw });
  }

  return { rows, errors };
}
