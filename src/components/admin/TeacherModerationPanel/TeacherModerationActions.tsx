"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  approveTeacherApplicationAction,
  rejectTeacherApplicationAction,
  type TeacherModerationActionState,
} from "@/modules/teacher-moderation/actions";

import css from "./TeacherModerationPanel.module.css";

const INITIAL_STATE: TeacherModerationActionState = { status: "idle" };

type TeacherModerationActionsProps = {
  teacherUserId: number;
};

export function TeacherModerationActions({
  teacherUserId,
}: TeacherModerationActionsProps) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);

  const [approveState, approveAction, approvePending] = useActionState(
    approveTeacherApplicationAction,
    INITIAL_STATE,
  );

  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectTeacherApplicationAction,
    INITIAL_STATE,
  );

  const pending = approvePending || rejectPending;

  useEffect(() => {
    if (approveState.status === "ok" || rejectState.status === "ok") {
      router.refresh();
    }
  }, [approveState, rejectState, router]);

  const errorState =
    approveState.status === "error"
      ? approveState
      : rejectState.status === "error"
        ? rejectState
        : null;

  return (
    <div className={css.moderationActions}>
      <div className={css.actionButtons}>
        <form action={approveAction}>
          <input type="hidden" name="teacherUserId" value={teacherUserId} />

          <button
            type="submit"
            className={css.approveButton}
            disabled={pending}
          >
            Схвалити
          </button>
        </form>

        <button
          type="button"
          className={css.rejectButton}
          disabled={pending}
          onClick={() => setShowReject((current) => !current)}
        >
          Відхилити
        </button>
      </div>

      {showReject ? (
        <form action={rejectAction} className={css.rejectForm}>
          <input type="hidden" name="teacherUserId" value={teacherUserId} />

          <label className={css.rejectLabel}>
            Причина відмови
            <textarea
              className={css.rejectTextarea}
              name="rejectionReason"
              maxLength={1000}
              required
              disabled={pending}
            />
          </label>

          <button
            type="submit"
            className={css.confirmRejectButton}
            disabled={pending}
          >
            Підтвердити відмову
          </button>
        </form>
      ) : null}

      {errorState ? (
        <p className={css.actionError}>
          Не вдалося виконати дію. Спробуйте ще раз.
        </p>
      ) : null}
    </div>
  );
}
