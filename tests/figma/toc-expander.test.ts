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

function tocNavItem(
  type: string,
  textKey: string,
  textValue: string,
  x: number,
  y: number,
): MockNode {
  return createMockNode({
    name: "NAV_item",
    type: "INSTANCE",
    x,
    y,
    width: 72,
    height: 20,
    componentProperties: {
      TYPE: variantProperty(type),
      [textKey]: textProperty(textValue),
      SHOW: boolProperty(false),
    },
  });
}

function tocNavGroup(y: number, titleSlotCount = 3): MockNode {
  const children = [
    tocNavItem("TOC_NUM", "TOC_NUM_TEXT", "00", 0, 0),
    tocNavItem("TOC_CHAPTER", "TOC_CHAPTER_TEXT", "chapter", 44, 0),
    tocNavItem("TOC_PAGE_RANGE", "TOC_PAGE_RANGE_TEXT", "00-00", 180, 0),
    ...Array.from({ length: titleSlotCount }, (_, index) => tocNavItem("TOC_TITLE", "TOC_TITLE_TEXT", "title", 44, 28 + index * 24)),
  ];

  return createMockNode({ name: "TOC_NAV_group", type: "FRAME", x: 0, y, height: 120 }, children);
}

function combinedProperties(node: MockNode): Record<string, string | boolean> {
  return Object.assign({}, ...node.setPropertiesCalls) as Record<string, string | boolean>;
}

function rowItems(row: MockNode): MockNode[] {
  return row.children.filter((child) => child.name === "NAV_item") as MockNode[];
}

describe("TocExpander", () => {
  it("builds one TOC row per chapter and keeps titles inside the chapter group", () => {
    expect(buildTocRows(document, { 1: "02-04", 2: "05-05" })).toEqual([
      { chapterIndex: 1, chapterTitle: "Chapter One", titles: ["Title One", "Title Two"], numText: "01", pageRangeText: "02-04" },
      { chapterIndex: 2, chapterTitle: "Chapter Two", titles: [], numText: "02", pageRangeText: "05-05" },
    ]);
  });

  it("expands TOC_NAV_group only to chapter count", () => {
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [tocNavGroup(0)]);

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: { 1: "02-04", 2: "05-05" },
    });

    const groups = tocNode.children.filter((child) => child.name === "TOC_NAV_group");
    expect(result.expandedCount).toBe(1);
    expect(groups).toHaveLength(2);
    expect(groups.map((row) => row.y)).toEqual([0, 128]);
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

  it("writes flat TOC NAV_item instances by TYPE and hides surplus title slots", () => {
    const first = tocNavGroup(0);
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first]);

    const result = expandAndInjectToc({
      tocNode,
      document,
      chapterRanges: { 1: "02-04" },
    });

    const [num, chapter, range, title1, title2, title3] = rowItems(first);
    expect(result.warnings).toEqual([]);
    expect(combinedProperties(num)).toMatchObject({ TOC_NUM_TEXT: "01", SHOW: true });
    expect(combinedProperties(chapter)).toMatchObject({ TOC_CHAPTER_TEXT: "Chapter One", SHOW: true });
    expect(combinedProperties(range)).toMatchObject({ TOC_PAGE_RANGE_TEXT: "02-04", SHOW: true });
    expect(combinedProperties(title1)).toMatchObject({ TOC_TITLE_TEXT: "Title One", SHOW: true });
    expect(combinedProperties(title2)).toMatchObject({ TOC_TITLE_TEXT: "Title Two", SHOW: true });
    expect(combinedProperties(title3)).toMatchObject({ TOC_TITLE_TEXT: "", SHOW: false });
  });

  it("supports TOC_PAGE with TOC_PAGE_TEXT as a page range alias", () => {
    const first = tocNavGroup(0);
    const range = rowItems(first)[2];
    range.componentProperties = {
      TYPE: variantProperty("TOC_PAGE"),
      TOC_PAGE_TEXT: textProperty("00-00"),
      SHOW: boolProperty(false),
    };
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first]);

    const result = expandAndInjectToc({
      tocNode,
      document: { ...document, chapters: [document.chapters[0]] },
      chapterRanges: { 1: "02-04" },
    });

    expect(result.warnings).toEqual([]);
    expect(combinedProperties(range)).toMatchObject({ TOC_PAGE_TEXT: "02-04", SHOW: true });
  });

  it("clones flat TOC_TITLE item slots when titles are more than template slots", () => {
    const oneChapterDocument: OutlineDocument = { ...document, chapters: [document.chapters[0]] };
    const first = tocNavGroup(0, 1);
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first]);

    const result = expandAndInjectToc({
      tocNode,
      document: oneChapterDocument,
      chapterRanges: { 1: "02-04" },
    });

    const titles = rowItems(first).filter((item) => item.componentProperties?.TYPE.value === "TOC_TITLE");
    expect(result.warnings).toEqual([]);
    expect(titles).toHaveLength(2);
    expect(combinedProperties(titles[0])).toMatchObject({ TOC_TITLE_TEXT: "Title One", SHOW: true });
    expect(combinedProperties(titles[1])).toMatchObject({ TOC_TITLE_TEXT: "Title Two", SHOW: true });
  });

  it("warns when flat TOC_TITLE slots are missing", () => {
    const oneChapterDocument: OutlineDocument = { ...document, chapters: [document.chapters[0]] };
    const first = tocNavGroup(0, 0);
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first]);

    const result = expandAndInjectToc({
      tocNode,
      document: oneChapterDocument,
      chapterRanges: { 1: "02-04" },
    });

    expect(result.warnings.map((item) => item.code)).toContain("TOC_TITLE_SLOT_MISSING");
  });

  it("keeps writing TOC text when SHOW write fails", () => {
    const oneChapterDocument: OutlineDocument = { ...document, chapters: [document.chapters[0]] };
    const first = tocNavGroup(0);
    const items = rowItems(first);
    for (const item of items) {
      const originalSetProperties = item.setProperties.bind(item);
      item.setProperties = (properties: Record<string, string | boolean>): void => {
        if (Object.keys(properties).some((key) => key === "SHOW")) {
          throw new Error("Unable to write SHOW");
        }
        originalSetProperties(properties);
      };
    }
    const tocNode = createMockNode({ name: "TOC", type: "FRAME" }, [first]);

    const result = expandAndInjectToc({
      tocNode,
      document: oneChapterDocument,
      chapterRanges: { 1: "02-04" },
    });

    const [num, chapter, range, title1, title2, title3] = items;
    expect(result.warnings.map((item) => item.code)).toContain("TOC_PROPERTY_WRITE_FAILED");
    expect(combinedProperties(num)).toMatchObject({ TOC_NUM_TEXT: "01" });
    expect(combinedProperties(chapter)).toMatchObject({ TOC_CHAPTER_TEXT: "Chapter One" });
    expect(combinedProperties(range)).toMatchObject({ TOC_PAGE_RANGE_TEXT: "02-04" });
    expect(combinedProperties(title1)).toMatchObject({ TOC_TITLE_TEXT: "Title One" });
    expect(combinedProperties(title2)).toMatchObject({ TOC_TITLE_TEXT: "Title Two" });
    expect(combinedProperties(title3)).toMatchObject({ TOC_TITLE_TEXT: "" });
  });
});
