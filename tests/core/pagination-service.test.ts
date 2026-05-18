import { describe, expect, it } from "vitest";
import { applyPagination } from "../../src/core/pagination-service";
import type { PagePlanItem } from "../../src/types";

describe("PaginationService", () => {
  it("COVER + TOC 时 COVER 为 00，TOC 为 01", () => {
    const result = applyPagination([page("cover", "COVER"), page("toc", "TOC")]);

    expect(result.pages.map((item) => item.pageNumberText)).toEqual(["00", "01"]);
  });

  it("无 COVER 但有 TOC 时 TOC 仍为 01", () => {
    const result = applyPagination([page("toc", "TOC"), page("chapter-1", "CHAPTER", { chapterIndex: 1 })]);

    expect(result.pages.map((item) => item.pageNumberText)).toEqual(["01", "02"]);
    expect(result.chapterRanges).toEqual({ 1: "02-02" });
  });

  it("单章节无 TITLE 时章节跨度为自身页码", () => {
    const result = applyPagination([
      page("cover", "COVER"),
      page("toc", "TOC"),
      page("chapter-1", "CHAPTER", { chapterIndex: 1 }),
    ]);

    expect(result.chapterRanges).toEqual({ 1: "02-02" });
    expect(result.pages[2].tocRange).toBe("02-02");
  });

  it("章节包含多个 TITLE / STEP 时跨度到章节最后页面", () => {
    const result = applyPagination([
      page("cover", "COVER"),
      page("toc", "TOC"),
      page("chapter-1", "CHAPTER", { chapterIndex: 1 }),
      page("title-1-1", "TITLE", { chapterIndex: 1, titleIndex: 1 }),
      page("step-1-1-1", "STEP", { chapterIndex: 1, titleIndex: 1, stepIndex: 1 }),
      page("title-1-2", "TITLE", { chapterIndex: 1, titleIndex: 2 }),
      page("chapter-2", "CHAPTER", { chapterIndex: 2 }),
    ]);

    expect(result.chapterRanges).toEqual({ 1: "02-05", 2: "06-06" });
  });

  it("页码超过 9 时保持两位数格式", () => {
    const pages = Array.from({ length: 11 }, (_, index) =>
      page(`chapter-${String(index + 1)}`, "CHAPTER", { chapterIndex: index + 1 }),
    );

    expect(applyPagination(pages).pages[9].pageNumberText).toBe("10");
  });
});

function page(id: string, kind: PagePlanItem["kind"], patch: Partial<PagePlanItem> = {}): PagePlanItem {
  return {
    id,
    kind,
    frameName: "",
    pageNumber: 0,
    pageNumberText: "",
    vision: "主题",
    templateId: `${kind}-template`,
    ...patch,
  };
}
