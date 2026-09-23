import type { SqlConnection } from "@/lib/db/mysql";
import {
  AdminContentError,
  ADMIN_TASKS_PAGE_SIZE,
  type AdminQuizTask,
  type AdminQuizTaskInput,
  type AdminQuizTaskListItem,
  type AdminQuizTaskListPage,
  type AdminThemeOption,
} from "./types";

const SQL_ADMIN_THEMES = `
  SELECT t.id, t.code, t.name, t.ord, COUNT(q.id) AS task_count
  FROM themes t
  LEFT JOIN quiz_tasks q ON q.theme_id = t.id
  GROUP BY t.id, t.code, t.name, t.ord
  ORDER BY t.ord ASC, t.id ASC
`;

const SQL_THEME_EXISTS = `SELECT id FROM themes WHERE id = ? LIMIT 1`;

const SQL_LIST_BY_THEME = `
  SELECT id, name, task_text, difficulty
  FROM quiz_tasks
  WHERE theme_id = ?
  ORDER BY id ASC
`;

const SQL_COUNT_BY_THEME = `
  SELECT COUNT(*) AS total
  FROM quiz_tasks
  WHERE theme_id = ?
`;

const SQL_NEIGHBOR_IDS = `
  SELECT
    (SELECT id FROM quiz_tasks
     WHERE theme_id = ? AND id < ?
     ORDER BY id DESC LIMIT 1) AS prev_id,
    (SELECT id FROM quiz_tasks
     WHERE theme_id = ? AND id > ?
     ORDER BY id ASC LIMIT 1) AS next_id
`;

const SQL_GET_BY_ID = `
  SELECT id, name, task_text, theme_id, answer_1, answer_2, answer_3, answer_4,
         right_answer_n, comments, difficulty
  FROM quiz_tasks
  WHERE id = ?
  LIMIT 1
`;

const SQL_NEXT_ID = `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM quiz_tasks`;

const SQL_INSERT = `
  INSERT INTO quiz_tasks
    (id, name, task_text, theme_id, answer_1, answer_2, answer_3, answer_4,
     right_answer_n, comments, difficulty)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const SQL_UPDATE = `
  UPDATE quiz_tasks
  SET name = ?, task_text = ?, theme_id = ?,
      answer_1 = ?, answer_2 = ?, answer_3 = ?, answer_4 = ?,
      right_answer_n = ?, comments = ?, difficulty = ?
  WHERE id = ?
`;

const SQL_DELETE = `DELETE FROM quiz_tasks WHERE id = ?`;

const SQL_USED_IN_SESSIONS = `
  SELECT 1 AS used
  FROM tasks2session
  WHERE task_id = ? AND task_type = 1
  LIMIT 1
`;

type ThemeRow = {
  id: number;
  code: string;
  name: string;
  ord: number;
  task_count: number | string;
};

type ListRow = {
  id: number;
  name: string;
  task_text: string;
  difficulty: number;
};

type TaskRow = {
  id: number;
  name: string;
  task_text: string;
  theme_id: number;
  answer_1: string;
  answer_2: string;
  answer_3: string;
  answer_4: string;
  right_answer_n: number;
  comments: string | null;
  difficulty: number;
};

function mapTask(row: TaskRow): AdminQuizTask {
  const right = row.right_answer_n;
  if (right !== 1 && right !== 2 && right !== 3 && right !== 4) {
    throw new AdminContentError("Corrupt right_answer_n.", "db_error");
  }
  return {
    id: row.id,
    name: row.name.trim(),
    taskText: row.task_text,
    themeId: row.theme_id,
    answer1: row.answer_1,
    answer2: row.answer_2,
    answer3: row.answer_3,
    answer4: row.answer_4,
    rightAnswerN: right,
    comments: (row.comments ?? "").trim(),
    difficulty: row.difficulty,
  };
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

export async function getAdminThemes(
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminThemeOption[]> {
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<ThemeRow>(SQL_ADMIN_THEMES, []);
    return rows.map((row) => ({
      id: row.id,
      code: row.code.trim(),
      name: row.name.trim(),
      ord: row.ord,
      taskCount: Number(row.task_count),
    }));
  } finally {
    connection.release();
  }
}

function mapListItem(row: ListRow): AdminQuizTaskListItem {
  const taskText = row.task_text;
  const fromText = taskText.replace(/\$+/g, " ").replace(/\s+/g, " ").trim();
  const label = (fromText || row.name.trim() || `#${row.id}`).slice(0, 160);
  return {
    id: row.id,
    label,
    taskText,
    difficulty: row.difficulty,
  };
}

export async function getQuizTasksByTheme(
  themeId: number,
  options: { page?: number; pageSize?: number } = {},
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminQuizTaskListPage> {
  const pageSize = Math.max(
    1,
    Math.floor(options.pageSize ?? ADMIN_TASKS_PAGE_SIZE),
  );
  const requestedPage = Math.max(1, Math.floor(options.page ?? 1));
  const connection = await deps.getConnection();
  try {
    const countRows = await connection.query<{ total: number | string }>(
      SQL_COUNT_BY_THEME,
      [themeId],
    );
    const total = Number(countRows[0]?.total ?? 0);
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * pageSize;

    const rows =
      total === 0
        ? []
        : await connection.query<ListRow>(
            // MySQL prepared statements reject `LIMIT ?` — inline validated ints.
            `${SQL_LIST_BY_THEME} LIMIT ${pageSize} OFFSET ${offset}`,
            [themeId],
          );

    return {
      items: rows.map(mapListItem),
      total,
      page,
      pageSize,
      totalPages,
    };
  } finally {
    connection.release();
  }
}

export async function getQuizTaskById(
  taskId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminQuizTask | null> {
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<TaskRow>(SQL_GET_BY_ID, [taskId]);
    const row = rows[0];
    return row ? mapTask(row) : null;
  } finally {
    connection.release();
  }
}

/** Previous / next task ids within the same theme (ordered by id). */
export async function getNeighborTaskIds(
  themeId: number,
  taskId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<{ prevId: number | null; nextId: number | null }> {
  const connection = await deps.getConnection();
  try {
    const rows = await connection.query<{
      prev_id: number | null;
      next_id: number | null;
    }>(SQL_NEIGHBOR_IDS, [themeId, taskId, themeId, taskId]);
    const row = rows[0];
    return {
      prevId: row?.prev_id ?? null,
      nextId: row?.next_id ?? null,
    };
  } finally {
    connection.release();
  }
}

async function assertThemeExists(
  connection: SqlConnection,
  themeId: number,
): Promise<void> {
  const rows = await connection.query<{ id: number }>(SQL_THEME_EXISTS, [
    themeId,
  ]);
  if (!rows[0]) {
    throw new AdminContentError("Theme not found.", "theme_not_found");
  }
}

export async function createQuizTask(
  input: AdminQuizTaskInput,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminQuizTask> {
  const connection = await deps.getConnection();
  try {
    await connection.beginTransaction();
    await assertThemeExists(connection, input.themeId);

    const nextRows = await connection.query<{ next_id: number | string }>(
      SQL_NEXT_ID,
      [],
    );
    const nextId = Number(nextRows[0]?.next_id);
    if (!Number.isInteger(nextId) || nextId <= 0) {
      throw new AdminContentError("Could not allocate task id.", "db_error");
    }

    await connection.execute(SQL_INSERT, [
      nextId,
      input.name,
      input.taskText,
      input.themeId,
      input.answer1,
      input.answer2,
      input.answer3,
      input.answer4,
      input.rightAnswerN,
      input.comments ?? "",
      input.difficulty,
    ]);

    await connection.commit();
    return {
      id: nextId,
      name: input.name,
      taskText: input.taskText,
      themeId: input.themeId,
      answer1: input.answer1,
      answer2: input.answer2,
      answer3: input.answer3,
      answer4: input.answer4,
      rightAnswerN: input.rightAnswerN as 1 | 2 | 3 | 4,
      comments: input.comments ?? "",
      difficulty: input.difficulty,
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback errors
    }
    if (error instanceof AdminContentError) throw error;
    console.error("createQuizTask: unexpected database error", error);
    throw new AdminContentError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}

export async function updateQuizTask(
  taskId: number,
  input: AdminQuizTaskInput,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<AdminQuizTask> {
  const connection = await deps.getConnection();
  try {
    await assertThemeExists(connection, input.themeId);
    const result = await connection.execute(SQL_UPDATE, [
      input.name,
      input.taskText,
      input.themeId,
      input.answer1,
      input.answer2,
      input.answer3,
      input.answer4,
      input.rightAnswerN,
      input.comments ?? "",
      input.difficulty,
      taskId,
    ]);
    if (result.affectedRows === 0) {
      throw new AdminContentError("Task not found.", "not_found");
    }
    return {
      id: taskId,
      name: input.name,
      taskText: input.taskText,
      themeId: input.themeId,
      answer1: input.answer1,
      answer2: input.answer2,
      answer3: input.answer3,
      answer4: input.answer4,
      rightAnswerN: input.rightAnswerN as 1 | 2 | 3 | 4,
      comments: input.comments ?? "",
      difficulty: input.difficulty,
    };
  } catch (error) {
    if (error instanceof AdminContentError) throw error;
    console.error("updateQuizTask: unexpected database error", error);
    throw new AdminContentError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}

export async function deleteQuizTask(
  taskId: number,
  deps: { getConnection: () => Promise<SqlConnection> } = {
    getConnection: loadDefaultConnection,
  },
): Promise<void> {
  const connection = await deps.getConnection();
  try {
    const used = await connection.query<{ used: number }>(SQL_USED_IN_SESSIONS, [
      taskId,
    ]);
    if (used[0]) {
      throw new AdminContentError(
        "Task is referenced by existing sessions.",
        "in_use",
      );
    }

    const result = await connection.execute(SQL_DELETE, [taskId]);
    if (result.affectedRows === 0) {
      throw new AdminContentError("Task not found.", "not_found");
    }
  } catch (error) {
    if (error instanceof AdminContentError) throw error;
    const errno =
      typeof error === "object" && error !== null && "errno" in error
        ? Number((error as { errno?: number }).errno)
        : undefined;
    // MySQL ER_ROW_IS_REFERENCED_2
    if (errno === 1451) {
      throw new AdminContentError(
        "Task is referenced by existing sessions.",
        "in_use",
      );
    }
    console.error("deleteQuizTask: unexpected database error", error);
    throw new AdminContentError("Database operation failed.", "db_error");
  } finally {
    connection.release();
  }
}
