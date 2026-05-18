import { describe, expect, it } from "vitest";
import { buildTocRows, expandAndInjectToc } from "../../src/figma/toc-expander";
import type { OutlineDocument } from "../../src/figma/figma-types";
import { boolProperty, createMockNode, textProperty, variantProperty, type MockNode } from "./figma-mock";

const document: OutlineDocument = {
  vision: "Vision",
  hasToc: true,
  warnings: [],
  chapters: [
    {
      id: "c1",
      index: 1,
      title: "Chapter One",
      sourceLine: 1,
      titles: [
        { id: "t1", chapterIndex: 1, index: 1, title: "Title One", steps: [], sourceLine: 2 },
        { id: "t2", chapterIndex: 1, index: 2, title: "Title Two", steps: [], sourceLine: 3 },
      ],
    },
    {
      id: "c2",
      index: 2,
      title: "Chapter Two",
      sourceLine: 4,
      titles: [],
    },
  ],
};

function tocChapterGroup(y: number, titleSlotCount = 1) {
  const meta = createMockNode({
    name: "ChapterContent",
    type: "INSTANCE",
    componentProperties: {
      "TOC_CHAPTER_TEXT#chapter": textProperty(),
      TOC_NUM_TEXT: textProperty(),
      TOC_PAGE_RANGE_TEXT: textProperty(),
      SHOW: boolProperty(false),
    },
  });
  const slots = Array.from({ length: titleSlotCount }, (_, index) =>
    createMockNode({
      name: "TitleSlot",
      type: "INSTANCE",
      x: index * 80,
      y: 24,
      width: 72,
      componentProperties: {
        TOC_TITLE_TEXT: textProperty(),
        SHOW: boolProperty(false),
      },
    }),
  );
  return createMockNode({ name: "TOC_NAV_group", type: "FRAME", x: 0, y, height: 40 }, [meta, ...slots]);
}

function typedTocChapterGroup(y: number, titleSlotCount = 1) {
  const titleProperties = Object.fromEntries(
    Array.from({ length: titleSlotCount }, (_, index) => [`TOC_TITLE_TEXT#${String(index + 1)}`, textProperty()]),
  );
  return createMockNode({
    name: "TOC_NAV_group",
    type: "INSTANCE",
    x: 0,
    y,
    height: 40,
    componentProperties: {
      TYPE: variantProperty("01"),
      "TOC_CHAPTER_TEXT#chapter": textProperty(),
      TOC_NUM_TEXT: textProperty(),
      TOC_PAGE_RANGE_TEXT: textProperty(),
      SHOW: boolProperty(false),
      ...titleProperties,
    },
  });
}

function prefixedTocChapterGroup(y: number) {
  return createMockNode({
    name: "TOC_NAV_group",
    type: "INSTANCE",
    x: 0,
    y,
    height: 40,
    componentProperties: {
      TYPE: variantProperty("01"),
      "NAV_item/TOC_NUM_TEXT#num": textProperty(),
      "NAV_item/TOC_CHAPTER_TEXT#chapter": textProperty(),
      "NAV_item/TOC_PAGE_RANGE_TEXT#range": textProperty(),
      "NAV_item/TOC_TITLE_TEXT#1": textProperty(),
      "NAV_item/TOC_TITLE_TEXT#2": textProperty(),
      "NAV_item/SHOW#show": boolProperty(false),
    },
  });
}

describe("TocExpander", () => {
  it("builds one TOC row per chapter and keeps titles inside the chapter group", () => {
    expect(buildTocRows(document, { 1: "02-04", 2: "05-05" })).toEqual([
      { chapterIndex: 1, chapterTitle: "Chapter One", titles: ["Title One", "Title Two"], numText: "01", pageRangeText: "02-04" },
      { chapterIndex: 2, chapterTitle: "Chapter Two", titles: [], numText: "02", pageRangeText: "05-05" },
    ]);
  });

  it("does not copy TOC_NAV_group for every title and expands title slots inside the chapter group", () => {
    const first = tocChapterGroup(0, 1);
    const second = tocChapterGroup(48, 1);
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first, second]);

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: { 1: "02-04", 2: "05-05" },
    });

    expect(result.expandedCount).toBe(0);
    const groups = tocNode.children.filter((child) => child.name === "TOC_NAV_group");
    expect(groups).toHaveLength(2);

    const firstGroup = groups[0] as MockNode;
    const firstMeta = firstGroup.children[0] as MockNode;
    const firstTitleSlots = firstGroup.children.filter((child) => child.name === "TitleSlot") as MockNode[];
    expect(firstTitleSlots).toHaveLength(2);
    expect(firstMeta.setPropertiesCalls[0]).toMatchObject({
      "TOC_CHAPTER_TEXT#chapter": "Chapter One",
      TOC_NUM_TEXT: "01",
      TOC_PAGE_RANGE_TEXT: "02-04",
      SHOW: true,
    });
    expect(firstTitleSlots[0].setPropertiesCalls[0]).toMatchObject({ TOC_TITLE_TEXT: "Title One", SHOW: true });
    expect(firstTitleSlots[1].setPropertiesCalls[0]).toMatchObject({ TOC_TITLE_TEXT: "Title Two", SHOW: true });

    const secondGroup = groups[1] as MockNode;
    const secondTitleSlot = secondGroup.children[1] as MockNode;
    expect(secondTitleSlot.setPropertiesCalls[0]).toMatchObject({ TOC_TITLE_TEXT: "", SHOW: false });
  });

  it("expands TOC_NAV_group only to chapter count", () => {
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [tocChapterGroup(0, 2)]);

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: { 1: "02-04", 2: "05-05" },
    });

    const groups = tocNode.children.filter((child) => child.name === "TOC_NAV_group");
    expect(result.expandedCount).toBe(1);
    expect(groups).toHaveLength(2);
    expect(groups.map((row) => row.y)).toEqual([0, 48]);
  });

  it("returns warning when TOC_NAV_group is missing", () => {
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" });

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: {},
    });

    expect(result.warnings[0].code).toBe("TOC_NAV_GROUP_MISSING");
  });

  it("does not treat NAV_group as a TOC row", () => {
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [createMockNode({ name: "NAV_group", type: "FRAME" })]);

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: {},
    });

    expect(result.warnings[0].code).toBe("TOC_NAV_GROUP_MISSING");
  });

  it("writes multiple TOC_TITLE_TEXT properties exposed by one TOC_NAV_group", () => {
    const first = typedTocChapterGroup(0, 2);
    const second = typedTocChapterGroup(48, 1);
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first, second]);

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: { 1: "02-04", 2: "05-05" },
    });

    expect(result.expandedCount).toBe(0);
    expect(result.warnings).toEqual([]);

    expect(first.setPropertiesCalls[0]).toMatchObject({
      "TOC_CHAPTER_TEXT#chapter": "Chapter One",
      TOC_NUM_TEXT: "01",
      TOC_PAGE_RANGE_TEXT: "02-04",
      SHOW: true,
    });
    expect(Object.assign({}, ...first.setPropertiesCalls)).toMatchObject({
      "TOC_TITLE_TEXT#1": "Title One",
      "TOC_TITLE_TEXT#2": "Title Two",
    });
  });

  it("matches TOC text properties exposed under nested NAV_item prefixes", () => {
    const first = prefixedTocChapterGroup(0);
    const second = prefixedTocChapterGroup(48);
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first, second]);

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: { 1: "02-04", 2: "05-05" },
    });

    expect(result.warnings).toEqual([]);
    expect(Object.assign({}, ...first.setPropertiesCalls)).toMatchObject({
      "NAV_item/TOC_NUM_TEXT#num": "01",
      "NAV_item/TOC_CHAPTER_TEXT#chapter": "Chapter One",
      "NAV_item/TOC_PAGE_RANGE_TEXT#range": "02-04",
      "NAV_item/TOC_TITLE_TEXT#1": "Title One",
      "NAV_item/TOC_TITLE_TEXT#2": "Title Two",
      "NAV_item/SHOW#show": true,
    });
  });
});
