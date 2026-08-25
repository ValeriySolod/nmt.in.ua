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

## Структура

```
src/app/          сторінки, layout, CSS Modules
public/           статичні файли
server.js         запуск на хостингу
deploy.sh         скрипт автодеплою (тільки nmt.in.ua)
.github/workflows/deploy.yml
```
