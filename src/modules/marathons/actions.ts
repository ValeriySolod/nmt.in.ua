"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/modules/auth/getCurrentUser";
import { ensureMarathonSchema } from "./schema";
import { getActiveMarathon } from "./getMarathonLeaderboard";

export type JoinMarathonActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; code: "no_marathon" | "forbidden" | "generic" };

export async function joinMarathonAction(
  _prev: JoinMarathonActionState,
  _formData: FormData,
): Promise<JoinMarathonActionState> {
  try {
    const user = await requireUser();
    if (user.role !== "student") {
      return { status: "error", code: "forbidden" };
    }

    const marathon = await getActiveMarathon();
    if (!marathon) {
      return { status: "error", code: "no_marathon" };
    }

    const { getConnection } = await import("@/lib/db/mysql");
    await ensureMarathonSchema(getConnection);
    const connection = await getConnection();
    try {
      await connection.execute(
        `INSERT IGNORE INTO marathon_participants (marathon_id, user_id) VALUES (?, ?)`,
        [marathon.id, user.id],
      );
    } finally {
      connection.release();
    }

    revalidatePath("/leaderboard");
    return { status: "success" };
  } catch {
    return { status: "error", code: "generic" };
  }
}
