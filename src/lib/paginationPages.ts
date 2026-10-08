export type PaginationItem =
  | { type: "page"; page: number }
  | { type: "gap" };

/**
 * Page number strip for cabinet tables: 1…5 window near the start, sliding window
 * elsewhere, always first + last when far apart.
 */
export function buildPaginationItems(
  current: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 1) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: "page" as const,
      page: index + 1,
    }));
  }

  const show = new Set<number>([1, totalPages]);

  if (current <= 3) {
    for (let page = 1; page <= Math.min(5, totalPages - 1); page += 1) {
      show.add(page);
    }
  } else if (current >= totalPages - 2) {
    for (
      let page = Math.max(2, totalPages - 4);
      page <= totalPages;
      page += 1
    ) {
      show.add(page);
    }
  } else {
    for (let page = current - 2; page <= current + 2; page += 1) {
      show.add(page);
    }
  }

  const sorted = [...show].sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  for (let index = 0; index < sorted.length; index += 1) {
    const page = sorted[index];
    const prev = sorted[index - 1];
    if (prev !== undefined && page - prev > 1) {
      items.push({ type: "gap" });
    }
    items.push({ type: "page", page });
  }

  return items;
}
