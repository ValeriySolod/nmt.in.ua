import { DIAGNOSTIC_TOTAL_QUESTIONS } from "./diagnosticProgress";

export function isPerfectDiagnosticResult(
  rightNumber: number,
  tasksNumber: number,
): boolean {
  return tasksNumber === DIAGNOSTIC_TOTAL_QUESTIONS && rightNumber === tasksNumber;
}
