"use server";

import { revalidatePath } from "next/cache";
import { invalidateCatalogCache } from "@/lib/cache/catalogCache";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { canImportContent } from "@/modules/auth/types";
import {
  createQuizTask,
  deleteQuizTask,
  getQuizTaskById,
  updateQuizTask,
} from "./store";
import {
  AdminContentError,
  type AdminQuizTask,
} from "./types";
import {
  parseAdminQuizTaskInput,
  parseTaskId,
} from "./validate";

export type SaveQuizTaskActionState =
  | { status: "idle" }
  | { status: "success"; task: AdminQuizTask; mode: "create" | "update" }
  | { status: "error"; code: SaveQuizTaskErrorCode };

export type SaveQuizTaskErrorCode =
  | "invalid_input"
  | "theme_not_found"
  | "not_found"
  | "forbidden"
  | "generic";

export type DeleteQuizTaskActionState =
  | { status: "idle" }
  | { status: "success"; taskId: number }
  | { status: "error"; code: DeleteQuizTaskErrorCode };

export type DeleteQuizTaskErrorCode =
  | "invalid_input"
  | "not_found"
  | "in_use"
  | "forbidden"
  | "generic";

export type LoadQuizTaskActionState =
  | { status: "idle" }
  | { status: "success"; task: AdminQuizTask }
  | { status: "error"; code: "invalid_input" | "not_found" | "forbidden" | "generic" };

function readFormFields(formData: FormData): Record<string, unknown> {
  return {
    taskText: formData.get("taskText"),
    themeId: formData.get("themeId"),
    answer1: formData.get("answer1"),
    answer2: formData.get("answer2"),
    answer3: formData.get("answer3"),
    answer4: formData.get("answer4"),
    rightAnswerN: formData.get("rightAnswerN"),
    comments: formData.get("comments"),
    difficulty: formData.get("difficulty"),
    taskId: formData.get("taskId"),
  };
}

function mapSaveError(error: AdminContentError): SaveQuizTaskErrorCode {
  switch (error.code) {
    case "invalid_input":
    case "theme_not_found":
    case "not_found":
    case "forbidden":
      return error.code;
    default:
      return "generic";
  }
}

function mapDeleteError(error: AdminContentError): DeleteQuizTaskErrorCode {
  switch (error.code) {
    case "invalid_input":
    case "not_found":
    case "in_use":
    case "forbidden":
      return error.code;
    default:
      return "generic";
  }
}

type BustCaches = {
  invalidateCatalogCache: typeof invalidateCatalogCache;
  revalidatePath: typeof revalidatePath;
};

function bustCaches(deps: BustCaches) {
  deps.invalidateCatalogCache();
  deps.revalidatePath("/");
  deps.revalidatePath("/problems");
  deps.revalidatePath("/tasks");
}

type SaveDeps = {
  requireUser: typeof requireUser;
  createQuizTask: typeof createQuizTask;
  updateQuizTask: typeof updateQuizTask;
  revalidatePath: typeof revalidatePath;
  invalidateCatalogCache: typeof invalidateCatalogCache;
};

type DeleteDeps = {
  requireUser: typeof requireUser;
  deleteQuizTask: typeof deleteQuizTask;
  revalidatePath: typeof revalidatePath;
  invalidateCatalogCache: typeof invalidateCatalogCache;
};

type LoadDeps = {
  requireUser: typeof requireUser;
  getQuizTaskById: typeof getQuizTaskById;
};

export async function saveQuizTaskAction(
  _prev: SaveQuizTaskActionState,
  formData: FormData,
  deps: SaveDeps = {
    requireUser,
    createQuizTask,
    updateQuizTask,
    revalidatePath,
    invalidateCatalogCache,
  },
): Promise<SaveQuizTaskActionState> {
  const user = await deps.requireUser();
  if (!canImportContent(user.role)) {
    return { status: "error", code: "forbidden" };
  }

  try {
    const fields = readFormFields(formData);
    const input = parseAdminQuizTaskInput(fields);
    const rawTaskId = fields.taskId;
    const hasTaskId =
      rawTaskId != null && String(rawTaskId).trim() !== "";

    const task = hasTaskId
      ? await deps.updateQuizTask(parseTaskId(rawTaskId), input)
      : await deps.createQuizTask(input);

    bustCaches(deps);
    return {
      status: "success",
      task,
      mode: hasTaskId ? "update" : "create",
    };
  } catch (error) {
    if (error instanceof AdminContentError) {
      return { status: "error", code: mapSaveError(error) };
    }
    console.error("saveQuizTaskAction failed", error);
    return { status: "error", code: "generic" };
  }
}

export async function deleteQuizTaskAction(
  _prev: DeleteQuizTaskActionState,
  formData: FormData,
  deps: DeleteDeps = {
    requireUser,
    deleteQuizTask,
    revalidatePath,
    invalidateCatalogCache,
  },
): Promise<DeleteQuizTaskActionState> {
  const user = await deps.requireUser();
  if (!canImportContent(user.role)) {
    return { status: "error", code: "forbidden" };
  }

  try {
    const taskId = parseTaskId(formData.get("taskId"));
    await deps.deleteQuizTask(taskId);
    bustCaches(deps);
    return { status: "success", taskId };
  } catch (error) {
    if (error instanceof AdminContentError) {
      return { status: "error", code: mapDeleteError(error) };
    }
    console.error("deleteQuizTaskAction failed", error);
    return { status: "error", code: "generic" };
  }
}

/** Loads a full task for the edit form (keeps list payloads slim). */
export async function loadQuizTaskAction(
  _prev: LoadQuizTaskActionState,
  formData: FormData,
  deps: LoadDeps = {
    requireUser,
    getQuizTaskById,
  },
): Promise<LoadQuizTaskActionState> {
  const user = await deps.requireUser();
  if (!canImportContent(user.role)) {
    return { status: "error", code: "forbidden" };
  }

  try {
    const taskId = parseTaskId(formData.get("taskId"));
    const task = await deps.getQuizTaskById(taskId);
    if (!task) {
      return { status: "error", code: "not_found" };
    }
    return { status: "success", task };
  } catch (error) {
    if (error instanceof AdminContentError) {
      return {
        status: "error",
        code: error.code === "invalid_input" ? "invalid_input" : "generic",
      };
    }
    console.error("loadQuizTaskAction failed", error);
    return { status: "error", code: "generic" };
  }
}
