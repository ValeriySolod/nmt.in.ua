/**
 * Скидає сесії та результати demo-student (user_id = 1).
 * Usage: node scripts/reset-demo-student.mjs
 * Reads DB_* from .env.local in the project root.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const DEMO_USER_ID = 1;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found — fill DB_* credentials first.");
  }
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
  const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"];
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing in .env.local: ${missing.join(", ")}`);
  }
}

loadEnv();

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 20_000,
});

console.log(`Connected to ${process.env.DB_HOST}/${process.env.DB_NAME}`);

try {
  const [[beforeSessions]] = await conn.query(
    "SELECT COUNT(*) AS c FROM task_sessions WHERE user_id = ?",
    [DEMO_USER_ID],
  );
  const [[beforeMappings]] = await conn.query(
    "SELECT COUNT(*) AS c FROM tasks2session WHERE user_id = ?",
    [DEMO_USER_ID],
  );

  console.log(
    `Before: task_sessions=${beforeSessions.c}, tasks2session=${beforeMappings.c}`,
  );

  await conn.beginTransaction();
  const [mappings] = await conn.execute(
    "DELETE FROM tasks2session WHERE user_id = ?",
    [DEMO_USER_ID],
  );
  const [sessions] = await conn.execute(
    "DELETE FROM task_sessions WHERE user_id = ?",
    [DEMO_USER_ID],
  );
  await conn.commit();

  console.log(
    `Deleted: tasks2session=${mappings.affectedRows}, task_sessions=${sessions.affectedRows}`,
  );
  console.log("Demo student (user_id=1) history cleared.");
} finally {
  await conn.end();
}
