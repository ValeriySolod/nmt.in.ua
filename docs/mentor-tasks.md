# Таски ментора — nmt.in.ua

**Репозиторій:** `tony-kobs/nmt.in.ua`  
**Гілка:** `dev` → `feat/...` → PR у `dev`  
**Правила:** логіка в `src/modules/*`, UI в `src/components/*`, тонкі сторінки в `src/app/*`. Креденшли лише в `.env.local`, не в git.

**Залежності модулів:** `2 (контент) → 3 (тест) → 4 (рекомендації)`; модуль `1` збирає UI навколо них.

---

## Стан на зараз (перевірено)

| Область | Статус |
| --- | --- |
| **Модуль 1** | ✅ Готово: `DashboardShell`, `/results`, `/sessions`, stub-сторінки, лід `/` → `/session/{id}` |
| **Модуль 2** | ✅ Код імпорту + локальна БД; залишилось прод-налаштування та опційний UI |
| **Модуль 3** | 🟡 Старт тесту, `getSessionTasks`, UI тренажера (mock-відповіді); немає `checkAnswer` / `finishTrainerSession` / таймера |
| **Модуль 4** | ⬜ Заглушки в `src/modules/recommendations/` |
| **Тести** | 97 pass (`npm test`) |
| **Auth** | `DEMO_USER_ID = 1` у `actions.ts`, `results/types.ts`, `sessions/types.ts` |

**Що вже працює end-to-end:** головна → старт за темою → `/session/{id}` з реальними завданнями з БД; `/results` і `/sessions` читають `task_sessions`; усі пункти меню відкриваються.

**Що блокує demo ментору:** відповіді не перевіряються, сесія не завершується з %, таблиці results/sessions без живих метрик після проходження, рекомендацій немає.

---

## Модуль 2. Імпорт — залишилось

### Таска 2.3 — Прод: ліміт тіла запиту

**Мета:** реальний CSV/JSON-імпорт на хостингу не має відсікатися на рівні `server.js` до того, як запит дійде до Next.js.

**Контекст:**
- `server.js` (рядок ~29): дефолт `MAX_BODY_BYTES = 64 * 1024` (64 КіБ).
- `src/modules/content-import/schema.ts`: `MAX_REQUEST_BODY_BYTES = 8 МіБ`, `MAX_TOTAL_UPLOAD_BYTES = 5 МіБ`.
- `.env.example` уже містить `MAX_BODY_BYTES=8388608`.
- Локально імпорт працює через `next dev` (без `server.js`); на проді — через `node server.js`.

**Кроки:**
1. У панелі хостингу (або `.env` на сервері) задати `MAX_BODY_BYTES=8388608`.
2. Перезапустити Node-процес після зміни змінної.
3. Smoke на проді: `curl -X POST .../api/import` з файлом ~100 КіБ + валідний `Authorization: Bearer ...`.
4. Негативний кейс: файл > 8 МіБ → очікувано `413` від Next/route, не «тихий» обрив з'єднання.

**Acceptance:**
- [ ] Імпорт типового CSV (сотні рядків) на проді повертає `200`/`400` (валідація), але **не** `413` від `server.js`.
- [ ] У логах немає відхилення запиту до Next через `Content-Length > MAX_BODY_BYTES`.

**Файли:** `server.js`, `.env.example`, README (секція про `MAX_BODY_BYTES`).

**Пріоритет:** Must перед прод-демо імпорту.

---

### Таска 2.4 (опційно) — UI імпорту

**Мета:** адмін може завантажити CSV/JSON через браузер, без `curl`.

**Контекст:**
- Backend готовий: `POST /api/import` (`src/app/api/import/route.ts`), Bearer `CONTENT_IMPORT_API_KEY`.
- `/settings` зараз — stub (`NavStubPage`).

**Кроки:**
1. Обрати місце: `/settings` (секція «Імпорт контенту») або окремий `/admin/import` з `noIndex`.
2. Client-компонент: `<form encType="multipart/form-data">`, поля `themes`, `quiz_tasks`, `theme_connections` (як у README).
3. Ключ **не** зберігати в localStorage — або server action з ключем з env (тільки server-side), або окремий admin login (Later).
4. Показати результат: `{ ok, imported, errors[] }` з відповіді API.
5. Без ключа/ролі — `401` з зрозумілим повідомленням в UI.

**Acceptance:**
- [ ] Успішний імпорт маленького файлу через UI → рядки в БД.
- [ ] Запит без авторизації → відмова в UI, без витоку ключа.
- [ ] Помилки валідації показуються списком (як у JSON-відповіді API).

**Файли:** `src/app/settings/page.tsx` або `src/app/admin/import/`, `src/components/.../ContentImportForm.tsx`.

**Пріоритет:** Later.

---

## Модуль 3. Тест + тренажери — залишилось

**Вже є:**
- `startTopicTest` — транзакція: `task_sessions` + N× `tasks2session`, `status = 0` (не відповіли).
- `getSessionTasks` — JOIN без `right_answer_n` / `comments`.
- `TopicTrainer` — локальний state, `mockSubmitAnswer`, без сервера.
- `/sessions` — `getLearningSessions()`; `/results` — `getTopicResults()`.
- Константи БД (верифіковані): `session_status`: 1=completed, 2=created, 3=planned; `session_type`: 1=user, 2=auto, 3=mentor.

---

### Таска 3.3 — `checkAnswer` (сервер)

**Мета:** учень обирає варіант 1–4 → сервер перевіряє проти `quiz_tasks.right_answer_n` → оновлює `tasks2session.status`; правильна відповідь **не** потрапляє на клієнт до перевірки.

**Вхід (пропозиція):**
```ts
{ sessionId: number; mappingId: number; answerNumber: 1|2|3|4 }
```
`mappingId` = `tasks2session.id` (вже є в `SessionTask.mappingId`).

**Статуси `tasks2session.status` (узгодити з ментором, зараз у коді лише `0`):**
| Значення | Сенс (пропозиція) |
| --- | --- |
| `0` | Не відповіли (при створенні сесії) |
| `1` | Вірно |
| `-1` | Невірно |

**Кроки реалізації:**
1. **`src/modules/testing/checkAnswer.ts`**
   - Валідація: positive int для `sessionId`, `mappingId`; `answerNumber` ∈ {1,2,3,4}.
   - SQL (одна транзакція):
     ```sql
     SELECT t2s.id, t2s.session_id, t2s.status, t2s.user_id, qt.right_answer_n
     FROM tasks2session t2s
     INNER JOIN quiz_tasks qt ON qt.id = t2s.task_id
     WHERE t2s.id = ? AND t2s.session_id = ? AND t2s.user_id = ?
     ```
   - Перевірити: сесія належить `DEMO_USER_ID`; `task_sessions.session_status != completed` (або узгодити повторну відповідь).
   - Якщо `status != 0` — ідемпотентність: повернути попередній результат **без** повторного UPDATE або заборонити зміну (узгодити).
   - `UPDATE tasks2session SET status = ? WHERE id = ?`.
   - Відповідь клієнту: `{ correct: boolean }` **без** `right_answer_n`.
2. **`checkAnswerAction`** у `src/modules/testing/actions.ts` (аналог `startTopicTestAction`).
3. **`TopicTrainer.tsx`**
   - Замінити `mockSubmitAnswer` на виклик action при виборі варіанту (або на «Підтвердити»).
   - UI feedback: «Вірно» / «Невірно» після відповіді сервера; disabled повторний клік під час pending.
   - Оптимістично **не** показувати правильність до відповіді сервера.
4. **Unit-тести:** вірна/невірна відповідь; чужа сесія; повторна відповідь; mapping не з цієї сесії.

**Acceptance:**
- [ ] Після кліку в БД `tasks2session.status` = `1` або `-1`.
- [ ] У DevTools Network / serialized props немає `right_answer_n`.
- [ ] `npm test` — нові тести green.

**Залежності:** немає (блокує 3.4).

**Файли:** `checkAnswer.ts`, `actions.ts`, `TopicTrainer.tsx`, `types.ts` (action state).

---

### Таска 3.4 — `finishTrainerSession` + підсумок

**Мета:** після останнього завдання — зафіксувати результат у `task_sessions`, показати екран підсумку, оновити дані для `/results` і `/sessions`.

**Що писати в БД (`task_sessions`):**
| Поле | Значення |
| --- | --- |
| `right_number` | COUNT `tasks2session` з `status = 1` для `session_id` |
| `tasks_number` | вже задано при старті (можна перерахувати для консистентності) |
| `time` | секунди (див. 3.5; якщо таймер ще ні — можна `0` або мінімальний placeholder) |
| `session_status` | `1` (completed) |
| `start_time` | unix timestamp старту (якщо ще `0` — встановити при фініші або в 3.5) |

**Кроки реалізації:**
1. **`src/modules/testing/finishTrainerSession.ts`**
   - Вхід: `{ sessionId, userId }`.
   - Перевірити: сесія існує, `user_id` збігається, не completed (або ідемпотентний return якщо вже completed).
   - Перевірити: усі mapping мають `status != 0` (або дозволити фініш з неповними — узгодити; для MVP — **усі відповіли**).
   - Агрегат з `tasks2session`; `UPDATE task_sessions SET ...`.
   - Повернути: `{ sessionId, rightNumber, tasksNumber, percent, timeSec, themeId, themeName }`.
2. **`finishTrainerSessionAction`** + кнопка «Завершити тест» в `TopicTrainer` (коли `allAnswered`).
3. **UI підсумку** — варіанти:
   - **A:** окремий компонент `TopicTrainerSummary` на тій же `/session/[id]` після success state;
   - **B:** редірект `/session/[id]/results`.
   - Показати: вірно/всього, %, час; лінки «Результати за темами» → `/results`, «Мої сесії» → `/sessions`, «Новий тест» → `/`.
4. **Ідемпотентність:** повторний POST finish на completed-сесію → той самий підсумок без подвійного increment (або `409`).

**Acceptance:**
- [ ] Після фінішу в phpMyAdmin: `session_status = 1`, `right_number` відповідає відповідям.
- [ ] `/results` показує % для теми (не «—»), якщо `time > 0` — і швидкість.
- [ ] `/sessions` — рядок «Виконано» з % (логіка вже в `resolveSessionDisplayStatus`).
- [ ] Unit + integration тести на агрегацію.

**Залежності:** 3.3 (без statuses фініш meaningless).

**Файли:** `finishTrainerSession.ts`, `actions.ts`, `TopicTrainer.tsx`, новий `TopicTrainerSummary/` (опційно).

---

### Таска 3.5 — Таймер / час

**Мета:** у завершеній сесії `task_sessions.time > 0`; бажано фіксувати `start_time` при вході в тренажер.

**Контекст:** зараз при старті `start_time = 0`, `time = 0` (`startTopicTest.ts`).

**Кроки (пропозиція MVP):**
1. **Старт часу:** при першому завантаженні `/session/[id]` (server) або в `TopicTrainer` useEffect — server action `markSessionStarted(sessionId)`:
   - `UPDATE task_sessions SET start_time = UNIX_TIMESTAMP() WHERE id = ? AND start_time = 0`.
2. **Клієнтський таймер:** `useRef` + `setInterval` або `performance.now()`; показ «Час: MM:SS» у header тренажера.
3. **Фініш:** передати `elapsedSec` у `finishTrainerSession` **або** порахувати на сервері `now - start_time` (сервер надійніше проти читів).
4. **Час на питання (optional):** окреме поле в БД немає — можна логувати в `tasks2session` пізніше або не робити в MVP.

**Acceptance:**
- [ ] Завершена сесія: `time > 0` в БД.
- [ ] `/sessions` — колонка «Час» не «—»; «Час/завдання» пораховано.
- [ ] `/results` — «Швидкість с/завдання» оновлюється після тестів.

**Залежності:** краще разом з 3.4; можна частково до фінішу.

**Файли:** `startTopicTest.ts` (опційно), новий `markSessionStarted.ts`, `TopicTrainer.tsx`, `finishTrainerSession.ts`.

---

### Таска 3.8 (пізніше) — Симулятор НМТ

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

### Таска 3.9 (пізніше) — Задачник

**Мета:** `/problems` — перегляд банку `quiz_tasks` поза сесією, з перевіркою через той самий `checkAnswer`-подібний flow (без `task_sessions` або з «віртуальною» one-off сесією — узгодити).

**Кроки (outline):**
1. `getProblemsByTheme(themeId, page)` — пагінація, без `right_answer_n`.
2. UI: фільтр теми, список, картка завдання з 4 варіантами.
3. Перевірка: або окремий `checkProblemAnswer(taskId, answer)` без сесії, або міні-сесія на 1 task.
4. Reuse стилів від `TopicTrainer`.

**Acceptance:** фільтр по темі; відкриття завдання; перевірка відповіді на сервері.

**Пріоритет:** Later.

---

| # | Пріоритет |
| --- | --- |
| 3.3–3.4 | Must (MVP) |
| 3.5 | Should |
| 3.8–3.9 | Later |

**Demo модуля 3:** відповіді → фініш з % у `task_sessions` → живі дані на `/results` і `/sessions`.

---

## Модуль 4. Рекомендаційна система

**Залежність:** коректні `task_sessions` після 3.3–3.4 (`right_number`, `time`, `session_status = 1`).

**Заглушки:** `src/modules/recommendations/index.ts` — типи `StudentResultSnapshot`, `RecommendedAction`; `recommendNextActions` / `persistRecommendations` кидають помилку.

---

### Таска 4.1 — Агрегат статистики по темах

**Мета:** одна функція збирає snapshot учня для правил рекомендацій.

**Пропозиція API:**
```ts
getStudentTopicStats(userId: number): Promise<StudentResultSnapshot>
```
```ts
type StudentResultSnapshot = {
  userId: number;
  topicScores: Array<{
    topicId: number;
    topicName: string;
    overallPercent: number | null;  // середнє по завершених сесіях теми
    lastPercent: number | null;     // остання сесія
    avgTimeSec: number | null;
    attemptCount: number;
  }>;
  lastSessionId?: number;
};
```

**Кроки:**
1. Новий файл `src/modules/recommendations/getStudentTopicStats.ts`.
2. SQL: JOIN `task_sessions` + `themes`, фільтр `user_id`, `session_status = 1` (або евристика completed як у `sessions/types.ts`).
3. Переиспользовати логіку з `buildTopicResultRows` або викликати `getTopicResults` + map.
4. Теми без сесій → `overallPercent: null`, не виключати з масиву (або лише теми з спробами — узгодити).
5. Unit-тести на фіксованому наборі rows.

**Acceptance:**
- [ ] Для user з 2 завершеними сесіями по темі A — коректний `overallPercent` і `lastPercent`.
- [ ] Порожній user → `topicScores` з null-метриками або порожній масив + flag.

**Файли:** `getStudentTopicStats.ts`, `types.ts`, тести.

**Пріоритет:** Must (MVP).

---

### Таска 4.2 — `recommendNextActions` (евристики MVP)

**Мета:** детермінований список 1–3 наступних дій без ML.

**Правила (з docs, уточнити пороги з ментором):**

| Умова | Дія `type` | `href` (приклад) |
| --- | --- | --- |
| Немає жодної завершеної сесії | CTA «Перший тест» | `/` |
| `% < 40` по темі (overall або last) | `topic-test` | `/?theme={id}` або planned session |
| `40–69` або повільно (> X с/завд) | `problems` / `materials` | `/problems?theme=`, `/materials` |
| Усі теми з спробами ≥ 70% | `simulator` | `/simulator` |
| Стабільно < 40 на 3+ спробах | `consultation` | `/consultations` |

**Кроки:**
1. Реалізувати в `src/modules/recommendations/recommendNextActions.ts` — pure function від `StudentResultSnapshot`.
2. Сортування за `priority` (1 = найважливіше).
3. Обмежити top-3 для UI.
4. Table-driven тести: snapshot fixture → очікуваний масив `RecommendedAction[]`.

**Acceptance:**
- [ ] Один і той самий snapshot → стабільний output.
- [ ] Empty snapshot → `[]` або одна CTA «Пройти перший тест».
- [ ] ≥5 unit-тестів на граничні пороги (39/40/69/70).

**Файли:** `recommendNextActions.ts`, тести; оновити `index.ts` (прибрати throw).

**Пріоритет:** Must (MVP).

---

### Таска 4.3 — Тригер після фінішу тесту

**Мета:** одразу після завершення тесту учень бачить «Що далі».

**Кроки:**
1. В кінці `finishTrainerSession` (або в action після commit):
   ```ts
   const stats = await getStudentTopicStats(userId);
   const actions = recommendNextActions(stats);
   ```
2. Повернути `{ ...summary, recommendations: actions }` з action.
3. **`TopicTrainerSummary`** (з 3.4): секція «Рекомендуємо далі» — 1–3 картки з `title`, `reason`, кнопка → `href`.
4. Не викликати `persistRecommendations` поки немає 4.5 (опційно — only in-memory на екрані підсумку).

**Acceptance:**
- [ ] Після слабкого тесту (< 40%) — рекомендація «повторити тему».
- [ ] Після сильного — simulator / наступна тема.
- [ ] Блок видно без переходу на `/results`.

**Залежності:** 3.4, 4.1, 4.2.

**Пріоритет:** Must (MVP).

---

### Таска 4.4 — UI рекомендацій на `/results`

**Мета:** постійний блок рекомендацій під таблицею прогресу.

**Кроки:**
1. Компонент `RecommendedActionsPanel` у `src/components/dashboard/`.
2. На `src/app/results/page.tsx`: parallel fetch `getTopicResults()` + `getStudentTopicStats()` + `recommendNextActions()`.
3. Картки: іконка/тип, заголовок, reason, link button.
4. **Empty-state:** «Пройдіть перший тест, щоб отримати рекомендації» + лінк на `/`.
5. Стилі — узгодити з `TopicResultsTable` (border, shadow, green accents).

**Acceptance:**
- [ ] Є статистика в таблиці + рекомендації під нею.
- [ ] Без спроб — empty-state, не помилка.
- [ ] Рекомендації оновлюються після нового тесту (refresh сторінки).

**Файли:** `RecommendedActionsPanel.tsx`, `results/page.tsx`.

**Пріоритет:** Must (MVP).

---

### Таска 4.5 — `persistRecommendations` + сесії «Авто»

**Мета:** рекомендація «пройти тест теми X» перетворюється на запланований рядок у БД.

**Варіанти схеми (узгодити з ментором):**

**A — через `task_sessions` (рекомендовано для MVP):**
```sql
INSERT INTO task_sessions (
  user_id, session_type, theme_id, tasks_number,
  right_number, time, session_status, start_time
) VALUES (?, 2, ?, 10, 0, 0, 3, 0)
-- session_type = 2 (AUTO), session_status = 3 (PLANNED)
```

**B — окрема таблиця `planned_actions`** — гнучкіше, більше міграцій.

**Кроки:**
1. `persistRecommendations(userId, actions)` — для кожного `topic-test` action створити planned session, якщо ще немає duplicate (та сама theme + planned + auto).
2. Дедуплікація: не створювати 5 однакових «Авто» для теми 3.
3. При новому фініші — перерахунок: скасувати застарілі planned / додати нові (політика — узгодити).

**Acceptance:**
- [ ] Після фінішу слабкого тесту в БД з'являється `task_sessions` з `session_type=2`, `session_status=3`.
- [ ] Повторний фініш не плодить дублікати.

**Файли:** `persistRecommendations.ts`, можливо SQL у `src/modules/sessions/`.

**Пріоритет:** Should.

---

### Таска 4.6 — «Авто» на `/sessions`

**Мета:** заплановані авто-сесії видно в таблиці; **Старт** запускає тест; **×** скасовує.

**Контекст:** UI вже є — `LearningSessionsTable` показує `createdByLabel` «Авто» для `session_type=2`; **Старт** → `/session/{id}`; **×** → `cancelLearningSession`.

**Що доробити:**
1. **Старт для planned:** зараз `/session/{id}` очікує вже створені `tasks2session`. Для planned-сесії без mappings потрібен **`startPlannedSession(sessionId)`**:
   - перевірити `session_status = 3`;
   - викликати логіку вибору tasks (як `startTopicTest`, але reuse `session_id`);
   - оновити `session_status = 2` (created), `tasks_number`.
2. Або при persist одразу створювати mappings (важче скасувати) — узгодити.
3. Переконатися, що **×** працює для planned (вже має — `cancelLearningSession`).

**Acceptance:**
- [ ] Рядок «Авто / Заплановано» → Старт → тренажер з питаннями.
- [ ] × прибирає planned-сесію з таблиці.

**Залежності:** 4.5, 3.3 (для повного flow).

**Пріоритет:** Should.

---

### Таска 4.7 — Живий `RecentResults`

**Мета:** права колонка (`RecentResults`) показує останні N завершених тестів з БД.

**Контекст:** зараз `PLACEHOLDER_RECENT_RESULTS` у `navigation.ts`.

**Кроки:**
1. `getRecentResults(userId, limit = 4)` у `src/modules/results/` або `recommendations/`:
   ```sql
   SELECT t.name, ts.right_number, ts.tasks_number, ts.id
   FROM task_sessions ts
   JOIN themes t ON t.id = ts.theme_id
   WHERE ts.user_id = ? AND ts.session_status = 1
   ORDER BY ts.id DESC LIMIT ?
   ```
2. Map → `{ topic: themeName, score: percent }`.
3. `RecentResults` — server component або fetch у `DashboardShell` / layout (обережно з perf — limit 4).
4. Прибрати placeholder або fallback якщо порожньо.

**Acceptance:**
- [ ] Після 1+ завершених тестів сайдбар показує реальні % і назви тем.
- [ ] До тестів — hint «Дані зʼявляться після перших тестів» (вже є текст).

**Файли:** `RecentResults.tsx`, `DashboardShell.tsx`, новий query module.

**Пріоритет:** Should.

---

### Таска 4.8 (пізніше) — Призначення ментора

**Мета:** admin/ментор створює planned-сесію з `session_type = 3` (Ментор).

**Кроки:** admin endpoint `POST /api/admin/sessions` (auth!), body `{ userId, themeId }`; insert як у 4.5 але type=3. UI на `/sessions` вже показує «Ментор».

**Acceptance:** рядок Ментор з Старт/×; без auth — недоступно.

**Пріоритет:** Later.

---

### Таска 4.9 (пізніше) — Граф тем (`theme_connections`)

**Мета:** при високому % по темі A рекомендувати тему B за ребром `vertex_start → vertex_finish`.

**Кроки:**
1. Завантажити `theme_connections` для тем з `overallPercent >= 70`.
2. У `recommendNextActions` додати правило: якщо A освоєна → `topic-test` для B (якщо B ще слабка).
3. Тести з fixture graph.

**Acceptance:** тема A сильна → в рекомендаціях з'являється тема B з графа.

**Пріоритет:** Later.

---

| # | Пріоритет |
| --- | --- |
| 4.1–4.4 | Must (MVP) |
| 4.5–4.7 | Should |
| 4.8–4.9 | Later |

**Demo модуля 4:** після слабкого тесту — «повторити тему X» на екрані підсумку та `/results`; ідеально — «Авто»-сесія на `/sessions`.

---

## Auth (після MVP)

**Мета:** замінити хардкод `DEMO_USER_ID = 1` на реального користувача.

**Де зараз `DEMO_USER_ID`:**
- `src/modules/testing/actions.ts` — `startTopicTestAction`
- `src/modules/results/types.ts` — `getTopicResults()`
- `src/modules/sessions/types.ts` — `getLearningSessions()`, `cancelLearningSession`
- Майбутні: `checkAnswer`, `finishTrainerSession`, `getStudentTopicStats`

**Кроки:**
1. Обрати механізм (sessions/JWT/OAuth — узгодити з ментором і хостингом).
2. `getCurrentUserId()` server-only — повертає id або redirect `/login`.
3. Прибрати прийом `userId` з FormData/API; завжди trusted server context.
4. Middleware: захист `/session/*`, `/results`, `/sessions` (optional для MVP demo).

**Acceptance:**
- [ ] User A не бачить сесії User B.
- [ ] Усі Server Actions використовують auth context.
- [ ] `PLACEHOLDER_USER` в header замінено на реальне ім'я.

**Пріоритет:** після MVP demo.

---

## Порядок робіт

| Черга | Таски | Навіщо |
| --- | --- | --- |
| 1 | **3.3** | Відповіді пишуться в БД |
| 2 | **3.4** | Фініш, %, підсумок, живі `/results`/`/sessions` |
| 3 | **3.5** | Час і швидкість у таблицях |
| 4 | **4.1 → 4.2 → 4.3** | Snapshot → правила → блок після тесту |
| 5 | **4.4** | Рекомендації на `/results` |
| 6 | **4.5 → 4.6** | Авто-сесії в БД і Старт |
| 7 | **4.7** | Живий сайдбар |
| 8 | **2.3** | Прод-імпорт |
| 9 | **3.8–3.9, 4.8–4.9, 2.4** | Розширення |
| 10 | **Auth** | Продакшен multi-user |

---

## Критичний шлях (demo ментору)

1. ~~`.env.local` → БД з `quiz_tasks`~~ ✅
2. ~~Старт тесту за темою → питання на екрані~~ ✅
3. **3.3** — клік по відповіді → `tasks2session.status`
4. **3.4** — «Завершити» → `task_sessions.right_number`, `session_status=1`
5. **3.5** (бажано) — `time > 0` → швидкість у `/results`
6. **4.1–4.4** — рекомендації на підсумку та `/results`

---

## Файли-орієнтири

| Модуль | Шляхи |
| --- | --- |
| 1 (готово) | `src/components/dashboard/*`, `src/constants/navigation.ts`, `src/app/*/page.tsx` |
| 2 | `src/modules/content-import/*`, `src/app/api/import/route.ts`, `server.js`, `.env.example` |
| 3 | `src/modules/testing/*`, `src/components/testing/TopicTrainer/*`, `src/app/session/[id]/page.tsx` |
| 4 | `src/modules/recommendations/*`, `/results`, `/sessions`, `RecentResults` |
| БД | `quiz_tasks`, `task_sessions`, `tasks2session`, `themes`, `theme_connections` |

### Довідка: ключові поля БД

| Таблиця | Поле | Примітка |
| --- | --- | --- |
| `quiz_tasks` | `right_answer_n` | 1–4, **тільки server** |
| `tasks2session` | `status` | `0` при створенні; після check → `1`/`-1` |
| `task_sessions` | `session_status` | `1` completed, `2` created, `3` planned |
| `task_sessions` | `session_type` | `1` user, `2` auto, `3` mentor |
| `task_sessions` | `right_number`, `time` | заповнюються при finish (3.4–3.5) |
