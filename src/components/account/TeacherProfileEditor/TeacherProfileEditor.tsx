"use client";

import clsx from "clsx";
import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  saveTeacherProfileAction,
  type SaveTeacherProfileActionState,
} from "@/modules/teachers/actions";
import {
  TEACHER_PROFILE_BIO_MAX,
  TEACHER_PROFILE_CITY_MAX,
  TEACHER_PROFILE_CONTACT_URL_MAX,
  TEACHER_PROFILE_EXPERIENCE_MAX,
  TEACHER_PROFILE_HEADLINE_MAX,
  TEACHER_PROFILE_PUBLICATIONS_MAX,
  TEACHER_PROFILE_SLUG_MAX,
  teacherPublicPath,
  type TeacherProfile,
} from "@/modules/teachers/types";
import css from "./TeacherProfileEditor.module.css";

const INITIAL: SaveTeacherProfileActionState = { status: "idle" };

type TeacherProfileEditorProps = {
  profile: TeacherProfile;
  suggestedSlug: string;
};

export function TeacherProfileEditor({
  profile,
  suggestedSlug,
}: TeacherProfileEditorProps) {
  const t = useTranslations("TeacherProfile");
  const [state, formAction, pending] = useActionState(
    saveTeacherProfileAction,
    INITIAL
  );
  const [copied, setCopied] = useState(false);
  const slug = profile.slug || suggestedSlug;
  const sharePath = profile.slug ? teacherPublicPath(profile.slug) : "";

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyShareLink() {
    if (!sharePath) return;
    const url = `${window.location.origin}${sharePath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={css.panel} aria-labelledby="teacher-profile-title">
      <div>
        <h2 id="teacher-profile-title" className={css.panelTitle}>
          {t("title")}
        </h2>
        <p className={css.panelLead}>{t("lead")}</p>
      </div>

      {state.status === "error" ? (
        <p className={clsx(css.alert, css.alertError)} role="alert">
          {t(`errors.${state.code}`)}
        </p>
      ) : null}

      {state.status === "ok" ? (
        <p className={clsx(css.alert, css.alertSuccess)} role="status">
          {t("saved")}
        </p>
      ) : null}

      <form className={css.form} action={formAction}>
        <label className={css.field}>
          <span className={css.label}>{t("slug")}</span>
          <span className={css.slugRow}>
            <span className={css.slugPrefix} aria-hidden>
              /t/
            </span>
            <input
              className={css.input}
              type="text"
              name="slug"
              defaultValue={slug}
              required
              minLength={3}
              maxLength={TEACHER_PROFILE_SLUG_MAX}
              autoComplete="off"
              spellCheck={false}
              disabled={pending}
            />
          </span>
          <span className={css.hint}>{t("slugHint")}</span>
        </label>

        <label className={css.field}>
          <span className={css.label}>{t("headline")}</span>
          <input
            className={css.input}
            type="text"
            name="headline"
            defaultValue={profile.headline}
            required
            maxLength={TEACHER_PROFILE_HEADLINE_MAX}
            disabled={pending}
          />
        </label>

        <label className={css.field}>
          <span className={css.label}>{t("bio")}</span>
          <textarea
            className={css.textarea}
            name="bio"
            defaultValue={profile.bio}
            required
            maxLength={TEACHER_PROFILE_BIO_MAX}
            rows={5}
            disabled={pending}
          />
        </label>

        <label className={css.field}>
          <span className={css.label}>{t("experience")}</span>
          <input
            className={css.input}
            type="text"
            name="experience"
            defaultValue={profile.experience}
            required
            maxLength={TEACHER_PROFILE_EXPERIENCE_MAX}
            disabled={pending}
          />
          <span className={css.hint}>{t("experienceHint")}</span>
        </label>

        <label className={css.field}>
          <span className={css.label}>{t("publications")}</span>
          <textarea
            className={css.textarea}
            name="publications"
            defaultValue={profile.publications}
            maxLength={TEACHER_PROFILE_PUBLICATIONS_MAX}
            rows={3}
            disabled={pending}
          />
          <span className={css.hint}>{t("publicationsHint")}</span>
        </label>

        <div className={css.pair}>
          <label className={css.field}>
            <span className={css.label}>{t("city")}</span>
            <input
              className={css.input}
              type="text"
              name="city"
              defaultValue={profile.city}
              maxLength={TEACHER_PROFILE_CITY_MAX}
              disabled={pending}
            />
          </label>
          <label className={css.field}>
            <span className={css.label}>{t("country")}</span>
            <input
              className={css.input}
              type="text"
              name="country"
              defaultValue=""
              required
              disabled={pending}
            />
          </label>
          <label className={css.field}>
            <span className={css.label}>{t("subjects")}</span>
            <input
              className={css.input}
              type="text"
              name="subjects"
              defaultValue={profile.subjects.join(", ")}
              disabled={pending}
            />
            <span className={css.hint}>{t("subjectsHint")}</span>
          </label>
        </div>
        <fieldset className={css.fieldset}>
          <legend className={css.label}>{t("levels")}</legend>

          <label className={css.option}>
            <input
              type="checkbox"
              name="levels"
              value="grades_5_9"
              disabled={pending}
            />
            <span>{t("levelsOptions.grades_5_9")}</span>
          </label>

          <label className={css.option}>
            <input
              type="checkbox"
              name="levels"
              value="grades_10_11"
              disabled={pending}
            />
            <span>{t("levelsOptions.grades_10_11")}</span>
          </label>

          <label className={css.option}>
            <input
              type="checkbox"
              name="levels"
              value="nmt"
              disabled={pending}
            />
            <span>{t("levelsOptions.nmt")}</span>
          </label>

          <label className={css.option}>
            <input
              type="checkbox"
              name="levels"
              value="adult"
              disabled={pending}
            />
            <span>{t("levelsOptions.adult")}</span>
          </label>
        </fieldset>
        <fieldset className={css.fieldset}>
  <legend className={css.label}>{t("languages")}</legend>

  <label className={css.option}>
    <input
      type="checkbox"
      name="languages"
      value="uk"
      disabled={pending}
    />
    <span>{t("languageOptions.uk")}</span>
  </label>

  <label className={css.option}>
    <input
      type="checkbox"
      name="languages"
      value="en"
      disabled={pending}
    />
    <span>{t("languageOptions.en")}</span>
  </label>

  <label className={css.option}>
    <input
      type="checkbox"
      name="languages"
      value="de"
      disabled={pending}
    />
    <span>{t("languageOptions.de")}</span>
  </label>

  <label className={css.option}>
    <input
      type="checkbox"
      name="languages"
      value="pl"
      disabled={pending}
    />
    <span>{t("languageOptions.pl")}</span>
  </label>
</fieldset>
        <label className={css.field}>
          <span className={css.label}>{t("contactUrl")}</span>
          <input
            className={css.input}
            type="url"
            name="contactUrl"
            defaultValue={profile.contactUrl}
            maxLength={TEACHER_PROFILE_CONTACT_URL_MAX}
            placeholder="https://…"
            disabled={pending}
          />
        </label>
        <label className={css.field}>
  <span className={css.label}>{t("phone")}</span>
  <input
    className={css.input}
    type="tel"
    name="phone"
    autoComplete="tel"
    disabled={pending}
  />
</label>

<div className={css.pair}>
  <label className={css.field}>
    <span className={css.label}>{t("lessonPrice")}</span>
    <input
      className={css.input}
      type="number"
      name="price"
      min="0"
      step="0.01"
      disabled={pending}
    />
  </label>

  <label className={css.field}>
    <span className={css.label}>{t("currency")}</span>
    <select
      className={css.input}
      name="currency"
      defaultValue=""
      disabled={pending}
    >
      <option value="">—</option>
      <option value="UAH">UAH</option>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
      <option value="PLN">PLN</option>
    </select>
  </label>
</div>

<label className={css.field}>
  <span className={css.label}>{t("lessonDuration")}</span>
  <input
    className={css.input}
    type="number"
    name="lessonDuration"
    min="1"
    disabled={pending}
  />
</label>
<label className={css.field}>
  <span className={css.label}>{t("joinMotivation")}</span>
  <textarea
    className={css.textarea}
    name="joinMotivation"
    rows={5}
    required
    disabled={pending}
  />
  <span className={css.hint}>{t("joinMotivationHint")}</span>
</label>
        {/* <label className={css.check}>
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={profile.isPublic}
            disabled={pending}
          />
          <span>
            <span className={css.checkTitle}>{t("isPublic")}</span>
            <span className={css.hint}>{t("isPublicHint")}</span>
          </span>
        </label> */}

<div className={css.actions}>
  <button type="submit" className={css.submit} disabled={pending}>
    {pending ? t("saving") : t("save")}
  </button>

  <button
    type="button"
    className={css.share}
    disabled={pending}
  >
    {t("submitForModeration")}
  </button>

  <button
    type="button"
    className={css.share}
    onClick={copyShareLink}
    disabled={!profile.slug || pending}
    aria-live="polite"
  >
    {copied ? t("copied") : t("copyLink")}
  </button>
</div>
      </form>
    </section>
  );
}
