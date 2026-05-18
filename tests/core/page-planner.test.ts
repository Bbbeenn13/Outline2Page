import { describe, expect, it } from "vitest";
import { createPagePlan } from "../../src/core/page-planner";
import { parseOutline } from "../../src/core/outline-parser";
import type { PageKind, TemplateInfo } from "../../src/types";

describe("PagePlanner", () => {
  it("按 COVER → TOC → 大纲顺序生成完整页面计划", () => {
    const { document } = parseOutline("《主题》\n# TOC\n## 第一章\n### 标题 A\n##### 小节 A");
    const result = createPagePlan({
      document,
      templateMapping: mapping(["COVER", "TOC", "CHAPTER", "TITLE", "STEP"]),
    });

    expect(result.pages.map((page) => page.kind)).toEqual(["COVER", "TOC", "CHAPTER", "TITLE", "STEP"]);
    expect(result.pages[2]).toMatchObject({
      id: "chapter-1",
      chapterIndex: 1,
      chapterTitle: "第一章",
      templateId: "CHAPTER-template",
      vision: "主题",
    });
    expect(result.pages[4]).toMatchObject({
      chapterIndex: 1,
      titleIndex: 1,
      stepIndex: 1,
      chapterTitle: "第一章",
      titleText: "标题 A",
      stepText: "小节 A",
    });
  });

  it("缺少 STEP 模板时跳过 STEP 并继续生成其他页面", () => {
    const { document } = parseOutline("《主题》\n# TOC\n## 第一章\n### 标题 A\n##### 小节 A");
    const result = createPagePlan({
      document,
      templateMapping: mapping(["COVER", "TOC", "CHAPTER", "TITLE"]),
    });

    expect(result.pages.map((page) => page.kind)).toEqual(["COVER", "TOC", "CHAPTER", "TITLE"]);
    expect(result.skippedPages).toEqual([
      expect.objectContaining({ id: "step-1-1-1", kind: "STEP", reason: "missing-template" }),
    ]);
    expect(result.warnings[0]).toMatchObject({ code: "PAGE_SKIPPED_MISSING_TEMPLATE", pageKind: "STEP" });
  });

  it("缺少 TOC 模板时只跳过 TOC", () => {
    const { document } = parseOutline("《主题》\n# TOC\n## 第一章");
    const result = createPagePlan({
      document,
      templateMapping: mapping(["COVER", "CHAPTER"]),
    });

    expect(result.pages.map((page) => page.kind)).toEqual(["COVER", "CHAPTER"]);
    expect(result.skippedPages[0]).toMatchObject({ id: "toc", kind: "TOC" });
  });

  it("只有 CHAPTER 时上下文仍足够后续注入", () => {
    const { document } = parseOutline("《主题》\n# TOC\n## 第一章");
    const result = createPagePlan({
      document,
      templateMapping: mapping(["COVER", "TOC", "CHAPTER"]),
    });

    expect(result.pages[2]).toMatchObject({
      kind: "CHAPTER",
      chapterIndex: 1,
      chapterTitle: "第一章",
    });
    expect(result.pages[2].titleIndex).toBeUndefined();
    expect(result.pages[2].stepIndex).toBeUndefined();
  });
});

function mapping(kinds: PageKind[]): Record<string, TemplateInfo> {
  return Object.fromEntries(kinds.map((kind) => [kind, template(kind)]));
}

function template(kindGuess: PageKind): TemplateInfo {
  return {
    id: `${kindGuess}-template`,
    name: `PAGE_TEMP:${kindGuess}`,
    kindGuess,
    nodeType: "FRAME",
    width: 1200,
    height: 800,
    propertyNames: [],
    textLayerNames: [],
  };
}
