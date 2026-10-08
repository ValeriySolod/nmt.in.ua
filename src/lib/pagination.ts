/** Default table/list page size for cabinet history views. */
export const TABLE_PAGE_SIZE = 10;

/** Jump forward in page navigation (e.g. +5 pages). */
export const TABLE_PAGE_JUMP = 5;

export type PaginatedSlice<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parseTablePage(raw: string | undefined): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function paginateSlice<T>(
  items: readonly T[],
  page: number,
  pageSize: number = TABLE_PAGE_SIZE,
): PaginatedSlice<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}
