import { InteractiveFormatsShowcase } from "@/components/practice/InteractiveFormatsShowcase";
import { createPageMetadata } from "@/constants/seo";
import { requireSessionUserId } from "@/modules/auth/getCurrentUser";

export async function generateMetadata() {
  return createPageMetadata({
    title: "Інтерактивні формати",
    description: "П'ять нових форматів завдань — по одному прикладу кожного.",
    path: "/practice/interactive",
    noIndex: true,
  });
}

/**
 * Task 6.9 Stage 2 demo: each of the 5 new interactive formats, one seeded
 * task apiece (ids from `scripts/sql/028_stage2_task_formats.sql`). Every
 * attempt is tracked per-user in `practice_stage2_attempts` (see
 * `src/modules/stage2/*`) — standalone from the `tasks2session` trainer
 * flow, same as `/practice/fractions`.
 */
export default async function InteractiveFormatsPage() {
  await requireSessionUserId();
  return <InteractiveFormatsShowcase />;
}
