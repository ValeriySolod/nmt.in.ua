/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS entry for server.js */
const fs = require("fs");

/** Matches MAX_REQUEST_BODY_BYTES in src/modules/content-import/schema.ts */
const DEFAULT_MAX_BODY_BYTES = 8388608;
const MIN_MAX_BODY_BYTES = 64 * 1024;
const MAX_MAX_BODY_BYTES = 32 * 1024 * 1024;

/** Load KEY=VALUE lines without overwriting existing process.env entries. */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function readMaxBodyBytes(env = process.env) {
  const raw = env.MAX_BODY_BYTES;
  if (raw === undefined || raw === "") {
    return DEFAULT_MAX_BODY_BYTES;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < MIN_MAX_BODY_BYTES) {
    return DEFAULT_MAX_BODY_BYTES;
  }
  return Math.min(value, MAX_MAX_BODY_BYTES);
}

function rejectOversizedBody(req, res, maxBodyBytes) {
  const rawLength = req.headers["content-length"];
  if (rawLength === undefined) {
    return false;
  }
  const length = Number(rawLength);
  if (!Number.isFinite(length) || length <= maxBodyBytes) {
    return false;
  }
  res.statusCode = 413;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(
    JSON.stringify({
      ok: false,
      errors: [`Request body exceeds server limit (${maxBodyBytes} bytes).`],
    }),
  );
  return true;
}

module.exports = {
  DEFAULT_MAX_BODY_BYTES,
  loadEnvFile,
  readMaxBodyBytes,
  rejectOversizedBody,
};
