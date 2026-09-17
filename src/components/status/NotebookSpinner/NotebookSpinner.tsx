import css from "./NotebookSpinner.module.css";

type NotebookSpinnerProps = {
  label: string;
};

/** Graph-paper compass: a green ink trace around ∑. */
export function NotebookSpinner({ label }: NotebookSpinnerProps) {
  return (
    <div className={css.spinner} role="status" aria-live="polite" aria-label={label}>
      <svg className={css.face} viewBox="0 0 80 80" width="88" height="88" aria-hidden>
        <rect className={css.paper} x="8" y="8" width="64" height="64" rx="16" />
        <g className={css.grid}>
          <path d="M8 28h64M8 40h64M8 52h64M28 8v64M40 8v64M52 8v64" />
        </g>
        <circle className={css.orbit} cx="40" cy="40" r="18" />
        <circle className={css.trace} cx="40" cy="40" r="18" />
        <circle className={css.nib} cx="40" cy="22" r="3.2" />
        <text className={css.sigma} x="40" y="46" textAnchor="middle">
          ∑
        </text>
      </svg>
    </div>
  );
}
