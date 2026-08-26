# nmt.in.ua

Сайт [nmt.in.ua](https://nmt.in.ua) на Next.js 16 (App Router, TypeScript). Стилі — CSS Modules, без Tailwind.

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
src/app/          сторінки, layout, CSS Modules
src/middleware.ts rate limit + блок probe-шляхів
src/lib/security.ts спільні правила path/IP
public/           статичні файли + robots.txt
server.js         hardened запуск на хостингу
deploy.sh         скрипт автодеплою (тільки nmt.in.ua)
.github/workflows/deploy.yml
```
