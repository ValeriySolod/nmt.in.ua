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
    });
  }
  return pool;
}

function wrap(connection: PoolConnection): SqlConnection {
  return {
    beginTransaction: () => connection.beginTransaction(),
    query: async <T,>(sql: string, params: unknown[] = []) => {
      const [rows] = await connection.execute(sql, params as never[]);
      return rows as T[];
    },
    execute: async (sql: string, params: unknown[] = []) => {
      const [result] = await connection.execute(sql, params as never[]);
      const header = result as ResultSetHeader;
      return { insertId: header.insertId, affectedRows: header.affectedRows };
    },
    commit: () => connection.commit(),
    rollback: () => connection.rollback(),
    release: () => connection.release(),
  };
}

/** Acquire a pooled connection for a single transactional unit of work. */
export async function getConnection(): Promise<SqlConnection> {
  const connection = await getPool().getConnection();
  return wrap(connection);
}
