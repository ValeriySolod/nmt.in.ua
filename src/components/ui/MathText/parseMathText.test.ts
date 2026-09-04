import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";
import { parseMathText } from "./parseMathText";

test("parseMathText keeps ordinary text unchanged", () => {
  assert.deepEqual(parseMathText("Знайдіть значення виразу"), [
    {
      type: "text",
      content: "Знайдіть значення виразу",
    },
  ]);
});

test("parseMathText separates inline and display formulas", () => {
  assert.deepEqual(
    parseMathText(
      String.raw`Якщо \(x = 2\), обчисліть:\[\frac{x^2 + 1}{3}\]`,
    ),
    [
      { type: "text", content: "Якщо " },
      { type: "formula", content: "x = 2", displayMode: false },
      { type: "text", content: ", обчисліть:" },
      {
        type: "formula",
        content: String.raw`\frac{x^2 + 1}{3}`,
        displayMode: true,
      },
    ],
  );
});

test("KaTeX renders the required formulas as HTML and accessible MathML", () => {
  const formulas = [
    String.raw`E = mc^2`,
    String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`,
    String.raw`\int_0^1 x^2\,dx`,
  ];

  for (const formula of formulas) {
    const html = katex.renderToString(formula, {
      displayMode: true,
      output: "htmlAndMathml",
      throwOnError: true,
      trust: false,
    });

    assert.match(html, /class="katex"/);
    assert.match(html, /<math/);
  }
});
