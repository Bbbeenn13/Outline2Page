import { describe, expect, it } from "vitest";
import { parseOutline } from "../../src/core/outline-parser";

describe("OutlineParser", () => {
  it("解析完整层级并保留 sourceLine、稳定 id 和索引", () => {
    const result = parseOutline(
      [
        "《Vision》= 零售数字化方案",
        "# TOC",
        "## 第一章",
        "### 门店洞察",
        "##### 客流分析",
        "##### 陈列优化",
        "### 运营节奏",
        "## 第二章",
      ].join("\n"),
    );

    expect(result.document.vision).toBe("零售数字化方案");
    expect(result.document.hasToc).toBe(true);
    expect(result.document.chapters).toHaveLength(2);
    expect(result.document.chapters[0]).toMatchObject({
      id: "chapter-1",
      index: 1,
      title: "第一章",
      sourceLine: 3,
    });
    expect(result.document.chapters[0].titles[0]).toMatchObject({
      id: "title-1-1",
      chapterIndex: 1,
      index: 1,
      title: "门店洞察",
      sourceLine: 4,
    });
    expect(result.document.chapters[0].titles[0].steps[1]).toMatchObject({
      id: "step-1-1-2",
      chapterIndex: 1,
      titleIndex: 1,
      index: 2,
      title: "陈列优化",
      sourceLine: 6,
    });
    expect(result.warnings).toEqual([]);
  });

  it("支持只有 CHAPTER 的大纲", () => {
    const result = parseOutline("《主题》\n# TOC\n## 第一章");

    expect(result.document.chapters).toHaveLength(1);
    expect(result.document.chapters[0].titles).toEqual([]);
  });

  it("支持 CHAPTER + TITLE 的大纲", () => {
    const result = parseOutline("《主题》\n# TOC\n## 第一章\n### 标题 A");

    expect(result.document.chapters[0].titles[0]).toMatchObject({
      title: "标题 A",
      steps: [],
    });
  });

  it("缺少 Vision 和 TOC 时只产生警告，不阻断输出", () => {
    const result = parseOutline("## 第一章");

    expect(result.document.chapters).toHaveLength(1);
    expect(result.warnings.map((warning) => warning.code)).toEqual(["MISSING_VISION", "MISSING_TOC"]);
  });

  it("TITLE 缺少 CHAPTER、STEP 缺少 TITLE、未定义层级和空标题都会产生边界警告", () => {
    const result = parseOutline(
      [
        "《主题》",
        "# TOC",
        "### 无上级标题",
        "##### 无上级小节",
        "#### 未定义层级",
        "##",
      ].join("\n"),
    );

    expect(result.warnings.map((warning) => warning.code)).toEqual([
      "TITLE_WITHOUT_CHAPTER",
      "STEP_WITHOUT_TITLE",
      "UNSUPPORTED_HEADING_LEVEL",
      "EMPTY_TITLE",
    ]);
    expect(result.document.chapters[0].title).toBe("");
  });

  it("Vision 中文书名号内容会被保留", () => {
    const result = parseOutline("《商业增长蓝图》\n# TOC\n## 第一章");

    expect(result.document.vision).toBe("商业增长蓝图");
  });
});
