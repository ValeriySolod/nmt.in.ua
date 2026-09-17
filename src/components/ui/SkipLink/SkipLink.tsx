import css from "./SkipLink.module.css";

type SkipLinkProps = {
  label: string;
};

export function SkipLink({ label }: SkipLinkProps) {
  return (
    <a href="#main-content" className={css.skip}>
      {label}
    </a>
  );
}
