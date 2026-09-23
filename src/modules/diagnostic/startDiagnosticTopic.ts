import type { SqlConnection } from "@/lib/db/mysql";
import { ensureSelfScoreSchema } from "@/modules/self-score/schema";
import {
  RecordSelfScoreError,
  validateRecordSelfScoreInput,
} from "@/modules/self-score/recordSelfScore";
import { isValidSelfScore } from "@/modules/self-score/types";
import { nowUnixSec } from "@/modules/testing/sessionElapsed";
import {
  ensureDiagnosticSelfScoreSchema,
  insertDiagnosticSelfScore,
  loadDiagnosticSelfScores,
} from "./diagnosticSelfScores";
import {
  insertDiagnosticMapping,
  loadPlannedThemeIds,
  loadProgressMappings,
  lockDiagnosticSession,
  resolveStepAgainstBank,
} from "./diagnosticFlowStore";
import { isValidOwner, type SessionOwner } from "./sessionOwner";

const SQL_INSERT_SELF_SCORE = `
  INSERT INTO user_self_scores (user_id, guest_token, theme_id, score, source)
  VALUES (?, ?, ?, ?, ?)
`;

export type StartDiagnosticTopicInput = {
  owner: SessionOwner;
  sessionId: number;
  themeId: number;
  selfScore: number;
};

export type StartDiagnosticTopicResult = {
  mappingId: number | null;
  taskId: number | null;
};

export type StartDiagnosticTopicErrorCode =
  | "invalid_input"
  | "not_found"
  | "session_completed"
  | "session_expired"
  /** The topic the client asked to start is not the one the session is
   * waiting for (stale tab, double submit, or a forged themeId). */
  | "step_mismatch"
  | "insufficient_tasks"
  | "db_error";

export class StartDiagnosticTopicError extends Error {
  constructor(
    message: string,
    public readonly code: StartDiagnosticTopicErrorCode,
  ) {
    super(message);
    this.name = "StartDiagnosticTopicError";
  }
}

type StartDiagnosticTopicDeps = {
  getConnection: () => Promise<SqlConnection>;
  nowSec?: () => number;
};

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function validateStartDiagnosticTopicInput(
  input: unknown,
): StartDiagnosticTopicInput {
  if (typeof input !== "object" || input === null) {
    throw new StartDiagnosticTopicError(
      "Request payload must be an object.",
      "invalid_input",
    );
  }
  const { owner, sessionId, themeId, selfScore } = input as Record<
    string,
    unknown
  >;
  if (
    !isValidOwner(owner) ||
    !isPositiveInt(sessionId) ||
    !isPositiveInt(themeId) ||
    !isValidSelfScore(selfScore)
  ) {
    throw new StartDiagnosticTopicError(
      "owner must be valid; sessionId and themeId must be positive integers and selfScore an integer 1-10.",
      "invalid_input",
    );
  }
  return { owner: owner as SessionOwner, sessionId, themeId, selfScore };
}

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Starts one topic of an adaptive diagnostic attempt, atomically: records
 * the student's 1-10 self-score for that topic (an ordinary `pre_topic`
 * row in `user_self_scores` — the existing per-theme self-assessment
 * history, claimed at registration like every other guest row) and links
 * the topic's first task, picked at the difficulty the self-score maps to.
 *
 * Only succeeds when the session is actually waiting for exactly this
 * topic, so a replayed/forged request can neither skip ahead, restart a
 * topic, nor push the attempt past `DIAGNOSTIC_TOTAL_QUESTIONS`.
 */
export async function startDiagnosticTopic(
  rawInput: unknown,
  deps: StartDiagnosticTopicDeps = { getConnection: loadDefaultConnection },
): Promise<StartDiagnosticTopicResult> {
  const input = validateStartDiagnosticTopicInput(rawInput);
  const nowSec = deps.nowSec ?? nowUnixSec;

  let selfScoreRow;
  try {
    selfScoreRow = validateRecordSelfScoreInput({
      userId: input.owner.userId,
      guestToken: input.owner.guestToken,
      themeId: input.themeId,
      score: input.selfScore,
      source: "pre_topic",
    });
  } catch (error) {
    if (error instanceof RecordSelfScoreError) {
      throw new StartDiagnosticTopicError(error.message, "invalid_input");
    }
    throw error;
  }

  try {
    await ensureSelfScoreSchema(deps.getConnection);
    await ensureDiagnosticSelfScoreSchema(deps.getConnection);

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
        throw new StartDiagnosticTopicError(
          "Session was not found for this owner.",
          "not_found",
        );
      }
      if (state === "completed") {
        throw new StartDiagnosticTopicError(
          "This session is already completed.",
          "session_completed",
        );
      }
      if (state === "expired") {
        throw new StartDiagnosticTopicError(
          "This session's 24h lifetime has expired.",
          "session_expired",
        );
      }

      const mappings = await loadProgressMappings(
        connection,
        input.sessionId,
        input.owner,
        { forUpdate: true },
      );
      const plannedThemeIds = await loadPlannedThemeIds(
        connection,
        input.sessionId,
      );
      const selfScores = await loadDiagnosticSelfScores(connection, input.sessionId);
      const { step } = await resolveStepAgainstBank(
        connection,
        mappings,
        plannedThemeIds,
        input.sessionId,
      );

      if (step.kind !== "topicIntro" || step.themeId !== input.themeId) {
        throw new StartDiagnosticTopicError(
          "The session is not waiting for this topic.",
          "step_mismatch",
        );
      }

      const selfScore = await connection.execute(SQL_INSERT_SELF_SCORE, [
        selfScoreRow.userId,
        selfScoreRow.guestToken,
        selfScoreRow.themeId,
        selfScoreRow.score,
        selfScoreRow.source,
      ]);
      if (selfScore.affectedRows !== 1) {
        throw new StartDiagnosticTopicError(
          "Failed to store the topic self-score.",
          "db_error",
        );
      }

      if (!await insertDiagnosticSelfScore(
        connection,
        input.sessionId,
        input.themeId,
        input.selfScore,
        selfScores.length + 1,
      )) {
        throw new StartDiagnosticTopicError("Failed to store the session self-score.", "db_error");
      }

      if (selfScores.length + 1 < plannedThemeIds.length) {
        await connection.commit();
        return { mappingId: null, taskId: null };
      }

      const { step: firstStep, nextTaskId } = await resolveStepAgainstBank(
        connection,
        mappings,
        plannedThemeIds,
        input.sessionId,
      );
      if (firstStep.kind !== "nextTask" || nextTaskId === null) {
        throw new StartDiagnosticTopicError("No tasks are available for this topic.", "insufficient_tasks");
      }

      const mappingId = await insertDiagnosticMapping(
        connection,
        input.sessionId,
        input.owner,
        nextTaskId,
      );
      if (mappingId === null) {
        throw new StartDiagnosticTopicError(
          "Failed to link the first topic task.",
          "db_error",
        );
      }

      await connection.commit();
      return { mappingId, taskId: nextTaskId };
    } catch (error) {
      await connection.rollback().catch(() => undefined);
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof StartDiagnosticTopicError) {
      throw error;
    }
    console.error("startDiagnosticTopic: unexpected database error", error);
    throw new StartDiagnosticTopicError(
      "Database operation failed.",
      "db_error",
    );
  }
}
