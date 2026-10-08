"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hasPermission } from "@/modules/auth/permissions";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { createUser, CreateUserError } from "@/modules/auth/users";
import { sendRegistrationVerificationMail } from "@/modules/auth/emailMessages";
import { validateRegistrationInput } from "@/modules/auth/validateRegistration";
import { safeInternalPath } from "@/lib/safeInternalPath";
import { dayUnlockAt } from "./calendar";
import { createMarathonBotLink } from "./botLink";
import {
  answersFromForm,
  isDailyStatus,
  isDuplicateKey,
  parseMarathonInput,
  parseMaterial,
  readInt,
  readText,
  utmJsonFromForm,
} from "./forms";
import { seedMathMarathon } from "./seed";
import {
  completeParticipantDay,
  deleteDailyMarathon,
  deleteDay,
  deleteMaterial,
  deleteRiddle,
  deleteTask,
  getDailyBySlug,
  getParticipant,
  insertDailyMarathon,
  insertDay,
  insertMaterial,
  insertRiddle,
  insertTask,
  joinParticipant,
  listDays,
  listProgress,
  markConverted,
  markMaterialsViewed,
  quizTaskExists,
  setDailyStatus,
  setNotifyPrefs,
  updateDailyMarathon,
  updateDay,
} from "./store";
import { loginCandidatesFromEmail, normalizeCtaUrl } from "./utm";

const RETURN_COOKIE = "marathon_return";

async function requireManager() {
  const user = await requireUser();
  if (!hasPermission(user.role, "marathon:manage")) redirect("/");
  return user;
}

function bounds(input: {
  startDate: string;
  unlockHour: string;
  daysCount: number;
}): { startsAt: number; endsAt: number } {
  const startsAt = Math.floor(
    dayUnlockAt({ ...input, dayNumber: 1 }).getTime() / 1000,
  );
  const endsAt = Math.floor(
    dayUnlockAt({ ...input, dayNumber: input.daysCount + 1 }).getTime() / 1000,
  );
  return { startsAt, endsAt };
}

function adminPath(id?: number): string {
  return id ? `/admin/marathons/${id}` : "/admin/marathons";
}

export async function createMarathonAction(formData: FormData): Promise<void> {
  await requireManager();
  const parsed = parseMarathonInput(formData);
  if (!parsed.ok) redirect(`${adminPath()}?error=invalid`);
  let id = 0;
  try {
    id = await insertDailyMarathon({
      ...parsed.value,
      ...bounds(parsed.value),
    });
  } catch (error) {
    if (isDuplicateKey(error)) redirect(`${adminPath()}?error=duplicate`);
    console.error("createMarathonAction", error);
    redirect(`${adminPath()}?error=server`);
  }
  revalidatePath(adminPath());
  redirect(adminPath(id));
}

export async function updateMarathonAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("id"));
  const parsed = parseMarathonInput(formData);
  if (!id || !parsed.ok) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  try {
    await updateDailyMarathon(id, { ...parsed.value, ...bounds(parsed.value) });
  } catch (error) {
    if (isDuplicateKey(error)) redirect(`${adminPath(id)}?error=duplicate`);
    console.error("updateMarathonAction", error);
    redirect(`${adminPath(id)}?error=server`);
  }
  revalidatePath(adminPath(id));
  revalidatePath(`/marathon/${parsed.value.slug}`);
  redirect(adminPath(id));
}

export async function setMarathonStatusAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("id"));
  const status = readText(formData.get("status"), 16);
  if (!id || !isDailyStatus(status)) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  await setDailyStatus(id, status);
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function deleteMarathonAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("id"));
  if (!id) redirect(`${adminPath()}?error=invalid`);
  await deleteDailyMarathon(id);
  revalidatePath(adminPath());
  redirect(adminPath());
}

export async function seedMarathonAction(): Promise<void> {
  await requireManager();
  let result: "created" | "exists" = "created";
  try {
    result = await seedMathMarathon();
  } catch (error) {
    if (isDuplicateKey(error)) redirect(`${adminPath()}?error=seed_exists`);
    console.error("seedMarathonAction", error);
    redirect(`${adminPath()}?error=server`);
  }
  revalidatePath(adminPath());
  redirect(result === "exists" ? `${adminPath()}?error=seed_exists` : adminPath());
}

export async function addRiddleAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const order = readInt(formData.get("order"));
  const title = readText(formData.get("title"), 255);
  const body = readText(formData.get("body"), 8000);
  const answer = readText(formData.get("answer"), 512);
  const hint = readText(formData.get("hint"), 2000);
  if (!id || !order || !title || !body || !answer) {
    redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  }
  try {
    await insertRiddle(id, { order, title, body, answer, hint: hint || null });
  } catch (error) {
    if (isDuplicateKey(error)) redirect(`${adminPath(id)}?error=duplicate`);
    throw error;
  }
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function deleteRiddleAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const riddleId = readInt(formData.get("riddleId"));
  if (!id || !riddleId) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  await deleteRiddle(id, riddleId);
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function addDayAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const dayNumber = readInt(formData.get("dayNumber"));
  const topic = readText(formData.get("topic"), 255);
  const introText = readText(formData.get("introText"), 4000);
  if (!id || !dayNumber || dayNumber < 1 || dayNumber > 14 || topic.length < 2) {
    redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  }
  try {
    await insertDay(id, { dayNumber, topic, introText: introText || null });
  } catch (error) {
    if (isDuplicateKey(error)) redirect(`${adminPath(id)}?error=duplicate`);
    throw error;
  }
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function updateDayAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const dayId = readInt(formData.get("dayId"));
  const topic = readText(formData.get("topic"), 255);
  const introText = readText(formData.get("introText"), 4000);
  if (!id || !dayId || topic.length < 2) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  await updateDay(id, dayId, { topic, introText });
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function deleteDayAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const dayId = readInt(formData.get("dayId"));
  if (!id || !dayId) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  await deleteDay(id, dayId);
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function addMaterialAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const dayId = readInt(formData.get("dayId"));
  const material = parseMaterial(formData);
  if (!id || !dayId || !material) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  try {
    await insertMaterial(dayId, material);
  } catch (error) {
    if (isDuplicateKey(error)) redirect(`${adminPath(id)}?error=duplicate`);
    throw error;
  }
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function deleteMaterialAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const dayId = readInt(formData.get("dayId"));
  const materialId = readInt(formData.get("materialId"));
  if (!id || !dayId || !materialId) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  await deleteMaterial(dayId, materialId);
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function addTaskAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const dayId = readInt(formData.get("dayId"));
  const order = readInt(formData.get("order")) ?? 1;
  const questionId = readInt(formData.get("questionId"));
  if (!id || !dayId || order < 1) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  try {
    if (questionId && questionId > 0) {
      if (!(await quizTaskExists(questionId))) redirect(`${adminPath(id)}?error=question`);
      await insertTask(dayId, {
        order,
        questionId,
        prompt: null,
        options: null,
        correct: null,
      });
    } else {
      const prompt = readText(formData.get("prompt"), 4000);
      const options = [1, 2, 3, 4]
        .map((index) => readText(formData.get(`option${index}`), 500))
        .filter(Boolean);
      const correct = readInt(formData.get("correct"));
      if (!prompt || options.length < 2 || !correct || correct > options.length) {
        redirect(`${adminPath(id)}?error=invalid`);
      }
      await insertTask(dayId, {
        order,
        questionId: null,
        prompt,
        options,
        correct,
      });
    }
  } catch (error) {
    if (isDuplicateKey(error)) redirect(`${adminPath(id)}?error=duplicate`);
    throw error;
  }
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  await requireManager();
  const id = readInt(formData.get("marathonId"));
  const dayId = readInt(formData.get("dayId"));
  const taskId = readInt(formData.get("taskId"));
  if (!id || !dayId || !taskId) redirect(`${adminPath(id ?? undefined)}?error=invalid`);
  await deleteTask(dayId, taskId);
  revalidatePath(adminPath(id));
  redirect(adminPath(id));
}

async function openMarathon(slug: string) {
  const marathon = await getDailyBySlug(slug);
  if (!marathon || marathon.status === "draft") return null;
  return marathon;
}

export async function joinMarathonAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = readText(formData.get("slug"), 64);
  const marathon = await openMarathon(slug);
  if (!marathon || marathon.status !== "active") redirect(`/marathon/${slug}?error=closed`);
  await joinParticipant(marathon.id, user.id, utmJsonFromForm(formData));
  revalidatePath(`/marathon/${slug}/map`);
  redirect(`/marathon/${slug}/map`);
}

export async function registerMarathonAction(formData: FormData): Promise<void> {
  const slug = readText(formData.get("slug"), 64);
  const back = `/marathon/${slug}/join`;
  const marathon = await openMarathon(slug);
  if (!marathon || marathon.status !== "active") redirect(`${back}?error=closed`);
  const name = readText(formData.get("name"), 100);
  const email = readText(formData.get("email"), 255);
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  let validated = validateRegistrationInput({
    login: loginCandidatesFromEmail(email)[0] ?? "user00",
    displayName: name,
    email,
    password,
    passwordConfirm,
  });
  if (!validated.ok && validated.code === "invalidLogin") {
    for (const login of loginCandidatesFromEmail(email)) {
      validated = validateRegistrationInput({
        login,
        displayName: name,
        email,
        password,
        passwordConfirm,
      });
      if (validated.ok || validated.code !== "invalidLogin") break;
    }
  }
  if (!validated.ok) redirect(`${back}?error=${validated.code}`);
  const value = validated.value;
  let userId = 0;
  for (const login of loginCandidatesFromEmail(value.email)) {
    const attempt = validateRegistrationInput({
      login,
      displayName: value.displayName,
      email: value.email,
      password,
      passwordConfirm: password,
    });
    if (!attempt.ok) continue;
    try {
      const user = await createUser({
        login: attempt.value.login,
        displayName: attempt.value.displayName,
        email: attempt.value.email,
        password,
        role: "student",
      });
      userId = user.id;
      break;
    } catch (error) {
      if (error instanceof CreateUserError && error.code === "login_taken") continue;
      if (error instanceof CreateUserError && error.code === "email_taken") {
        redirect(`${back}?error=emailTaken`);
      }
      console.error("registerMarathonAction", error);
      redirect(`${back}?error=server`);
    }
  }
  if (!userId) redirect(`${back}?error=server`);
  await joinParticipant(marathon.id, userId, utmJsonFromForm(formData));
  try {
    await sendRegistrationVerificationMail({
      userId,
      email: value.email,
      displayName: value.displayName,
    });
  } catch (error) {
    console.error("registerMarathonAction mail", error);
  }
  const nextPath = safeInternalPath(`/marathon/${slug}/map`);
  const cookieStore = await cookies();
  cookieStore.set(RETURN_COOKIE, nextPath, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  redirect(
    `/register/check-email?email=${encodeURIComponent(value.email)}&next=${encodeURIComponent(nextPath)}`,
  );
}

export async function markMaterialsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = readText(formData.get("slug"), 64);
  const dayNumber = readInt(formData.get("day"));
  const marathon = await openMarathon(slug);
  const dayPath = `/marathon/${slug}/day/${dayNumber ?? 1}`;
  if (!marathon || !dayNumber) redirect(`/marathon/${slug}/map`);
  const participant = await getParticipant(marathon.id, user.id);
  if (!participant) redirect(`/marathon/${slug}/map`);
  const day = (await listDays(marathon.id)).find((item) => item.dayNumber === dayNumber);
  if (!day) redirect(`/marathon/${slug}/map`);
  const result = await markMaterialsViewed({
    marathon,
    userId: user.id,
    day,
    now: new Date(),
  });
  revalidatePath(dayPath);
  redirect(result === "ok" ? dayPath : `${dayPath}?error=${result}`);
}

export async function submitDayAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = readText(formData.get("slug"), 64);
  const dayNumber = readInt(formData.get("day"));
  const dayPath = `/marathon/${slug}/day/${dayNumber ?? 1}`;
  const marathon = await openMarathon(slug);
  if (!marathon || !dayNumber) redirect(`/marathon/${slug}/map`);
  const participant = await getParticipant(marathon.id, user.id);
  if (!participant) redirect(`/marathon/${slug}/map`);
  const day = (await listDays(marathon.id)).find((item) => item.dayNumber === dayNumber);
  if (!day) redirect(`/marathon/${slug}/map`);
  const progress = await listProgress(marathon.id, user.id);
  const current = progress.find((item) => item.dayNumber === dayNumber);
  const result = await completeParticipantDay({
    marathon,
    userId: user.id,
    day,
    answers: answersFromForm(formData),
    materialsViewed: current?.materialsViewed ?? false,
    progress: progress.map((item) => ({
      dayNumber: item.dayNumber,
      passed: item.passed,
      completedAt: item.completedAt,
    })),
    now: new Date(),
  });
  revalidatePath(dayPath);
  revalidatePath(`/marathon/${slug}/map`);
  revalidatePath(`/marathon/${slug}/final`);
  if (!result.ok) redirect(`${dayPath}?error=${result.code}`);
  redirect(dayPath);
}

export async function notifyPrefsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = readText(formData.get("slug"), 64);
  const marathon = await openMarathon(slug);
  if (!marathon) redirect("/");
  const participant = await getParticipant(marathon.id, user.id);
  if (!participant) redirect(`/marathon/${slug}`);
  await setNotifyPrefs(marathon.id, user.id, {
    notifyEmail: formData.get("notifyEmail") === "1",
    notifyBot: formData.get("notifyBot") === "1",
  });
  revalidatePath(`/marathon/${slug}/map`);
  redirect(`/marathon/${slug}/map`);
}

export async function linkBotAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = readText(formData.get("slug"), 64);
  const marathon = await openMarathon(slug);
  if (!marathon) redirect("/");
  const participant = await getParticipant(marathon.id, user.id);
  if (!participant) redirect(`/marathon/${slug}`);
  const url = await createMarathonBotLink(marathon.id, user.id);
  if (!url) redirect(`/marathon/${slug}/map?error=bot_off`);
  redirect(url);
}

export async function convertMarathonAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = readText(formData.get("slug"), 64);
  const marathon = await openMarathon(slug);
  if (!marathon) redirect("/");
  const participant = await getParticipant(marathon.id, user.id);
  if (!participant) redirect(`/marathon/${slug}/map`);
  await markConverted(marathon.id, user.id, new Date());
  revalidatePath(`/admin/marathons/${marathon.id}`);
  redirect(normalizeCtaUrl(marathon.finalCtaUrl) ?? "/");
}

export async function readMarathonReturnCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(RETURN_COOKIE)?.value;
  if (!value) return null;
  const path = safeInternalPath(value, "");
  return path.startsWith("/marathon/") ? path : null;
}
