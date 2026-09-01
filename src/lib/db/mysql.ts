import "server-only";
import mysql, { type Pool, type PoolConnection, type ResultSetHeader } from "mysql2/promise";

/** Minimal transactional SQL port used by server-side modules. */
export type SqlConnection = {
  beginTransaction(): Promise<void>;
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ insertId: number; affectedRows: number }>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(): void;
};

let pool: Pool | undefined;

/** Remote shared MySQL often drops idle sockets — retry these at connect/query time. */
const TRANSIENT_DB_ERROR_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "PROTOCOL_CONNECTION_LOST",
  "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR",
]);

const MAX_CONNECT_ATTEMPTS = 3;

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readPositiveIntEnv(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    return defaultValue;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(
      `Invalid environment variable ${name}: expected a positive integer, got "${raw}".`,
    );
  }
  return value;
}

function isTransientDbError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = (error as { code?: string }).code;
  return typeof code === "string" && TRANSIENT_DB_ERROR_CODES.has(code);
}

function resetPool(): void {
  const current = pool;
  pool = undefined;
  if (current) {
    void current.end().catch(() => undefined);
  }
}

function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: readEnv("DB_HOST"),
      port: readPositiveIntEnv("DB_PORT", 3306),
      user: readEnv("DB_USER"),
      password: readEnv("DB_PASSWORD"),
      database: readEnv("DB_NAME"),
      waitForConnections: true,
      connectionLimit: readPositiveIntEnv("DB_CONNECTION_LIMIT", 10),
      connectTimeout: readPositiveIntEnv("DB_CONNECT_TIMEOUT_MS", 15_000),
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      charset: "utf8mb4",
    });

    (pool as mysql.Pool & { on(event: "error", listener: (error: Error) => void): void }).on(
      "error",
      (error) => {
        if (isTransientDbError(error)) {
          console.error("mysql pool: transient error, resetting pool", error);
          resetPool();
        }
      },
    );
  }
  return pool;
}

function wrap(connection: PoolConnection): SqlConnection {
  let broken = false;

  const markBroken = (error: unknown) => {
    if (isTransientDbError(error)) {
      broken = true;
    }
  };

  return {
    beginTransaction: () => connection.beginTransaction(),
    query: async <T,>(sql: string, params: unknown[] = []) => {
      try {
        const [rows] = await connection.execute(sql, params as never[]);
        return rows as T[];
      } catch (error) {
        markBroken(error);
        throw error;
      }
    },
    execute: async (sql: string, params: unknown[] = []) => {
      try {
        const [result] = await connection.execute(sql, params as never[]);
        const header = result as ResultSetHeader;
        return { insertId: header.insertId, affectedRows: header.affectedRows };
      } catch (error) {
        markBroken(error);
        throw error;
      }
    },
    commit: () => connection.commit(),
    rollback: () => connection.rollback(),
    release: () => {
      if (broken) {
        connection.destroy();
        return;
      }
      connection.release();
    },
  };
}

async function acquireRawConnection(): Promise<PoolConnection> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt += 1) {
    try {
      const connection = await getPool().getConnection();
      await connection.ping();
      return connection;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_CONNECT_ATTEMPTS && isTransientDbError(error)) {
        console.error(
          `mysql: connect attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} failed, retrying`,
          error,
        );
        resetPool();
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/** Acquire a pooled connection for a single transactional unit of work. */
export async function getConnection(): Promise<SqlConnection> {
  return wrap(await acquireRawConnection());
}
