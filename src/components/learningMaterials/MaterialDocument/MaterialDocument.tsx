import type { ReactNode } from "react";
import clsx from "clsx";
import { MathText } from "@/components/ui/MathText";
import type {
  MaterialContentBlock,
  MaterialParagraphBlock,
  MaterialTableBlock,
  MaterialTextRun,
} from "@/content/learningMaterials/sourceBlocks";
import css from "./MaterialDocument.module.css";

const NativeImage = "img";

type MaterialDocumentProps = {
  blocks: MaterialContentBlock[];
  sectionTargets?: MaterialSectionTarget[];
};

export type MaterialSectionTarget = {
  id: string;
  match: string;
};

function renderRun(run: MaterialTextRun, key: string): ReactNode {
  const text = run.text.replace(/\u00a0+/g, " ");
  let content: ReactNode = run.math ? (
    <MathText text={text} />
  ) : (
    text
  );

  if (run.superscript) content = <sup>{content}</sup>;
  if (run.subscript) content = <sub>{content}</sub>;
  if (run.italic) content = <em>{content}</em>;
  if (run.bold) content = <strong>{content}</strong>;

  return <span key={key}>{content}</span>;
}

function paragraphClass(block: MaterialParagraphBlock) {
  const plainText = block.runs.map(({ text }) => text).join("").trim();

  return clsx(
    css.paragraph,
    block.variant === "sectionHeading" && css.sectionHeading,
    block.variant === "subheading" && css.subheading,
    block.variant === "listItem" && css.listItem,
    block.align === "center" && css.center,
    block.align === "right" && css.right,
    block.align === "both" && css.justify,
    plainText.startsWith("(") && css.parenthetical,
  );
}

function renderParagraph(
  block: MaterialParagraphBlock,
  key: string,
  inTable: boolean,
  anchorId?: string,
) {
  const content = block.runs.map((run, index) =>
    renderRun(run, `${key}-run-${index}`),
  );
  if (inTable) {
    return (
      <p key={key} id={anchorId} className={paragraphClass(block)}>
        {content}
      </p>
    );
  }

  if (block.variant === "sectionHeading") {
    return (
      <h3 key={key} id={anchorId} className={paragraphClass(block)}>
        {content}
      </h3>
    );
  }

  if (block.variant === "subheading") {
    return (
      <h4 key={key} id={anchorId} className={paragraphClass(block)}>
        {content}
      </h4>
    );
  }

  return (
    <p key={key} id={anchorId} className={paragraphClass(block)}>
      {content}
    </p>
  );
}

function renderTable(
  block: MaterialTableBlock,
  key: string,
  inTable: boolean,
  sectionTargets: MaterialSectionTarget[],
  claimedAnchors: Set<string>,
) {
  const totalWidth = block.columnWidths.reduce((sum, width) => sum + width, 0);

  return (
    <div
      key={key}
      className={clsx(
        css.tableScroll,
        inTable && css.nestedTableScroll,
        block.variant === "layout" && css.layoutTableScroll,
        block.variant === "graphPaper" && css.graphPaperScroll,
      )}
      role={inTable ? undefined : "region"}
      aria-label={
        inTable
          ? undefined
          : "Таблиця навчального матеріалу, доступне горизонтальне прокручування"
      }
      tabIndex={inTable ? undefined : 0}
    >
      <table
        className={clsx(
          css.table,
          block.variant === "grid" && css.gridTable,
          block.variant === "layout" && css.layoutTable,
          block.variant === "graphPaper" && css.graphPaper,
        )}
      >
        {totalWidth > 0 ? (
          <colgroup>
            {block.columnWidths.map((width, index) => (
              <col
                key={key + "-column-" + index}
                style={{ width: String((width / totalWidth) * 100) + "%" }}
              />
            ))}
          </colgroup>
        ) : null}
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${key}-row-${rowIndex}`}>
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={`${key}-cell-${rowIndex}-${cellIndex}`}
                  colSpan={cell.colSpan}
                >
                  {renderBlocks(
                    cell.blocks,
                    `${key}-cell-${rowIndex}-${cellIndex}`,
                    true,
                    sectionTargets,
                    claimedAnchors,
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlocks(
  blocks: MaterialContentBlock[],
  prefix: string,
  inTable = false,
  sectionTargets: MaterialSectionTarget[] = [],
  claimedAnchors = new Set<string>(),
) {
  return blocks.map((block, index) => {
    const key = `${prefix}-${index}`;

    if (block.type === "paragraph") {
      const plainText = block.runs.map(({ text }) => text).join("").trim();
      const target = sectionTargets.find(
        ({ id, match }) =>
          !claimedAnchors.has(id) && plainText.startsWith(match),
      );

      if (target) claimedAnchors.add(target.id);

      return renderParagraph(block, key, inTable, target?.id);
    }

    if (block.type === "image") {
      return (
        <figure key={key} className={css.figure}>
          <NativeImage
            src={block.src}
            alt={block.alt}
            className={css.image}
            decoding="async"
          />
        </figure>
      );
    }

    return renderTable(
      block,
      key,
      inTable,
      sectionTargets,
      claimedAnchors,
    );
  });
}

export function MaterialDocument({
  blocks,
  sectionTargets = [],
}: MaterialDocumentProps) {
  return (
    <div className={css.document}>
      {renderBlocks(blocks, "block", false, sectionTargets)}
    </div>
  );
}
