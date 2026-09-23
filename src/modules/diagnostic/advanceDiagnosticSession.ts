import type { SqlConnection } from "@/lib/db/mysql";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import {
  insertDiagnosticMapping,
  loadProgressMappings,
  lockDiagnosticSession,
  resolveStepAgainstBank,
} from "./diagnosticFlowStore";
import { isValidOwner, type SessionOwner } from "./sessionOwner";

export type AdvanceDiagnosticSessionInput = {
  owner: SessionOwner;
  sessionId: number;
};

export type AdvanceDiagnosticSessionResult = {
  next: "task" | "complete";
};

export type AdvanceDiagnosticSessionErrorCode =
  | "invalid_input"
  | "not_found"
  | "session_expired"
  | "db_error";

export class AdvanceDiagnosticSessionError extends Error {
  constructor(
    message: string,
    public readonly code: AdvanceDiagnosticSessionErrorCode,
  ) {
    super(message);
    this.name = "AdvanceDiagnosticSessionError";
  }
}

type AdvanceDiagnosticSessionDeps = {
  getConnection: () => Promise<SqlConnection>;
  nowSec?: () => number;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function validateAdvanceDiagnosticSessionInput(
  input: unknown,
): AdvanceDiagnosticSessionInput {
  if (typeof input !== "object" || input === null) {
    throw new AdvanceDiagnosticSessionError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { owner, sessionId } = input as Record<string, unknown>;
  if (!isValidOwner(owner) || !isPositiveInt(sessionId)) {
    throw new AdvanceDiagnosticSessionError(
      "owner must be valid and sessionId must be a positive integer.",
      "invalid_input",
    );
  }
  return { owner: owner as SessionOwner, sessionId };
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * After the latest task is answered, links the next adaptive task (or
 * reports that the attempt is complete). Idempotent under a session lock.
 */
export async function advanceDiagnosticSession(
  rawInput: unknown,
  deps: AdvanceDiagnosticSessionDeps = { getConnection: loadDefaultConnection },
): Promise<AdvanceDiagnosticSessionResult> {
  const input = validateAdvanceDiagnosticSessionInput(rawInput);
  const nowSec = deps.nowSec ?? nowUnixSec;

  try {
    const connection = await deps.getConnection();
    try {
      await connection.beginTransaction();

      const state = await lockDiagnosticSession(
        connection,
        input.sessionId,
        input.owner,
        nowSec(),
      );
      if (state === null) {
        throw new AdvanceDiagnosticSessionError(
          "Session was not found for this owner.",
          "not_found",
        );
      }
      if (state === "expired") {
        throw new AdvanceDiagnosticSessionError(
          "This session's 24h lifetime has expired.",
          "session_expired",
        );
      }
      if (state === "completed") {
        await connection.commit();
        return { next: "complete" };
      }

      const mappings = await loadProgressMappings(
        connection,
        input.sessionId,
        input.owner,
        { forUpdate: true },
      );
      const { step, nextTaskId } = await resolveStepAgainstBank(
        connection,
        mappings,
      );

      if (step.kind !== "nextTask" || nextTaskId === null) {
        await connection.commit();
        return {
          next: step.kind === "answer" ? "task" : "complete",
        };
      }

      const mappingId = await insertDiagnosticMapping(
        connection,
        input.sessionId,
        input.owner,
        nextTaskId,
      );
      if (mappingId === null) {
        throw new AdvanceDiagnosticSessionError(
          "Failed to link the next task.",
          "db_error",
        );
      }

      await connection.commit();
      return { next: "task" };
    } catch (error) {
      await connection.rollback().catch(() => undefined);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof AdvanceDiagnosticSessionError) {
      throw error;
    }
    console.error("advanceDiagnosticSession: unexpected database error", error);
    throw new AdvanceDiagnosticSessionError(
      "Database operation failed.",
      "db_error",
    );
  }
}
