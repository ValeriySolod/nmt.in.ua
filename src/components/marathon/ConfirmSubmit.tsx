"use client";

import { useFormStatus } from "react-dom";

type ConfirmSubmitProps = {
  message: string;
  pendingLabel: string;
  className?: string;
  children: React.ReactNode;
};

export function ConfirmSubmit({
  message,
  pendingLabel,
  className,
  children,
}: ConfirmSubmitProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function SubmitButton({
  className,
  pendingLabel,
  children,
}: {
  className?: string;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending || undefined}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
