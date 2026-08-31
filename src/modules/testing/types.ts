export type AvailableTopicTheme = {
  id: number;
  name: string;
  ord: number;
  taskCount: number;
};

/** One answer option exposed to the client (no correctness metadata). */
export type SessionTaskAnswer = {
  number: 1 | 2 | 3 | 4;
  text: string;
};

/** Quiz task payload safe to render before answer check / session finish. */
export type SessionTask = {
  mappingId: number;
  taskId: number;
  name: string;
  taskText: string;
  answers: [
    SessionTaskAnswer,
    SessionTaskAnswer,
    SessionTaskAnswer,
    SessionTaskAnswer,
  ];
  status: number;
};

/** Client-safe session score after finish (no answer key). */
export type TrainerSessionSummary = {
  sessionId: number;
  rightNumber: number;
  tasksNumber: number;
  percent: number;
  timeSec: number;
  themeId: number;
  themeName: string;
};

export type SessionTasksResult = {
  sessionId: number;
  sessionStatus: number;
  tasks: SessionTask[];
  summary: TrainerSessionSummary | null;
};

/** Verified `tasks2session.status` values (team DB). */
export const TASK_STATUS_UNANSWERED = 0;
export const TASK_STATUS_CORRECT = 1;
export const TASK_STATUS_INCORRECT = -1;

export type CheckAnswerActionInput = {
  sessionId: number;
  mappingId: number;
  answerNumber: 1 | 2 | 3 | 4;
};

export type CheckAnswerActionState =
  | { status: "success"; correct: boolean }
  | { status: "error"; message: string };

export type FinishTrainerSessionActionInput = {
  sessionId: number;
};

export type FinishTrainerSessionActionState =
  | { status: "success"; summary: TrainerSessionSummary }
  | { status: "error"; message: string };

