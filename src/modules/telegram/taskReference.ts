import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function key(secret: string): Buffer {
  if (!secret) throw new Error("Telegram reference secret is missing.");
  return createHash("sha256").update(`telegram-task-reference:${secret}`).digest();
}

export function createTaskReference(sessionId: number, identity: string, secret: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), nonce);
  cipher.setAAD(Buffer.from(identity));
  const value = Buffer.concat([cipher.update(String(sessionId)), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), value]).toString("base64url");
}

export function resolveTaskReference(reference: unknown, identity: string, secret: string): number | null {
  if (typeof reference !== "string" || !/^[A-Za-z0-9_-]{39,59}$/.test(reference)) return null;
  try {
    const value = Buffer.from(reference, "base64url");
    if (value.toString("base64url") !== reference) return null;
    const cipher = createDecipheriv("aes-256-gcm", key(secret), value.subarray(0, 12));
    cipher.setAAD(Buffer.from(identity));
    cipher.setAuthTag(value.subarray(12, 28));
    const id = Buffer.concat([cipher.update(value.subarray(28)), cipher.final()]).toString();
    return /^[1-9][0-9]*$/.test(id) && Number.isSafeInteger(Number(id)) ? Number(id) : null;
  } catch {
    return null;
  }
}
