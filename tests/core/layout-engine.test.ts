import { describe, expect, it } from "vitest";
import { calculateLayout } from "../../src/core/layout-engine";
import type { PagePlanItem } from "../../src/types";

describe("LayoutEngine", () => {
  it("单章节按 CHAPTER → TITLE → STEP 排列", () => {
    const result = calculateLayout({
      pages: [
        page("chapter-1", "CHAPTER", "chapter", { chapterIndex: 1 }),
        page("title-1-1", "TITLE", "title", { chapterIndex: 1, titleIndex: 1 }),
        page("step-1-1-1", "STEP", "step", { chapterIndex: 1, titleIndex: 1, stepIndex: 1 }),
      ],
      templateSizes: sizes(),
    });

    expect(result.placements).toMatchObject({
      "chapter-1": { x: 0, y: 0 },
      "title-1-1": { x: 200, y: 0 },
      "step-1-1-1": { x: 400, y: 0 },
    });
  });

  it("多章节按行换行，并使用当前行最大高度计算下一行 y", () => {
    const result = calculateLayout({
      pages: [
        page("chapter-1", "CHAPTER", "chapter", { chapterIndex: 1 }),
        page("title-1-1", "TITLE", "tall", { chapterIndex: 1, titleIndex: 1 }),
        page("chapter-2", "CHAPTER", "chapter", { chapterIndex: 2 }),
      ],
      templateSizes: sizes(),
    });

    expect(result.placements["chapter-2"]).toEqual({ x: 0, y: 900 });
  });

  it("同一 TITLE 下多个 STEP 使用 100 间距", () => {
    const result = calculateLayout({
      pages: [
        page("chapter-1", "CHAPTER", "chapter", { chapterIndex: 1 }),
        page("title-1-1", "TITLE", "title", { chapterIndex: 1, titleIndex: 1 }),
        page("step-1-1-1", "STEP", "step", { chapterIndex: 1, titleIndex: 1, stepIndex: 1 }),
        page("step-1-1-2", "STEP", "step", { chapterIndex: 1, titleIndex: 1, stepIndex: 2 }),
      ],
      templateSizes: sizes(),
    });

    expect(result.placements["step-1-1-2"].x - result.placements["step-1-1-1"].x).toBe(150);
  });

  it("不同 TITLE 小队使用 200 间距", () => {
    const result = calculateLayout({
      pages: [
        page("chapter-1", "CHAPTER", "chapter", { chapterIndex: 1 }),
        page("title-1-1", "TITLE", "title", { chapterIndex: 1, titleIndex: 1 }),
        page("step-1-1-1", "STEP", "step", { chapterIndex: 1, titleIndex: 1, stepIndex: 1 }),
        page("title-1-2", "TITLE", "title", { chapterIndex: 1, titleIndex: 2 }),
      ],
      templateSizes: sizes(),
    });

    expect(result.placements["title-1-2"].x - result.placements["step-1-1-1"].x).toBe(250);
  });

  it("不同尺寸模板不会重叠，缺少模板尺寸时返回 warning 并使用 fallback", () => {
    const result = calculateLayout({
      pages: [
        page("cover", "COVER", "missing"),
        page("toc", "TOC", "wide"),
        page("chapter-1", "CHAPTER", "chapter", { chapterIndex: 1 }),
      ],
      templateSizes: sizes(),
    });

    expect(result.placements.toc.x).toBe(1100);
    expect(result.placements["chapter-1"].y).toBe(700);
    expect(result.warnings[0]).toMatchObject({ code: "MISSING_TEMPLATE_SIZE", pageId: "cover" });
  });
});

function sizes() {
  return {
    chapter: { width: 100, height: 600 },
    title: { width: 100, height: 600 },
    step: { width: 50, height: 600 },
    tall: { width: 100, height: 800 },
    wide: { width: 200, height: 600 },
  };
}

function page(
  id: string,
  kind: PagePlanItem["kind"],
  templateId: string,
  patch: Partial<PagePlanItem> = {},
): PagePlanItem {
  return {
    id,
    kind,
    frameName: "",
    pageNumber: 0,
    pageNumberText: "",
    vision: "主题",
    templateId,
    ...patch,
  };
}
