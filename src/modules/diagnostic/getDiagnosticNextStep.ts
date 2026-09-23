import type { SqlConnection } from "@/lib/db/mysql";
import {
  loadProgressMappings,
  resolveStepAgainstBank,
} from "./diagnosticFlowStore";
import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";
import { isValidOwner, type SessionOwner } from "./sessionOwner";

export type DiagnosticNextStepView = {
  kind: "questions";
  afterLastTask: "continue" | "finish";
};

type GetDiagnosticNextStepDeps = {
  getConnection: () => Promise<SqlConnection>;
};

async function loadDefaultConnection(): Promise<SqlConnection> {
  const { getConnection } = await import("@/lib/db/mysql");
  return getConnection();
}

/**
 * Read-only: whether answering the current last task should continue
 * (link another) or finish the attempt.
 */
export async function getDiagnosticNextStep(
  sessionId: number,
  owner: SessionOwner,
  deps: GetDiagnosticNextStepDeps = { getConnection: loadDefaultConnection },
): Promise<DiagnosticNextStepView> {
  if (!isValidOwner(owner)) {
    throw new Error("owner must be exactly one of userId or guestToken.");
  }

  const connection = await deps.getConnection();
  try {
    const mappings = await loadProgressMappings(connection, sessionId, owner, {
      forUpdate: false,
    });
    const { step } = await resolveStepAgainstBank(connection, mappings);

    const isFinal =
      step.kind === "complete" ||
      (step.kind === "answer" && mappings.length >= DIAGNOSTIC_TOTAL_QUESTIONS);

    return {
      kind: "questions",
      afterLastTask: isFinal ? "finish" : "continue",
    };
  } finally {
    connection.release();
  }
}
