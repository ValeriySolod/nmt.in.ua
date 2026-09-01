# Таски ментора — nmt.in.ua

**Репозиторій:** `tony-kobs/nmt.in.ua`  
**Гілка:** `dev` → `feat/...` → PR у `dev`  
**Правила:** логіка в `src/modules/*`, UI в `src/components/*`, тонкі сторінки в `src/app/*`. Креденшли лише в `.env.local`, не в git.

**Залежності модулів:** `2 (контент) → 3 (тест) → 4 (рекомендації) → 5 (auth)`; модуль `1` збирає UI навколо них.

---

## Стан на зараз (оновлено 2026-09-01)

| Область | Статус |
| --- | --- |
| **Модуль 1** | ✅ `DashboardShell`, `/results`, `/sessions`, SEO |
| **Модуль 2** | ✅ Імпорт API, `MAX_BODY_BYTES` на проді, UI на `/settings` (admin) |
| **Модуль 3** | ✅ Topic-test MVP (standard + Ultimate, таймер, розбір помилок) |
| **Модуль 4** | ✅ MVP + mentor sessions (4.8), граф тем (4.9), рекомендації на reopen |
| **Модуль 5 (Auth)** | ✅ ролі student/teacher/admin, `app_users`, middleware, демо-логіни |
| **Тести** | 192 pass (`npm test`), build OK |

**Що працює end-to-end:** `/login` → головна → тест → відповіді → фініш з % і рекомендаціями → auto-сесії на `/sessions` → `/results`, sidebar; teacher/admin — mentor assign; admin — імпорт.

**Залишилось:** симулятор (3.8), задачник (3.9), stub-сторінки (`/materials`, `/consultations`).

---

## Модуль 3. Тест + тренажери — залишилось

### Таска 3.8 — Симулятор НМТ

**Мета:** `/simulator` — окремий flow: ~22 завдання, таймер, інший `session_type`.

**Кроки (outline):**
1. `startNmtSimulator()` — аналог `startTopicTest`, але `session_type` ≠ topic, набір завдань з усіх/обраних тем, `tasks_number ≈ 22`.
2. Замінити stub на `/simulator` → форма старту + редірект `/session/[id]` або `/simulator/[id]`.
3. Спільний `TopicTrainer` з пропом `mode: 'topic' | 'nmt'` (таймер, правила навігації).
4. Окремі метадані в `task_sessions` для відображення на `/sessions`.

**Acceptance:** симулятор стартує окремо від короткого тесту; не ламає topic-test flow.

**Файли:** `src/modules/testing/index.ts` (`startNmtSimulator`), `src/app/simulator/page.tsx`, тренажер.

**Пріоритет:** Later.

---

### Таска 3.9 — Задачник

**Мета:** `/problems` — перегляд банку `quiz_tasks` поза сесією, з перевіркою через той самий `checkAnswer`-подібний flow (без `task_sessions` або з «віртуальною» one-off сесією — узгодити).

**Кроки (outline):**
1. `getProblemsByTheme(themeId, page)` — пагінація, без `right_answer_n`.
2. UI: фільтр теми, список, картка завдання з 4 варіантами.
3. Перевірка: або окремий `checkProblemAnswer(taskId, answer)` без сесії, або міні-сесія на 1 task.
4. Reuse стилів від `TopicTrainer`.

**Acceptance:** фільтр по темі; відкриття завдання; перевірка відповіді на сервері.

**Файли:** `src/modules/testing/` (нові query/action), `src/app/problems/page.tsx`, компоненти в `src/components/`.

**Пріоритет:** Later.

---

## Stub-сторінки (модуль 1)

| Маршрут | Зараз | Що зробити |
| --- | --- | --- |
| `/simulator` | `NavStubPage` | таска **3.8** |
| `/problems` | `NavStubPage` | таска **3.9** |
| `/materials` | `NavStubPage` | контент або лінки на матеріали (узгодити з ментором) |
| `/consultations` | `NavStubPage` | форма запису / контакти (узгодити) |

---

## Auth (реалізовано — модуль 5)

**Ролі:** учень (`student`), викладач (`teacher`), адмін (`admin`).

**Механізм:** підписаний cookie `nmt_session` (HMAC, 7 днів), таблиця `app_users` у MySQL (автостворення + seed демо-акаунтів; окремо від legacy `users` на хостингу).

**Env:** `SESSION_SECRET` (обовʼязково на production).

**Демо-логіни** (пароль `demo123` для всіх):

| Логін | Роль | Ім'я |
| --- | --- | --- |
| `demo-student` | Учень | Олена Коваленко |
| `demo-teacher` | Викладач | Ігор Петренко |
| `demo-admin` | Адмін | Адміністратор |

**Захист маршрутів:** middleware редіректить неавторизованих на `/login`; `/settings` — лише admin.

**Скидання демо-даних:** `npm run reset-demo-student` або `scripts/sql/002_reset_demo_student.sql`.

**Acceptance:**
- [x] User A не бачить сесії User B (`user_id` у запитах + ownership у `getSessionTasks`).
- [x] Усі Server Actions використовують auth context (`requireUserId()`).
- [x] Header показує реальне ім'я та роль.
- [x] Імпорт контенту доступний лише admin (middleware + Server Action).

---

## Порядок робіт

| Черга | Таски | Статус |
| --- | --- | --- |
| 1 | **3.8** симулятор НМТ | ❌ |
| 2 | **3.9** задачник | ❌ |
| 3 | Stub `/materials`, `/consultations` | ❌ |
| 4 | **Auth** + admin для імпорту | ✅ |

---

## Файли-орієнтири

| Модуль | Шляхи |
| --- | --- |
| 1 | `src/components/dashboard/*`, `src/constants/navigation.ts`, `src/app/*/page.tsx` |
| 2 | `src/modules/content-import/*`, `src/app/api/import/route.ts`, `src/app/settings/` |
| 3 | `src/modules/testing/*`, `src/components/testing/TopicTrainer/*`, `src/app/session/[id]/page.tsx` |
| 4 | `src/modules/recommendations/*`, `/results`, `/sessions`, `RecentResults`, `POST /api/admin/sessions` |
| 5 | `src/modules/auth/*`, `src/app/login/`, `src/middleware.ts`, `scripts/sql/001_app_users.sql` |
| БД | `quiz_tasks`, `task_sessions`, `tasks2session`, `themes`, `theme_connections`, `app_users` |

### Довідка: ключові поля БД

| Таблиця | Поле | Примітка |
| --- | --- | --- |
| `app_users` | `login`, `role` | auth; окремо від legacy `users` |
| `quiz_tasks` | `right_answer_n` | 1–4, **тільки server** |
| `tasks2session` | `status` | `0` при створенні; після check → `1`/`-1` |
| `task_sessions` | `session_status` | `1` completed, `2` created, `3` planned |
| `task_sessions` | `session_type` | `1` user, `2` auto, `3` mentor |
| `task_sessions` | `right_number`, `time` | заповнюються при finish |
