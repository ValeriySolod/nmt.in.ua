/**
 * HTTP-точка для модуля 2 (імпорт CSV/JSON → БД).
 * Команда модуля 2: реалізуйте POST тут, використовуючи
 * `runContentImport` з `@/modules/content-import`.
 *
 * Приклад тіла (multipart): field `file` + `format=csv|json`
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "API імпорту ще не підключено. Реалізуйте модуль 2 у src/modules/content-import і цей route.",
    },
    { status: 501 },
  );
}
