# Таска 3.5 — Таймер сесії

**Модуль:** 3 (тести / тренажери)  
**Статус:** зроблено  
**Гілка:** `feature/timer`

## Мета

У завершеній сесії `task_sessions.time > 0`. На екрані тренажера учень бачить відлік, на підсумку й у таблицях — реальні секунди замість «—».

Час на окреме питання (окреме поле в БД) **не входить** у цю таску: кількість завдань відома лише після старту, окремої колонки в `tasks2session` немає.

## Що змінилось у поведінці

| Момент | Було | Стало |
| --- | --- | --- |
| Старт тесту (`startTopicTest`) | `start_time = 0`, `time = 0` | без змін: годинник стартує **при вході в тренажер**, не в момент INSERT |
| Відкриття `/session/[id]` | нічого | `start_time = unix`, якщо ще було `0` |
| Header тренажера | лише «Завдання N / M» | pill «Час: MM:SS» ліворуч від каунтера, той самий стиль |
| «Завершити тест» | `time` лишалось `0` | сервер пише `time = now - start_time` (мінімум 1 с) |
| Підсумок / `/sessions` / `/results` | «—», якщо `time = 0` | число секунд і швидкість с/завдання, щойно сесія завершена |

`startTopicTest` як і раніше створює рядок з нулями. Це навмисно: відлік має йти від першого показу тренажера, а не від кліку «Старт» на головній (між ними може бути редірект).

## Потік

```
Старт на /  →  INSERT task_sessions (start_time=0, time=0)
     ↓
/session/[id] → TopicTrainer mount
     ↓
markSessionStartedAction(sessionId)
     ↓
UPDATE start_time = now  WHERE start_time = 0  (ідемпотентно)
     ↓
клієнтський setInterval: «Час: MM:SS» від цього unix-origin
     ↓
finishTrainerSession → time = max(1, now - start_time)
     ↓
підсумок, /sessions («Час, с», «Час/тест»), /results («Швидкість, с/завдання»)
```

Клієнтський таймер **лише для UI**. У БД іде серверний `now - start_time`, щоб не довіряти `elapsedSec` з браузера.

Refresh сторінки не скидає годинник: `markSessionStarted` не перезаписує ненульовий `start_time`, а UI знову рахує від збереженого origin.

## Поля БД (`task_sessions`)

| Поле | Коли пишеться | Значення |
| --- | --- | --- |
| `start_time` | перший mount тренажера | unix-секунди; `0` = ще не стартували |
| `time` | `finishTrainerSession` | тривалість у секундах, завжди ≥ 1 для завершеної сесії |

Формат `start_time` — unix seconds (не мілісекунди). Так само читає `formatSessionStartTime` на `/sessions`.

## Файли

| Шлях | Відповідальність |
| --- | --- |
| `src/modules/testing/markSessionStarted.ts` | ідемпотентний запис `start_time` |
| `src/modules/testing/sessionElapsed.ts` | `nowUnixSec`, `resolveSessionElapsedSec`, `formatElapsedClock` |
| `src/modules/testing/finishTrainerSession.ts` | агрегація відповідей + `time` / `start_time` |
| `src/modules/testing/actions.ts` | `markSessionStartedAction` (`DEMO_USER_ID`) |
| `src/components/testing/TopicTrainer/useSessionTimer.ts` | mount → action → `setInterval` |
| `src/components/testing/TopicTrainer/TopicTrainer.tsx` | pill «Час: MM:SS» у header |
| `src/components/testing/TopicTrainer/TopicTrainer.module.css` | `.badges` поруч із `.progress` |

Експорт з `src/modules/testing/index.ts`. Таблиці `/sessions` і `/results` не змінювались: вони вже вміють показувати час, коли `time > 0`.

## API (модуль)

```ts
markSessionStarted({ userId, sessionId })
// → { startTime: number }
// completed / уже є start_time → повертає як є, без UPDATE
// немає сесії цього user → MarkSessionStartedError('not_found')

finishTrainerSession({ userId, sessionId })
// → TrainerSessionSummary { …, timeSec }
// timeSec = max(1, nowSec - start_time)
```

Clock у бізнес-функціях інжектиться (`nowSec?: () => number`), щоб unit-тести фіксували elapsed без реального MySQL `UNIX_TIMESTAMP()`.

## UI

- Тренажер: `Час: MM:SS` (`role="timer"`). Хвилини не обмежені 59 — `90:00` для півтори години.
- Підсумок: картка «Час, с» через існуючий `formatDurationSeconds` (число секунд, «—» лише якщо ≤ 0).
- Годинник не крутиться на екрані підсумку (`useSessionTimer({ enabled: summary == null })`).

## Крайові випадки

| Ситуація | Поведінка |
| --- | --- |
| Повторний mount / refresh | `start_time` не змінюється |
| Завершена сесія відкрита знову | `markSessionStarted` не пише; одразу підсумок |
| Фініш у ту саму секунду, що старт | `time = 1` |
| `start_time` так і лишився `0` (action не встиг) | на фініші `time = 1`, `start_time = now` |
| Action старту впав | UI рахує від локального `now`; фініш усе одно серверний |

## Acceptance

- [x] Завершена сесія: `time > 0` у БД.
- [x] `/sessions` — «Час, с» не «—»; «Час/тест» = `time / tasks_number`.
- [x] `/results` — «Швидкість, с/завдання» після тестів.
- [x] Header тренажера: відлік `Час: MM:SS` біля «Завдання N / M».
- [x] Час на питання — свідомо пропущено (немає колонки в БД).

## Як перевірити

1. `/` → тема → **Старт**.
2. На `/session/{id}` має з’явитись pill «Час: 00:00» і піти вгору; refresh зберігає відлік.
3. Відповісти на всі завдання → **Завершити тест** → картка «Час, с» з числом.
4. `/sessions` — рядок сесії з часом і часом на завдання; `/results` — швидкість по темі.
5. `npm test` — покриття `markSessionStarted`, `sessionElapsed`, `finishTrainerSession` (у т.ч. `time ≥ 1`).

## Що не в цій тасці

- Пер-питання timing у `tasks2session`.
- Countdown / ліміт часу (симулятор НМТ, таска 3.8).
- Auth: `userId` як і в інших actions — `DEMO_USER_ID = 1`.
