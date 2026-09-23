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
  DIAGNOSTIC_TASKS_PER_THEME,
  DIAGNOSTIC_MAX_THEMES,
} from "./startDiagnosticTest";
export type {
  StartDiagnosticTestInput,
  StartDiagnosticTestResult,
  StartDiagnosticTestErrorCode,
} from "./startDiagnosticTest";

export {
  DIAGNOSTIC_TOTAL_QUESTIONS,
  resolveDiagnosticNextStep,
  topicQuestionQuota,
} from "./diagnosticProgress";
export type {
  DiagnosticNextStep,
  DiagnosticProgressMapping,
} from "./diagnosticProgress";

export {
  clampDifficulty,
  initialDifficultyForSelfScore,
  nextDiagnosticDifficulty,
  selectAdaptiveTask,
} from "./adaptiveDifficulty";

export {
  startDiagnosticTopic,
  StartDiagnosticTopicError,
} from "./startDiagnosticTopic";
export type {
  StartDiagnosticTopicInput,
  StartDiagnosticTopicResult,
} from "./startDiagnosticTopic";

export {
  advanceDiagnosticSession,
  AdvanceDiagnosticSessionError,
} from "./advanceDiagnosticSession";

export { getDiagnosticNextStep } from "./getDiagnosticNextStep";
export type {
  DiagnosticNextStepView,
  DiagnosticTopicIntroView,
} from "./getDiagnosticNextStep";

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
  startDiagnosticTopicAction,
  advanceDiagnosticAction,
  checkDiagnosticAnswerAction,
  finishDiagnosticSessionAction,
  markDiagnosticSessionStartedAction,
  getDiagnosticThemeBreakdownAction,
} from "./actions";
export type {
  StartDiagnosticActionState,
  StartDiagnosticTopicActionState,
  AdvanceDiagnosticActionState,
} from "./actions";
