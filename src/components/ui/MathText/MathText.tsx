import clsx from "clsx";
import katex from "katex";
import { parseMathText } from "./parseMathText";
import css from "./MathText.module.css";

type MathTextProps = {
  text: string;
  className?: string;
  as?: "span" | "div";
};

function Formula({
  content,
  displayMode,
}: {
  content: string;
  displayMode: boolean;
}) {
  const html = katex.renderToString(content, {
    displayMode,
    throwOnError: false,
    output: "htmlAndMathml",
    strict: "warn",
    trust: false,
  });

  return (
    <span
      className={clsx(
        css.formula,
        displayMode ? css.displayFormula : css.inlineFormula,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathText({ text, className, as = "span" }: MathTextProps) {
  const Tag = as === "div" ? "div" : "span";
  const parts = parseMathText(text);

  return (
    <Tag className={clsx(css.root, className)}>
      {parts.map((part, index) =>
        part.type === "formula" ? (
          <Formula
            key={`${part.type}-${index}`}
            content={part.content}
            displayMode={part.displayMode}
          />
        ) : (
          <span key={`${part.type}-${index}`}>{part.content}</span>
        ),
      )}
    </Tag>
  );
}
