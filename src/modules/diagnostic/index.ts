export type { SessionOwner } from "./sessionOwner";
export {
  isValidOwner,
  ownerClause,
  ownerParams,
  ownerKey,
  resolveOwnerForRead,
  resolveOwnerForWrite,
} from "./sessionOwner";

export {
  startDiagnosticTest,
  validateStartDiagnosticTestInput,
  StartDiagnosticTestError,
  DIAGNOSTIC_MIN_THEMES,
  isDiagnosticBankEligible,
} from "./startDiagnosticTest";
export type {
  StartDiagnosticTestInput,
  StartDiagnosticTestResult,
  StartDiagnosticTestErrorCode,
} from "./startDiagnosticTest";

export {
  DIAGNOSTIC_TOTAL_QUESTIONS,
  DIAGNOSTIC_FAIL_STREAK_AT_LEVEL_1,
  resolveDiagnosticNextStep,
  consecutiveWrongAtDifficulty1,
} from "./diagnosticProgress";
export type {
  DiagnosticNextStep,
  DiagnosticProgressMapping,
} from "./diagnosticProgress";

export {
  normalizeDifficulty,
  clampDifficulty,
  nextDiagnosticDifficulty,
  selectDiagnosticTask,
  selectAdaptiveTask,
  MIN_DIAGNOSTIC_DIFFICULTY,
} from "./adaptiveDifficulty";

export {
  advanceDiagnosticSession,
  AdvanceDiagnosticSessionError,
} from "./advanceDiagnosticSession";

export { getDiagnosticNextStep } from "./getDiagnosticNextStep";
export type { DiagnosticNextStepView } from "./getDiagnosticNextStep";

export { hasEligibleDiagnosticContent } from "./hasEligibleDiagnosticContent";

export {
  checkDiagnosticAnswer,
  CheckDiagnosticAnswerError,
} from "./checkDiagnosticAnswer";
export type {
  CheckDiagnosticAnswerInput,
  CheckDiagnosticAnswerResult,
} from "./checkDiagnosticAnswer";

export {
  finishDiagnosticSession,
  FinishDiagnosticSessionError,
  toDiagnosticSummary,
  DIAGNOSTIC_SUMMARY_THEME_ID,
  DIAGNOSTIC_SUMMARY_THEME_NAME,
} from "./finishDiagnosticSession";
export type { FinishDiagnosticSessionInput } from "./finishDiagnosticSession";

export {
  getDiagnosticSessionTasks,
  GetDiagnosticSessionTasksError,
} from "./getDiagnosticSessionTasks";

export {
  getDiagnosticThemeBreakdown,
  selectPriorityTopics,
  selectStrongTopics,
  toDiagnosticTopicInsight,
  PRIORITY_TOPICS_LIMIT,
  STRONG_TOPICS_LIMIT,
} from "./diagnosticThemeBreakdown";
export type {
  DiagnosticThemeStat,
  DiagnosticTopicInsight,
} from "./diagnosticThemeBreakdown";

export {
  markDiagnosticSessionStarted,
  MarkDiagnosticSessionStartedError,
} from "./markDiagnosticSessionStarted";

export { claimGuestProgress } from "./claimGuestProgress";
export type { ClaimGuestProgressResult } from "./claimGuestProgress";

export {
  startDiagnosticAction,
  advanceDiagnosticAction,
  checkDiagnosticAnswerAction,
  finishDiagnosticSessionAction,
  markDiagnosticSessionStartedAction,
  getDiagnosticThemeBreakdownAction,
} from "./actions";
export type {
  StartDiagnosticActionState,
  AdvanceDiagnosticActionState,
} from "./actions";
