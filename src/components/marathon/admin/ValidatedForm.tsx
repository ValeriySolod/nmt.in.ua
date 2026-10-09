"use client";

import {
  createContext,
  useActionState,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  type InputHTMLAttributes,
} from "react";
import { useTranslations } from "next-intl";
import {
  IDLE_ADMIN_FORM,
  type AdminFormState,
  type FieldIssue,
} from "@/modules/marathons/daily/forms";
import { useHideSaved } from "./AdminNotices";
import css from "../marathon.module.css";

type IssueContextValue = {
  formId: string;
  message: (field: string) => string | null;
};

const IssueContext = createContext<IssueContextValue>({
  formId: "",
  message: () => null,
});

function errorId(formId: string, name: string): string {
  return `${formId}-${name}-error`;
}

function controlId(formId: string, name: string): string {
  return `${formId}-${name}`;
}

export function AdminField({
  name,
  label,
  hint,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const { formId, message } = useContext(IssueContext);
  const text = message(name);
  return (
    <div className={css.field}>
      <label className={css.fieldLabel} htmlFor={controlId(formId, name)}>
        {label}
      </label>
      {hint ? <p className={css.hint}>{hint}</p> : null}
      {children}
      {text ? (
        <p id={errorId(formId, name)} className={css.fieldError}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function FieldError({ name }: { name: string }) {
  const { formId, message } = useContext(IssueContext);
  const text = message(name);
  if (!text) return null;
  return (
    <p id={errorId(formId, name)} className={css.fieldError}>
      {text}
    </p>
  );
}

export function useFieldDescribedBy(name: string): string | undefined {
  const { formId, message } = useContext(IssueContext);
  return message(name) ? errorId(formId, name) : undefined;
}

function useControl(name: string) {
  const { formId, message } = useContext(IssueContext);
  const text = message(name);
  return {
    id: controlId(formId, name),
    name,
    "aria-invalid": text ? true : undefined,
    "aria-describedby": text ? errorId(formId, name) : undefined,
  };
}

export function AdminInput({
  name,
  ...props
}: { name: string } & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id">) {
  const control = useControl(name);
  return <input className={css.input} {...props} {...control} />;
}

export function AdminTextarea({
  name,
  ...props
}: { name: string } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id">) {
  const control = useControl(name);
  return <textarea className={css.textarea} {...props} {...control} />;
}

export function AdminSelect({
  name,
  children,
  ...props
}: { name: string } & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "id">) {
  const control = useControl(name);
  return (
    <select className={css.select} {...props} {...control}>
      {children}
    </select>
  );
}

type ValidatedFormProps = {
  action: (prev: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  validate: (formData: FormData) => { ok: true } | { ok: false; issues: FieldIssue[] };
  className?: string;
  quiet?: boolean;
  submitLabel: string;
  children: ReactNode;
};

export function ValidatedForm({
  action,
  validate,
  className,
  quiet,
  submitLabel,
  children,
}: ValidatedFormProps) {
  const t = useTranslations("Marathon");
  const hideSaved = useHideSaved();
  const formId = useId();
  const summaryRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const [state, formAction, pending] = useActionState(action, IDLE_ADMIN_FORM);
  const [clientIssues, setClientIssues] = useState<FieldIssue[] | null>(null);
  const [hiddenState, setHiddenState] = useState<AdminFormState | null>(null);
  const serverIssues =
    state.status === "error" && state !== hiddenState ? state.issues : [];
  const issues = clientIssues ?? serverIssues;
  const issueKey = issues.map((issue) => `${issue.field}:${issue.code}`).join("|");

  useEffect(() => {
    if (!pending) lock.current = false;
  }, [pending]);

  useEffect(() => {
    if (!issueKey) return;
    summaryRef.current?.focus();
  }, [issueKey]);

  function textOf(issue: FieldIssue): string {
    return t(`fieldErrors.${issue.field}.${issue.code}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    hideSaved();
    if (pending || lock.current) {
      event.preventDefault();
      return;
    }
    const parsed = validate(new FormData(event.currentTarget));
    if (!parsed.ok) {
      event.preventDefault();
      setClientIssues(parsed.issues);
      return;
    }
    lock.current = true;
    setClientIssues(null);
    setHiddenState(state);
  }

  const value: IssueContextValue = {
    formId,
    message: (field) => {
      const found = issues.find((item) => item.field === field);
      return found ? textOf(found) : null;
    },
  };

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={onSubmit}
      noValidate
    >
      <IssueContext.Provider value={value}>
        {issues.length > 0 ? (
          <div ref={summaryRef} tabIndex={-1} className={css.alertError} role="alert">
            <p>{t("formSummary")}</p>
            <ul>
              {issues.map((item) => (
                <li key={`${item.field}:${item.code}`}>{textOf(item)}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {children}
        <button
          type="submit"
          className={quiet ? css.buttonQuiet : css.button}
          disabled={pending}
          aria-busy={pending || undefined}
        >
          {pending ? t("saving") : submitLabel}
        </button>
      </IssueContext.Provider>
    </form>
  );
}
