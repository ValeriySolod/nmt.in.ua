import assert from "node:assert/strict";
import test from "node:test";

import {
  deleteQuizTaskAction,
  saveQuizTaskAction,
} from "./actions";
import { AdminContentError } from "./types";

const admin = {
  id: 3,
  login: "demo-admin",
  displayName: "Адмін",
  role: "admin" as const,
};

const student = {
  id: 1,
  login: "demo-student",
  displayName: "Учень",
  role: "student" as const,
};

const sampleTask = {
  id: 10,
  name: "Додавання",
  taskText: "10+10=",
  themeId: 2,
  answer1: "10",
  answer2: "20",
  answer3: "30",
  answer4: "0",
  rightAnswerN: 2 as const,
  comments: "",
  difficulty: 3,
};

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

test("saveQuizTaskAction creates when taskId is absent", async () => {
  let created = false;
  const state = await saveQuizTaskAction(
    { status: "idle" },
    form({
      name: "Додавання",
      taskText: "10+10=",
      themeId: "2",
      answer1: "10",
      answer2: "20",
      answer3: "30",
      answer4: "0",
      rightAnswerN: "2",
      difficulty: "3",
    }),
    {
      requireUser: async () => admin,
      createQuizTask: async () => {
        created = true;
        return sampleTask;
      },
      updateQuizTask: async () => {
        throw new Error("should not update");
      },
      revalidatePath: () => undefined,
      invalidateCatalogCache: () => undefined,
    },
  );

  assert.equal(created, true);
  assert.equal(state.status, "success");
  if (state.status === "success") {
    assert.equal(state.mode, "create");
    assert.equal(state.task.id, 10);
  }
});

test("saveQuizTaskAction updates when taskId is present", async () => {
  let updatedId = 0;
  const state = await saveQuizTaskAction(
    { status: "idle" },
    form({
      taskId: "10",
      name: "Додавання",
      taskText: "10+10=",
      themeId: "2",
      answer1: "10",
      answer2: "20",
      answer3: "30",
      answer4: "0",
      rightAnswerN: "2",
      difficulty: "3",
    }),
    {
      requireUser: async () => admin,
      createQuizTask: async () => {
        throw new Error("should not create");
      },
      updateQuizTask: async (taskId) => {
        updatedId = taskId;
        return sampleTask;
      },
      revalidatePath: () => undefined,
      invalidateCatalogCache: () => undefined,
    },
  );

  assert.equal(updatedId, 10);
  assert.equal(state.status, "success");
  if (state.status === "success") assert.equal(state.mode, "update");
});

test("saveQuizTaskAction forbids non-admin", async () => {
  const state = await saveQuizTaskAction(
    { status: "idle" },
    form({
      name: "A",
      taskText: "B",
      themeId: "1",
      answer1: "1",
      answer2: "2",
      answer3: "3",
      answer4: "4",
      rightAnswerN: "1",
      difficulty: "1",
    }),
    {
      requireUser: async () => student,
      createQuizTask: async () => sampleTask,
      updateQuizTask: async () => sampleTask,
      revalidatePath: () => undefined,
      invalidateCatalogCache: () => undefined,
    },
  );
  assert.deepEqual(state, { status: "error", code: "forbidden" });
});

test("deleteQuizTaskAction maps in_use", async () => {
  const state = await deleteQuizTaskAction(
    { status: "idle" },
    form({ taskId: "10" }),
    {
      requireUser: async () => admin,
      deleteQuizTask: async () => {
        throw new AdminContentError("in use", "in_use");
      },
      revalidatePath: () => undefined,
      invalidateCatalogCache: () => undefined,
    },
  );
  assert.deepEqual(state, { status: "error", code: "in_use" });
});
