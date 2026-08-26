# nmt.in.ua

Сайт [nmt.in.ua](https://nmt.in.ua) на Next.js 16 (App Router, TypeScript). Стилі — CSS Modules.

## Як почати

Потрібні Node.js 20+ і npm.

```bash
git clone https://github.com/tony-kobs/nmt.in.ua.git
cd nmt.in.ua
git checkout dev
npm install
npm run dev
```

Локально сайт відкриється на [http://localhost:3000](http://localhost:3000).

Код сторінок лежить у `src/app/`. Після змін сторінка оновлюється сама.

## Команди

| Команда | Що робить |
| --- | --- |
| `npm run dev` | локальна розробка |
| `npm run build` | продакшен-збірка (Webpack) |
| `npm start` | запуск зібраного сайту через `server.js` |
| `npm run lint` | перевірка ESLint |

## Стилі

Нові компоненти стилізуйте через CSS Modules:

```tsx
import styles from "./page.module.css";

<div className={styles.page}>...</div>
```

Глобальний reset і змінні кольорів — у `src/app/globals.css`. Tailwind не використовуємо.

## Гілки

Працюйте тільки з `dev`. У `main` напряму пушити не можна.

```bash
git checkout dev
git pull origin dev
```

Нову задачу краще робити в окремій гілці від `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/коротка-назва
```

Після роботи:

```bash
git add .
git commit -m "Коротко, навіщо зміна"
git push -u origin HEAD
```

Далі відкрийте pull request:

1. `feature/...` → `dev` — перевірка й код-рев’ю
2. `dev` → `main` — реліз на прод

Мердж у `main` можливий лише через pull request.

## Деплой

Після злиття в `main` GitHub Actions сам оновлює **лише** nmt.in.ua: `git pull`, `npm install`, `npm run build`, перезапуск Node.js.

Хід деплою: [Actions](https://github.com/tony-kobs/nmt.in.ua/actions).

Пуш у `dev` сайт на хостингу не оновлює.

## Безпека (без Cloudflare)

На shared-хостингу немає root/iptables і edge-WAF. Об’ємний L3/L4 DDoS цим репо не зупинити — захист у коді відсікає сканери, флуд з одного IP і типові probe-шляхи до важкого рендеру Next.

У коді вже є:

- `server.js` — early `404` на шкідливі path, ліміт тіла, ліміт одночасних запитів, коротші HTTP-таймаути
- `src/middleware.ts` — rate limit по IP + блок probe-шляхів (`429` / `404`)
- `next.config.ts` — security headers (CSP, HSTS, frame deny, nosniff)
- `public/robots.txt` — Disallow для типових CMS-шляхів

### Чеклист панелі хостингу (adm.tools)

1. Node.js → для nmt.in.ua увімкни **«Додавати до команди запуску параметри»**: `--port=3000 --host=127.1.10.37`
2. SSL для домену увімкнений
3. SSH: лише ключі; пароль вимкни, якщо панель дозволяє
4. Не клади `.env` і секрети в `www/`
5. Якщо в тарифі є ModSecurity / антибот / ліміт запитів — увімкни для сайту
6. Після «Перезапустити» перевір, що https://nmt.in.ua відкривається (не 502)

## Структура

```
src/app/                      маршрути дашборду + SEO metadata
src/app/api/import/           HTTP API для модуля 2 (імпорт)
src/components/dashboard/     Header, Sidebar, stubs UI
src/constants/                навігація, SEO
src/modules/content-import/   модуль 2 — CSV/JSON → БД
src/modules/testing/          модуль 3 — тести / тренажери
src/modules/recommendations/  модуль 4 — рекомендації
src/middleware.ts             rate limit + блок probe-шляхів
src/lib/security.ts           спільні правила path/IP
public/                       статичні файли, decor/, robots.txt
server.js                     hardened запуск на хостингу
deploy.sh                     автодеплой (лише nmt.in.ua)
```

## Модулі команди — куди підключатись

Працюйте від `dev` у гілках `feat/...`. Тонкі сторінки в `src/app/` лише рендерять UI; бізнес-логіка — у `src/modules/*` (як у [nmt-test-frontend](https://github.com/tony-kobs/nmt-test-frontend): logic не в `app/`).

### 2. Імпорт (CSV, JSON → БД)

| Що | Де |
| --- | --- |
| Методи парсингу й запису в БД | [`src/modules/content-import/index.ts`](src/modules/content-import/index.ts) — `parseCsv`, `parseJson`, `importToDatabase`, `runContentImport` |
| HTTP endpoint | [`src/app/api/import/route.ts`](src/app/api/import/route.ts) — `POST` (зараз `501`) |
| UI (опційно) | майбутня адмінка або блок у `/settings` |

Як зробити:

1. Реалізувати `parseCsv` / `parseJson` + валідацію схеми завдань.
2. Підключити ORM/клієнт БД і `importToDatabase` (upsert тем і питань).
3. У `POST` `api/import` прийняти `multipart/form-data` і викликати `runContentImport`.
4. Не імпортувати секрети БД в клієнтські компоненти — лише Server Actions / Route Handlers.

```ts
import { runContentImport } from "@/modules/content-import";
// у route.ts / server action:
await runContentImport(file, "csv");
```

### 3. Тести + інтерактивні тренажери

| Що | Де |
| --- | --- |
| Логіка сесій / перевірка відповідей | [`src/modules/testing/index.ts`](src/modules/testing/index.ts) — `startTopicTest`, `checkAnswer`, `finishTrainerSession`, `startNmtSimulator` |
| UI «Тест за темою» | [`src/components/dashboard/TopicTestStart`](src/components/dashboard/TopicTestStart) + маршрут `/` |
| Симулятор НМТ | маршрут `/simulator` → замінити `StubPage` на ваш UI |
| Задачник | маршрут `/problems` → замінити `StubPage` |

Як зробити:

1. На «Старт» у `TopicTestStart` викликати `startTopicTest({ topicId, questionCount })`.
2. Рендер питання / відповідей — нові компоненти в `src/components/testing/` (або `trainers/`).
3. Після відповіді — `checkAnswer`; по завершенню — `finishTrainerSession`.
4. Повний НМТ — `startNmtSimulator` і сторінка `/simulator`.
5. Банк питань береться з БД (після модуля 2) або тимчасово з `src/data/`.

```ts
import { startTopicTest, checkAnswer, finishTrainerSession } from "@/modules/testing";
```

### 4. Рекомендаційна система

| Що | Де |
| --- | --- |
| Алгоритм рекомендацій | [`src/modules/recommendations/index.ts`](src/modules/recommendations/index.ts) — `recommendNextActions`, `persistRecommendations` |
| Показ у UI | `/results`, `/sessions`; опційно `RecentResults` |
| Тригер | після `finishTrainerSession` (модуль 3) передати snapshot результатів |

Як зробити:

1. Зібрати `StudentResultSnapshot` (бали по темах, час).
2. `recommendNextActions(snapshot)` → список дій з `href` на існуючі маршрути (`/`, `/materials`, `/consultations`, …).
3. Відрендерити картки рекомендацій на `/results` (і за потреби `/sessions`).
4. За потреби зберегти через `persistRecommendations` на сервері.

```ts
import { recommendNextActions } from "@/modules/recommendations";

const actions = recommendNextActions(snapshot);
```

### Швидка мапа маршрутів → модуль

| Маршрут | Заглушка зараз | Модуль |
| --- | --- | --- |
| `/` | `TopicTestStart` | 3 (+ дані з 2) |
| `/results` | `StubPage` | 4 (+ статистика з 3) |
| `/sessions` | `StubPage` | 3, 4 |
| `/simulator` | `StubPage` | 3 |
| `/materials` | `StubPage` | контент (після 2) |
| `/problems` | `StubPage` | 3 |
| `/settings` | `StubPage` | профіль; опційно UI імпорту (2) |
| `/consultations` | `StubPage` | дія з рекомендацій (4) |
| `POST /api/import` | `501` | 2 |
