"use client";

import Link from "next/link";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { buildPaginationItems } from "@/lib/paginationPages";
import { queryHref } from "@/lib/queryHref";
import css from "./Pagination.module.css";

export type PaginationProps = {
  pathname: string;
  page: number;
  totalPages: number;
  total: number;
  queryParams?: Record<string, string | null | undefined>;
};

function pageHref(
  pathname: string,
  targetPage: number,
  queryParams: Record<string, string | null | undefined>,
): string {
  return queryHref(pathname, {
    ...queryParams,
    page: targetPage > 1 ? String(targetPage) : null,
  });
}

export function Pagination({
  pathname,
  page,
  totalPages,
  total,
  queryParams = {},
}: PaginationProps) {
  const t = useTranslations("Pagination");

  if (totalPages <= 1) {
    return null;
  }

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const items = buildPaginationItems(page, totalPages);

  return (
    <nav className={css.pager} aria-label={t("pagerAria")}>
      <div className={css.row}>
        {prevPage ? (
          <Link
            href={pageHref(pathname, prevPage, queryParams)}
            className={css.btn}
          >
            {t("prevPage")}
          </Link>
        ) : (
          <span className={clsx(css.btn, css.btnDisabled)} aria-disabled="true">
            {t("prevPage")}
          </span>
        )}

        <ol className={css.pages} aria-label={t("pagesAria")}>
          {items.map((item, index) =>
            item.type === "gap" ? (
              <li key={`gap-${index}`} className={css.gapItem} aria-hidden="true">
                <span className={css.gap}>…</span>
              </li>
            ) : (
              <li key={item.page}>
                {item.page === page ? (
                  <span
                    className={clsx(css.pageNum, css.pageNumActive)}
                    aria-current="page"
                  >
                    {item.page}
                  </span>
                ) : (
                  <Link
                    href={pageHref(pathname, item.page, queryParams)}
                    className={css.pageNum}
                    aria-label={t("goToPage", { page: item.page })}
                  >
                    {item.page}
                  </Link>
                )}
              </li>
            ),
          )}
        </ol>

        {nextPage ? (
          <Link
            href={pageHref(pathname, nextPage, queryParams)}
            className={css.btn}
          >
            {t("nextPage")}
          </Link>
        ) : (
          <span className={clsx(css.btn, css.btnDisabled)} aria-disabled="true">
            {t("nextPage")}
          </span>
        )}
      </div>

      <p className={css.status}>
        {t("pageStatus", { page, totalPages, total })}
      </p>
    </nav>
  );
}
