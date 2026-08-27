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

- `server.js` — early `404` на шкідливі path, ліміт тіла (`MAX_BODY_BYTES`, за замовчуванням 64 КіБ), ліміт одночасних запитів, коротші HTTP-таймаути
- `src/middleware.ts` — rate limit по IP + блок probe-шляхів (`429` / `404`)
- `next.config.ts` — security headers (CSP, HSTS, frame deny, nosniff)
- `public/robots.txt` — Disallow для типових CMS-шляхів

**`MAX_BODY_BYTES` і `POST /api/import`.** Дефолтний ліміт тіла запиту в `server.js` (64 КіБ) значно менший за максимальний **заявлений** розмір запиту імпорту (8 МіБ, `MAX_REQUEST_BODY_BYTES` у `src/modules/content-import/schema.ts`) — на проді сервер відхилить будь-який реальний CSV/JSON-імпорт ще до Next.js. Щоб імпорт працював, задайте в оточенні хостингу `MAX_BODY_BYTES` **не нижче** за `MAX_REQUEST_BODY_BYTES` — рекомендоване значення `8388608` (8 МіБ), див. `.env.example`. Це число вже включає запас під multipart-накладні витрати (межі частин, заголовки) понад ліміт **вмісту файлів** (5 МіБ, `MAX_TOTAL_UPLOAD_BYTES`) — саме тому 8 МіБ і 5 МіБ це два різних ліміти на різних рівнях, а не одне й те саме число. Ліміт сервера має завжди залишатися не нижчим за ліміт застосунку; занижувати існуючий захист `server.js` не можна.

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
| Методи парсингу й запису в БД | [`src/modules/content-import/`](src/modules/content-import/) — `runContentImport` (фасад), `importToDatabase` |
| HTTP endpoint | [`src/app/api/import/route.ts`](src/app/api/import/route.ts) — `POST` (реалізовано) |
| UI (опційно) | майбутня адмінка або блок у `/settings` |

Реалізовано: `POST /api/import` приймає `multipart/form-data` у двох форматах.

#### Авторизація

Ендпоінт захищений спільним секретом. Кожен запит має містити:

```
Authorization: Bearer <CONTENT_IMPORT_API_KEY>
```

`CONTENT_IMPORT_API_KEY` задається лише на сервері (`.env.local`, ніколи не в репозиторії — див. `.env.example`). Якщо змінна не задана, ендпоінт відхиляє **всі** запити (`401`) — це навмисний fail-closed режим, а не тимчасовий обхід авторизації. Порівняння секрету — константного часу (`crypto.timingSafeEqual` після SHA-256), секрет ніколи не потрапляє в логи чи відповідь.

#### Формат запиту — рівно одна форма

Дозволено рівно один із двох наборів полів форми, без домішування, дублікатів чи зайвих полів:

- CSV: лише `themes`, `themeConnections`, `quizTasks`;
- JSON: лише `file` і `format`.

Запит, що змішує поля обох форматів, дублює поле, або містить невідоме поле — відхиляється (`400`).

#### Формат 1 — три CSV-файли

Поля форми: `themes`, `themeConnections`, `quizTasks` (кожне — файл).

Точні заголовки колонок (порядок важливий):

```
themes.csv:            id,name,description,ord
theme_connections.csv: id,vertex_start,vertex_finish
quiz_tasks.csv:         id,name,task_text,theme_id,answer_1,answer_2,answer_3,answer_4,right_answer_n,comments
```

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Authorization: Bearer $CONTENT_IMPORT_API_KEY" \
  -F "themes=@themes.csv;type=text/csv" \
  -F "themeConnections=@theme_connections.csv;type=text/csv" \
  -F "quizTasks=@quiz_tasks.csv;type=text/csv"
```

#### Формат 2 — один JSON-файл

Поля форми: `file` (JSON-файл) + `format=json`.

Схема документа (ключі об'єктів збігаються з назвами колонок БД):

```json
{
  "themes": [{ "id": 1, "name": "...", "description": "...", "ord": 1 }],
  "themeConnections": [{ "id": 1, "vertex_start": 1, "vertex_finish": 2 }],
  "quizTasks": [
    {
      "id": 1,
      "name": "...",
      "task_text": "...",
      "theme_id": 1,
      "answer_1": "...",
      "answer_2": "...",
      "answer_3": "...",
      "answer_4": "...",
      "right_answer_n": 1,
      "comments": "..."
    }
  ]
}
```

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Authorization: Bearer $CONTENT_IMPORT_API_KEY" \
  -F "file=@import.json;type=application/json" \
  -F "format=json"
```

#### Відповідь і коди статусів

- `200` — успішний імпорт: `{ "ok": true, "inserted": {...}, "updated": {...}, "totalInserted": n, "totalUpdated": n }`.
- `400` — некоректний вхід або помилка валідації (включно зі змішаним форматом, дублікатами чи невідомими полями форми): `{ "ok": false, "errors": ["..."] }`.
- `401` — відсутній або невірний `Authorization: Bearer` (включно з випадком, коли `CONTENT_IMPORT_API_KEY` не задано на сервері).
- `413` — перевищено один із двох лімітів розміру. Перевіряється двічі: спочатку за заголовком `Content-Length` — до розбору `multipart/form-data` — проти `MAX_REQUEST_BODY_BYTES` (8 МіБ, `src/modules/content-import/schema.ts`), який покриває весь HTTP-body **разом** з multipart-межами й заголовками частин; а потім, після розбору, за фактичним сумарним розміром завантажених файлів (`File.size`) проти `MAX_TOTAL_UPLOAD_BYTES` (5 МіБ, той самий файл) — саме цей ліміт стосується лише вмісту файлів. Другу перевірку не можна пропустити навіть коли перша пройшла, бо `Content-Length` може бути відсутнім або невірним.
- `415` — непідтримуваний формат запиту (немає розпізнаваних полів форми, або `format` вказано неправильно).
- `500` — неочікувана помилка сервера/БД. Клієнту повертається лише фіксоване повідомлення; SQL, хост, креденшли й інші деталі ніколи не потрапляють ані у відповідь, ані в логи (`console.error` пише лише операцію й санітизовану категорію помилки).

Валідація перед відкриттям з'єднання з БД: обов'язкові/невідомі поля, цілочисельні значення в межах `INT` MySQL (-2147483648..2147483647), довжина рядків (varchar(100)/varchar(50)), `right_answer_n` у діапазоні 1..4, унікальність id у межах датасету, порожні датасети, а також посилання `quiz_tasks.theme_id` і `theme_connections.vertex_start/vertex_finish` — мають вказувати на тему, яка вже існує в БД або імпортується в цьому ж запиті.

Первинні `id` та посилання на теми (`theme_id`, `vertex_start`, `vertex_finish`) мають бути додатними (`>= 1`). `ord` — порядковий номер теми; `0` є коректним значенням (перша позиція), недопустимі лише від'ємні числа.

Увесь запис виконується в одній транзакції в порядку `themes → theme_connections → quiz_tasks` (upsert за первинним ключем); будь-яка помилка валідації чи SQL відкочує весь імпорт повністю.

Код: [`src/modules/content-import/`](src/modules/content-import/) (`csv.ts`, `json.ts`, `validate.ts`, `db.ts`, `auth.ts`, `logging.ts`, `index.ts`) + [`src/app/api/import/route.ts`](src/app/api/import/route.ts).

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
| `POST /api/import` | реалізовано | 2 |
