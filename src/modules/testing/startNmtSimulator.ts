import type { SqlConnection } from "@/lib/db/mysql";

export const NMT_SIMULATOR_TASK_COUNT = 22;
export const SESSION_TYPE_NMT_SIMULATOR = 4;

const SESSION_STATUS_CREATED = 2;
const SESSION_START_TIME = 0;
const SESSION_INITIAL_RIGHT_NUMBER = 0;
const SESSION_INITIAL_TIME = 0;

const TASK_TYPE_QUIZ = 1;
const TASK_STATUS_UNANSWERED = 0;

export type StartNmtSimulatorResult = {
  sessionId: number;
  taskIds: number[];
};

export type StartNmtSimulatorErrorCode =
  | "insufficient_tasks"
  | "already_in_progress"
  | "db_error";

export class StartNmtSimulatorError extends Error {
  constructor(
    message: string,
    public readonly code: StartNmtSimulatorErrorCode
  ) {
    super(message);
    this.name = "StartNmtSimulatorError";
  }
}

type StartNmtSimulatorDeps = {
  getConnection: () => Promise<SqlConnection>;
};

const pendingUserIds = new Set<number>();

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");

  return getConnection();
}

const SQL_SELECT_TASKS = `
  SELECT id, theme_id
  FROM quiz_tasks
  ORDER BY RAND()
  LIMIT ${NMT_SIMULATOR_TASK_COUNT}
`;

const SQL_INSERT_SESSION = `
  INSERT INTO task_sessions
    (
      user_id,
      session_type,
      theme_id,
      tasks_number,
      right_number,
      time,
      session_status,
      start_time
    )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

const SQL_INSERT_MAPPING_PREFIX = `
  INSERT INTO tasks2session
    (
      task_type,
      task_id,
      session_id,
      user_id,
      status
    )
  VALUES
`;

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export async function startNmtSimulator(
  userId: number,
  deps: StartNmtSimulatorDeps = {
    getConnection: loadDefaultConnection,
  }
): Promise<StartNmtSimulatorResult> {
  if (!isPositiveInt(userId)) {
    throw new StartNmtSimulatorError(
      "Неправильний ID користувача.",
      "db_error"
    );
  }

  if (pendingUserIds.has(userId)) {
    throw new StartNmtSimulatorError(
      "Запит на запуск симулятора обробляється.",
      "already_in_progress"
    );
  }

  pendingUserIds.add(userId);

  try {
    const connection = await deps.getConnection();

    try {
      await connection.beginTransaction();

      const tasks = await connection.query<{
        id: number;
        theme_id: number;
      }>(SQL_SELECT_TASKS);

      if (tasks.length < NMT_SIMULATOR_TASK_COUNT) {
        await connection.rollback();

        throw new StartNmtSimulatorError(
          "Для симулятора NMT недостатньо доступних завдань.",
          "insufficient_tasks"
        );
      }

      const sessionThemeId = tasks[0].theme_id;

      const session = await connection.execute(SQL_INSERT_SESSION, [
        userId,
        SESSION_TYPE_NMT_SIMULATOR,
        sessionThemeId,
        tasks.length,
        SESSION_INITIAL_RIGHT_NUMBER,
        SESSION_INITIAL_TIME,
        SESSION_STATUS_CREATED,
        SESSION_START_TIME,
      ]);

      const placeholders = tasks.map(() => "(?, ?, ?, ?, ?)").join(", ");

      const mappingParams = tasks.flatMap((task) => [
        TASK_TYPE_QUIZ,
        task.id,
        session.insertId,
        userId,
        TASK_STATUS_UNANSWERED,
      ]);

      const mapping = await connection.execute(
        SQL_INSERT_MAPPING_PREFIX + placeholders,
        mappingParams
      );

      if (mapping.affectedRows !== tasks.length) {
        await connection.rollback();

        throw new StartNmtSimulatorError(
          "Не вдалося зв’язати всі завдання симулятора.",
          "db_error"
        );
      }

      await connection.commit();

      return {
        sessionId: session.insertId,
        taskIds: tasks.map((task) => task.id),
      };
    } catch (error) {
      if (!(error instanceof StartNmtSimulatorError)) {
        await connection.rollback().catch(() => undefined);
      }

      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof StartNmtSimulatorError) {
      throw error;
    }

    console.error("startNmtSimulator: Помилка бази даних", error);

    throw new StartNmtSimulatorError(
      "Помилка під час роботи з базою даних.",
      "db_error"
    );
  } finally {
    pendingUserIds.delete(userId);
  }
}
