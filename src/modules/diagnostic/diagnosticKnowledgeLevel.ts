export const DIAGNOSTIC_KNOWLEDGE_LEVELS = [
  "know",
  "partial",
  "unknown",
] as const;

export type DiagnosticKnowledgeLevel =
  (typeof DIAGNOSTIC_KNOWLEDGE_LEVELS)[number];

const SCORE_BY_LEVEL: Record<DiagnosticKnowledgeLevel, number> = {
  know: 9,
  partial: 6,
  unknown: 2,
};

export function diagnosticKnowledgeLevelToScore(
  value: FormDataEntryValue | null,
): number | null {
  if (
    typeof value !== "string" ||
    !DIAGNOSTIC_KNOWLEDGE_LEVELS.includes(value as DiagnosticKnowledgeLevel)
  ) {
    return null;
  }
  return SCORE_BY_LEVEL[value as DiagnosticKnowledgeLevel];
}
