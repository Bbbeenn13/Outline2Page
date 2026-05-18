import type { PagePlanItem, PaginationOutput } from "../types";

export function applyPagination(pages: PagePlanItem[]): PaginationOutput {
  let nextPageNumber = 1;
  const chapterBounds = new Map<number, { start: number; end: number }>();

  const paginatedPages = pages.map((page) => {
    const pageNumber = page.kind === "COVER" ? 0 : nextPageNumber++;
    const pageNumberText = page.kind === "COVER" ? "00" : formatPageNumber(pageNumber);

    if (page.chapterIndex !== undefined && page.kind !== "COVER" && page.kind !== "TOC") {
      const existing = chapterBounds.get(page.chapterIndex);
      if (existing) {
        existing.end = pageNumber;
      } else {
        chapterBounds.set(page.chapterIndex, { start: pageNumber, end: pageNumber });
      }
    }

    return Object.assign({}, page, {
      pageNumber,
      pageNumberText,
    });
  });

  const chapterRanges: Record<number, string> = {};
  chapterBounds.forEach((bounds, chapterIndex) => {
    chapterRanges[chapterIndex] = `${formatPageNumber(bounds.start)}-${formatPageNumber(bounds.end)}`;
  });

  return {
    pages: paginatedPages.map((page) =>
      page.chapterIndex === undefined
        ? page
        : Object.assign({}, page, {
            tocRange: chapterRanges[page.chapterIndex],
          }),
    ),
    chapterRanges,
  };
}

export function formatPageNumber(pageNumber: number): string {
  return pageNumber.toString().padStart(2, "0");
}
