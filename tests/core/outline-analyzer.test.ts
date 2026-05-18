import { describe, expect, it } from "vitest";
import { analyzeOutline } from "../../src/core/outline-analyzer";
import { parseOutline } from "../../src/core/outline-parser";

describe("OutlineAnalyzer", () => {
  it("统计 CHAPTER-only 大纲", () => {
    const { document } = parseOutline("《主题》\n# TOC\n## 第一章");

    expect(analyzeOutline(document)).toMatchObject({
      vision: "主题",
      chapterCount: 1,
      titleCount: 0,
      stepCount: 0,
      estimatedPageCount: 3,
      requiredPageKinds: ["COVER", "TOC", "CHAPTER"],
    });
  });

  it("统计 CHAPTER + TITLE 大纲", () => {
    const { document } = parseOutline("《主题》\n# TOC\n## 第一章\n### 标题 A\n### 标题 B");

    expect(analyzeOutline(document)).toMatchObject({
      chapterCount: 1,
      titleCount: 2,
      stepCount: 0,
      estimatedPageCount: 5,
      requiredPageKinds: ["COVER", "TOC", "CHAPTER", "TITLE"],
    });
  });

  it("统计 CHAPTER + TITLE + STEP 大纲", () => {
    const { document } = parseOutline("《主题》\n# TOC\n## 第一章\n### 标题 A\n##### 小节 A");

    expect(analyzeOutline(document)).toMatchObject({
      chapterCount: 1,
      titleCount: 1,
      stepCount: 1,
      estimatedPageCount: 5,
      requiredPageKinds: ["COVER", "TOC", "CHAPTER", "TITLE", "STEP"],
    });
  });

  it("缺少 Vision 时不要求 COVER", () => {
    const { document } = parseOutline("# TOC\n## 第一章");

    expect(analyzeOutline(document).requiredPageKinds).toEqual(["TOC", "CHAPTER"]);
  });

  it("缺少 TOC 时不要求 TOC", () => {
    const { document } = parseOutline("《主题》\n## 第一章");

    expect(analyzeOutline(document).requiredPageKinds).toEqual(["COVER", "CHAPTER"]);
  });
});
