import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageFrame } from "@/components/dashboard/PageFrame";
import {
  addDayAction,
  addMaterialAction,
  addRiddleAction,
  addTaskAction,
  createMarathonAction,
  deleteDayAction,
  deleteMarathonAction,
  deleteMaterialAction,
  deleteRiddleAction,
  deleteTaskAction,
  seedMarathonAction,
  setMarathonStatusAction,
  updateDayAction,
  updateMarathonAction,
} from "@/modules/marathons/daily/actions";
import type {
  DailyMarathon,
  MarathonDay,
  Material,
  ParticipantReport,
  Riddle,
} from "@/modules/marathons/daily/store";
import type { FunnelReport } from "@/modules/marathons/daily/funnel";
import { marathonErrorText } from "./errors";
import { ConfirmSubmit } from "./ConfirmSubmit";
import css from "./marathon.module.css";

export async function MarathonAdminList({
  marathons,
  error,
}: {
  marathons: DailyMarathon[];
  error?: string;
}) {
  const t = await getTranslations("Marathon");
  const message = marathonErrorText(t, error);
  return (
    <PageFrame kicker={t("kicker")} title={t("adminTitle")} lead={t("adminLead")}>
      <div className={css.stack}>
        {message ? <p className={css.alert} role="alert">{message}</p> : null}
        <form action={seedMarathonAction}>
          <button type="submit" className={css.buttonQuiet}>{t("seed")}</button>
        </form>
        <form action={createMarathonAction} className={css.card}>
          <h2>{t("create")}</h2>
          <MarathonFields />
          <button type="submit" className={css.button}>{t("save")}</button>
        </form>
        <ul className={css.stack}>
          {marathons.map((marathon) => (
            <li key={marathon.id}>
              <Link href={`/admin/marathons/${marathon.id}`}>
                {marathon.title} · {t(`status.${marathon.status}`)} · /marathon/{marathon.slug}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PageFrame>
  );
}

function MarathonFields({ marathon }: { marathon?: DailyMarathon }) {
  return (
    <div className={css.row2}>
      <label className={css.field}>
        <span>Адреса</span>
        <input className={css.input} name="slug" defaultValue={marathon?.slug ?? ""} required />
      </label>
      <label className={css.field}>
          <span>Назва</span>
        <input className={css.input} name="title" defaultValue={marathon?.title ?? ""} required />
      </label>
      <label className={css.field}>
          <span>Предмет</span>
        <input className={css.input} name="subject" defaultValue={marathon?.subject ?? "math"} />
      </label>
      <label className={css.field}>
          <span>Дата старту</span>
        <input className={css.input} name="startDate" type="date" defaultValue={marathon?.startDate ?? ""} required />
      </label>
      <label className={css.field}>
          <span>Година (Київ)</span>
        <input className={css.input} name="unlockHour" defaultValue={marathon?.unlockHour ?? "09:00"} required />
      </label>
      <label className={css.field}>
          <span>Днів</span>
        <input className={css.input} name="daysCount" type="number" min={1} max={14} defaultValue={marathon?.daysCount ?? 5} required />
      </label>
      <label className={css.field}>
          <span>Поріг, %</span>
        <input className={css.input} name="passThreshold" type="number" min={0} max={100} defaultValue={marathon?.passThreshold ?? 60} required />
      </label>
      <label className={css.field}>
          <span>Текст кнопки</span>
        <input className={css.input} name="finalCtaText" defaultValue={marathon?.finalCtaText ?? "Продовжити навчання"} required />
      </label>
      <label className={css.field}>
          <span>Посилання кнопки</span>
        <input className={css.input} name="finalCtaUrl" defaultValue={marathon?.finalCtaUrl ?? "/"} required />
      </label>
    </div>
  );
}

type EditorDay = MarathonDay & {
  materials: Material[];
  tasks: Array<{ id: number; order: number; prompt: string; questionId: number | null }>;
};

export async function MarathonAdminEditor({
  marathon,
  riddles,
  days,
  reports,
  funnel,
  questions,
  error,
}: {
  marathon: DailyMarathon;
  riddles: Riddle[];
  days: EditorDay[];
  reports: ParticipantReport[];
  funnel: FunnelReport;
  questions: Array<{ id: number; label: string }>;
  error?: string;
}) {
  const t = await getTranslations("Marathon");
  const message = marathonErrorText(t, error);
  return (
    <PageFrame kicker={t("kicker")} title={marathon.title} lead={`/marathon/${marathon.slug}`}>
      <div className={css.stack}>
        {message ? <p className={css.alert} role="alert">{message}</p> : null}
        <div className={css.actions}>
          {(["draft", "active", "finished"] as const).map((status) => (
            <form key={status} action={setMarathonStatusAction}>
              <input type="hidden" name="id" value={marathon.id} />
              <input type="hidden" name="status" value={status} />
              <button type="submit" className={status === marathon.status ? css.button : css.buttonQuiet}>
                {t(`status.${status}`)}
              </button>
            </form>
          ))}
          <form action={deleteMarathonAction}>
            <input type="hidden" name="id" value={marathon.id} />
            <ConfirmSubmit message={t("deleteConfirm")} className={css.buttonQuiet}>
              {t("delete")}
            </ConfirmSubmit>
          </form>
        </div>
        <form action={updateMarathonAction} className={css.card}>
          <input type="hidden" name="id" value={marathon.id} />
          <MarathonFields marathon={marathon} />
          <button type="submit" className={css.button}>{t("save")}</button>
        </form>

        <section className={css.card} aria-labelledby="riddles">
          <h2 id="riddles">{t("riddlesTitle")}</h2>
          {riddles.map((riddle) => (
            <form key={riddle.id} action={deleteRiddleAction} className={css.actions}>
              <input type="hidden" name="marathonId" value={marathon.id} />
              <input type="hidden" name="riddleId" value={riddle.id} />
              <span>{riddle.order}. {riddle.title}</span>
              <button type="submit" className={css.buttonQuiet}>{t("delete")}</button>
            </form>
          ))}
          <form action={addRiddleAction} className={css.form}>
            <input type="hidden" name="marathonId" value={marathon.id} />
            <input className={css.input} name="order" type="number" min={1} placeholder={t("order")} required />
            <input className={css.input} name="title" placeholder={t("riddleTitle")} required />
            <textarea className={css.textarea} name="body" placeholder={t("body")} required />
            <textarea className={css.textarea} name="answer" placeholder={t("answer")} required />
            <textarea className={css.textarea} name="hint" placeholder={t("hint")} />
            <button type="submit" className={css.button}>{t("addRiddle")}</button>
          </form>
        </section>

        <section className={css.stack} aria-labelledby="days-admin">
          <h2 id="days-admin">{t("daysTitle")}</h2>
          <form className={css.actions} method="get">
            <input className={css.input} name="q" placeholder={t("questionSearch")} />
            <button type="submit" className={css.buttonQuiet}>{t("search")}</button>
          </form>
          <form action={addDayAction} className={css.card}>
            <input type="hidden" name="marathonId" value={marathon.id} />
            <div className={css.row2}>
              <input className={css.input} name="dayNumber" type="number" min={1} max={14} placeholder={t("dayNumber")} required />
              <input className={css.input} name="topic" placeholder={t("topic")} required />
            </div>
            <textarea className={css.textarea} name="introText" placeholder={t("intro")} />
            <button type="submit" className={css.button}>{t("addDay")}</button>
          </form>
          {days.map((day) => (
            <article key={day.id} className={css.card}>
              <form action={updateDayAction} className={css.form}>
                <input type="hidden" name="marathonId" value={marathon.id} />
                <input type="hidden" name="dayId" value={day.id} />
                <input className={css.input} name="topic" defaultValue={day.topic} required />
                <textarea className={css.textarea} name="introText" defaultValue={day.introText ?? ""} />
                <button type="submit" className={css.buttonQuiet}>{t("save")}</button>
              </form>
              <form action={deleteDayAction}>
                <input type="hidden" name="marathonId" value={marathon.id} />
                <input type="hidden" name="dayId" value={day.id} />
                <ConfirmSubmit message={t("deleteConfirm")} className={css.buttonQuiet}>{t("delete")}</ConfirmSubmit>
              </form>
              <ul>
                {day.materials.map((material) => (
                  <li key={material.id}>
                    {material.type}: {material.urlOrBody.slice(0, 80)}
                    <form action={deleteMaterialAction}>
                      <input type="hidden" name="marathonId" value={marathon.id} />
                      <input type="hidden" name="dayId" value={day.id} />
                      <input type="hidden" name="materialId" value={material.id} />
                      <button type="submit" className={css.buttonQuiet}>{t("delete")}</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={addMaterialAction} className={css.form}>
                <input type="hidden" name="marathonId" value={marathon.id} />
                <input type="hidden" name="dayId" value={day.id} />
                <input className={css.input} name="order" type="number" min={1} defaultValue={day.materials.length + 1} />
                <select className={css.select} name="materialType" defaultValue="text">
                  <option value="text">text</option>
                  <option value="youtube">youtube</option>
                  <option value="loom">loom</option>
                </select>
                <textarea className={css.textarea} name="urlOrBody" required />
                <button type="submit" className={css.buttonQuiet}>{t("addMaterial")}</button>
              </form>
              <ul>
                {day.tasks.map((task) => (
                  <li key={task.id}>
                    {task.questionId ? `#${task.questionId}` : task.prompt.slice(0, 80)}
                    <form action={deleteTaskAction}>
                      <input type="hidden" name="marathonId" value={marathon.id} />
                      <input type="hidden" name="dayId" value={day.id} />
                      <input type="hidden" name="taskId" value={task.id} />
                      <button type="submit" className={css.buttonQuiet}>{t("delete")}</button>
                    </form>
                  </li>
                ))}
              </ul>
              <form action={addTaskAction} className={css.form}>
                <input type="hidden" name="marathonId" value={marathon.id} />
                <input type="hidden" name="dayId" value={day.id} />
                <input className={css.input} name="order" type="number" min={1} defaultValue={day.tasks.length + 1} />
                <input className={css.input} name="questionId" type="number" min={1} placeholder={t("questionId")} />
                {questions.length > 0 ? (
                  <p className={css.meta}>{questions.map((item) => item.label).join(" · ")}</p>
                ) : null}
                <textarea className={css.textarea} name="prompt" placeholder={t("inlinePrompt")} />
                {[1, 2, 3, 4].map((index) => (
                  <input key={index} className={css.input} name={`option${index}`} placeholder={`${t("option")} ${index}`} />
                ))}
                <input className={css.input} name="correct" type="number" min={1} max={4} placeholder={t("correct")} />
                <button type="submit" className={css.buttonQuiet}>{t("addTask")}</button>
              </form>
            </article>
          ))}
        </section>

        <section className={css.card} aria-labelledby="funnel">
          <h2 id="funnel">{t("funnelTitle")}</h2>
          <p>
            {t("funnelLine", {
              registered: funnel.totals.registered,
              verified: funnel.totals.emailVerified,
              final: funnel.totals.final,
              converted: funnel.totals.converted,
            })}
          </p>
          <p>{funnel.totals.days.map((count, index) => `${t("dayLabel", { n: index + 1 })}: ${count}`).join(" · ")}</p>
          <ul>
            {funnel.bySource.map((row) => (
              <li key={row.source}>
                {row.source}: {row.counts.registered} / {row.counts.emailVerified} / {row.counts.converted}
              </li>
            ))}
          </ul>
        </section>

        <section className={css.card} aria-labelledby="people">
          <h2 id="people">{t("participants")}</h2>
          <a className={css.buttonQuiet} href={`/api/admin/marathons/${marathon.id}/export`}>
            CSV
          </a>
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("streakLabel")}</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((person) => (
                  <tr key={person.userId}>
                    <td>
                      {person.displayName}
                      <div className={css.meta}>{person.login}</div>
                    </td>
                    <td>{person.streak}</td>
                    <td>
                      {person.days
                        .filter((day) => day.completed)
                        .map((day) => `${day.dayNumber}:${day.score ?? "—"}`)
                        .join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
