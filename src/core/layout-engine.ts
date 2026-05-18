import type { LayoutInput, LayoutOutput, PagePlanItem, Size } from "../types";

const defaultRowGap = 100;
const defaultStepGap = 100;
const defaultTitleGroupGap = 200;
const defaultFallbackSize: Size = { width: 1000, height: 600 };

export function calculateLayout(input: LayoutInput): LayoutOutput {
  const options = {
    rowGap: input.options?.rowGap ?? defaultRowGap,
    stepGap: input.options?.stepGap ?? defaultStepGap,
    titleGroupGap: input.options?.titleGroupGap ?? defaultTitleGroupGap,
    fallbackSize: input.options?.fallbackSize ?? defaultFallbackSize,
  };
  const placements: LayoutOutput["placements"] = {};
  const warnings: LayoutOutput["warnings"] = [];
  let y = 0;

  const prefixPages = input.pages.filter((page) => page.kind === "COVER" || page.kind === "TOC");
  const chapterRows = groupChapterRows(input.pages);

  if (prefixPages.length > 0) {
    const rowHeight = placeRow(prefixPages, 0, y, input, placements, warnings, options.fallbackSize, options.stepGap);
    y += rowHeight + options.rowGap;
  }

  chapterRows.forEach((row) => {
    const rowHeight = placeRow(
      row,
      0,
      y,
      input,
      placements,
      warnings,
      options.fallbackSize,
      options.stepGap,
      options.titleGroupGap,
    );
    y += rowHeight + options.rowGap;
  });

  return { placements, warnings };
}

function groupChapterRows(pages: PagePlanItem[]): PagePlanItem[][] {
  const rows = new Map<number, PagePlanItem[]>();
  pages.forEach((page) => {
    if (page.chapterIndex === undefined) {
      return;
    }
    const row = rows.get(page.chapterIndex) ?? [];
    row.push(page);
    rows.set(page.chapterIndex, row);
  });
  return Array.from(rows.entries())
    .sort(([left], [right]) => left - right)
    .map(([, row]) => row);
}

function placeRow(
  row: PagePlanItem[],
  startX: number,
  y: number,
  input: LayoutInput,
  placements: LayoutOutput["placements"],
  warnings: LayoutOutput["warnings"],
  fallbackSize: Size,
  stepGap: number,
  titleGroupGap = stepGap,
): number {
  let x = startX;
  let rowHeight = 0;

  row.forEach((page, index) => {
    if (index > 0) {
      const previousPage = row[index - 1];
      const previousSize = resolveSize(previousPage, input, warnings, fallbackSize);
      x += previousSize.width + gapBetween(previousPage, page, stepGap, titleGroupGap);
    }

    const size = resolveSize(page, input, warnings, fallbackSize);
    placements[page.id] = { x, y };
    rowHeight = Math.max(rowHeight, size.height);
  });

  return rowHeight;
}

function resolveSize(
  page: PagePlanItem,
  input: LayoutInput,
  warnings: LayoutOutput["warnings"],
  fallbackSize: Size,
): Size {
  const size = page.templateId ? input.templateSizes[page.templateId] : undefined;
  if (size) {
    return size;
  }

  if (!warnings.some((warning) => warning.pageId === page.id && warning.code === "MISSING_TEMPLATE_SIZE")) {
    warnings.push({
      source: "layout",
      code: "MISSING_TEMPLATE_SIZE",
      message: `${page.id} 缺少模板尺寸，已使用安全 fallback。`,
      severity: "warning",
      pageId: page.id,
      pageKind: page.kind,
    });
  }

  return fallbackSize;
}

function gapBetween(previousPage: PagePlanItem, nextPage: PagePlanItem, stepGap: number, titleGroupGap: number): number {
  if (
    previousPage.titleIndex !== undefined &&
    nextPage.titleIndex !== undefined &&
    previousPage.titleIndex !== nextPage.titleIndex
  ) {
    return titleGroupGap;
  }

  if (nextPage.kind === "TITLE" && previousPage.kind !== "CHAPTER") {
    return titleGroupGap;
  }

  return stepGap;
}
