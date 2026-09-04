export type MathPart =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "formula";
      content: string;
      displayMode: boolean;
    };

const LATEX_PATTERN = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;

export function parseMathText(text: string): MathPart[] {
  return text
    .split(LATEX_PATTERN)
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith("\\[") && part.endsWith("\\]")) {
        return {
          type: "formula",
          content: part.slice(2, -2).trim(),
          displayMode: true,
        };
      }

      if (part.startsWith("\\(") && part.endsWith("\\)")) {
        return {
          type: "formula",
          content: part.slice(2, -2).trim(),
          displayMode: false,
        };
      }

      return {
        type: "text",
        content: part,
      };
    });
}
