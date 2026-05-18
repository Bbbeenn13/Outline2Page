import { describe, expect, it } from "vitest";
import { injectNavigation } from "../../src/figma/navigation-injector";
import type { InstanceNode, OutlineDocument, PagePlanItem } from "../../src/figma/figma-types";
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
        {
          id: "t1",
          chapterIndex: 1,
          index: 1,
          title: "Title One",
          sourceLine: 2,
          steps: [
            { id: "s1", chapterIndex: 1, titleIndex: 1, index: 1, title: "Step One", sourceLine: 3 },
            { id: "s2", chapterIndex: 1, titleIndex: 1, index: 2, title: "Step Two", sourceLine: 4 },
          ],
        },
        {
          id: "t2",
          chapterIndex: 1,
          index: 2,
          title: "Title Two",
          sourceLine: 5,
          steps: [],
        },
      ],
    },
  ],
};

const multiChapterDocument: OutlineDocument = {
  vision: "Vision",
  hasToc: true,
  warnings: [],
  chapters: [
    {
      id: "c1",
      index: 1,
      title: "Intro",
      sourceLine: 1,
      titles: [{ id: "t1", chapterIndex: 1, index: 1, title: "Intro Title", sourceLine: 2, steps: [] }],
    },
    {
      id: "c2",
      index: 2,
      title: "Store Guide",
      sourceLine: 3,
      titles: [
        { id: "t2-1", chapterIndex: 2, index: 1, title: "Prototype", sourceLine: 4, steps: [] },
        { id: "t2-2", chapterIndex: 2, index: 2, title: "Plan Spec", sourceLine: 5, steps: [] },
      ],
    },
  ],
};

const page: PagePlanItem = {
  id: "p",
  kind: "STEP",
  frameName: "04.Chapter One/Title One/Step Two",
  pageNumber: 4,
  pageNumberText: "04",
  chapterIndex: 1,
  titleIndex: 1,
  stepIndex: 2,
  chapterTitle: "Chapter One",
  titleText: "Title One",
  stepText: "Step Two",
  vision: "Vision",
};

function nav(kind: "CHAPTER" | "TITLE" | "STEP", x: number, y: number) {
  return createMockNode({
    name: "PAGE_NAV_group",
    type: "INSTANCE",
    x,
    y,
    width: 80,
    componentProperties: {
      TYPE: variantProperty(kind),
      "SHOW#visible": boolProperty(false),
      "HIGHLIGHT#state": variantProperty("off"),
      PAGE_STEP_TEXT: textProperty(),
      PAGE_TITLE_TEXT: textProperty(),
      PAGE_CHAPTER_TEXT: textProperty(),
    },
  });
}

function navContainer(kind: "CHAPTER" | "TITLE" | "STEP", x: number, y: number) {
  const content = createMockNode({
    name: "NavContent",
    type: "INSTANCE",
    componentProperties: {
      TYPE: variantProperty(kind),
      "SHOW#visible": boolProperty(false),
      "HIGHLIGHT#state": variantProperty("off"),
      PAGE_STEP_TEXT: textProperty(),
      PAGE_TITLE_TEXT: textProperty(),
      PAGE_CHAPTER_TEXT: textProperty(),
    },
  });
  return createMockNode({ name: "PAGE_NAV_group", type: "FRAME", x, y, width: 80 }, [content]);
}

function navItem(kind: "CHAPTER" | "TITLE" | "STEP", x: number, y: number) {
  const textName = kind === "CHAPTER" ? "PAGE_CHAPTER_TEXT" : kind === "TITLE" ? "PAGE_TITLE_TEXT" : "PAGE_STEP_TEXT";
  return createMockNode({
    name: "NAV_item",
    type: "INSTANCE",
    x,
    y,
    width: 80,
    componentProperties: {
      TYPE: variantProperty(`PAGE_${kind}`),
      "SHOW#visible": boolProperty(false),
      "HIGHLIGHT#state": variantProperty("off"),
      [`NAV_item/${textName}#text`]: textProperty(kind.toLowerCase()),
    },
  });
}

function readNavKind(node: MockNode): string | undefined {
  const properties = node.componentProperties;
  if (!properties || !("TYPE" in properties)) return undefined;
  const value = properties.TYPE.value;
  return typeof value === "string" ? value : undefined;
}

function navChildren(root: MockNode, kind: "CHAPTER" | "TITLE" | "STEP"): MockNode[] {
  return root.children.filter((child): child is MockNode => readNavKind(child as MockNode) === kind);
}

function combinedProperties(node: MockNode): Record<string, string | boolean> {
  return node.setPropertiesCalls.reduce<Record<string, string | boolean>>((result, properties) => Object.assign(result, properties), {});
}

describe("NavigationInjector", () => {
  it("writes PAGE_NAV_group SHOW/HIGHLIGHT/text by TYPE and visual order", () => {
    const title1 = nav("TITLE", 0, 0);
    const title2 = nav("TITLE", 100, 0);
    const step1 = nav("STEP", 0, 20);
    const step2 = nav("STEP", 100, 20);
    const step3 = nav("STEP", 200, 20);
    const root = createMockNode({ name: "04.Chapter One/Title One/Step Two", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      title1,
      title2,
      step1,
      step2,
      step3,
    ]);

    const result = injectNavigation({ node: root, page, document });

    expect(result.showWrittenCount).toBe(6);
    expect(result.highlightWrittenCount).toBe(6);
    expect(result.warnings).toEqual([]);
    expect(combinedProperties(title1)).toMatchObject({ "SHOW#visible": true, "HIGHLIGHT#state": "on", PAGE_TITLE_TEXT: "Title One" });
    expect(combinedProperties(title2)).toMatchObject({ "SHOW#visible": true, "HIGHLIGHT#state": "off", PAGE_TITLE_TEXT: "Title Two" });
    expect(combinedProperties(step1)).toMatchObject({ "SHOW#visible": true, "HIGHLIGHT#state": "off", PAGE_STEP_TEXT: "Step One" });
    expect(combinedProperties(step2)).toMatchObject({ "SHOW#visible": true, "HIGHLIGHT#state": "on", PAGE_STEP_TEXT: "Step Two" });
    expect(combinedProperties(step3)).toMatchObject({ "SHOW#visible": false, "HIGHLIGHT#state": "off", PAGE_STEP_TEXT: "" });
  });

  it("does not clone missing title slots and warns for manual template adjustment", () => {
    const title1 = nav("TITLE", 0, 0);
    const root = createMockNode({ name: "04.Chapter One/Title One/Step Two", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      title1,
      nav("STEP", 0, 20),
      nav("STEP", 100, 20),
    ]);

    const result = injectNavigation({ node: root, page, document });
    const titleItems = navChildren(root, "TITLE");

    expect(result.warnings).toEqual([]);
    expect(titleItems).toHaveLength(1);
    expect(combinedProperties(titleItems[0])).toMatchObject({ PAGE_TITLE_TEXT: "Title One", "HIGHLIGHT#state": "on" });
  });

  it("writes navigation text when PAGE_NAV_group is a container around writable instances", () => {
    const title1 = navContainer("TITLE", 0, 0);
    const root = createMockNode({ name: "04.Chapter One/Title One/Step Two", type: "FRAME" }, [
      navContainer("CHAPTER", 0, 0),
      title1,
      navContainer("STEP", 0, 20),
      navContainer("STEP", 100, 20),
    ]);

    const result = injectNavigation({ node: root, page, document });
    const titleItems = root.children.filter((child) => child.name === "PAGE_NAV_group" && readNavKind((child as MockNode).children[0] as MockNode) === "TITLE");
    const firstTitleContent = (titleItems[0] as MockNode).children[0] as MockNode;

    expect(result.warnings).toEqual([]);
    expect(titleItems).toHaveLength(1);
    expect(combinedProperties(firstTitleContent)).toMatchObject({
      PAGE_TITLE_TEXT: "Title One",
      "SHOW#visible": true,
      "HIGHLIGHT#state": "on",
    });
  });

  it("writes PAGE_NAV_group nested NAV_item slots by PAGE_* TYPE and _TEXT property", () => {
    const titlePage: PagePlanItem = {
      ...page,
      kind: "TITLE",
      frameName: "03.Chapter One/Title One",
      stepIndex: undefined,
      stepText: undefined,
    };
    const title1 = navItem("TITLE", 100, 0);
    const title2 = navItem("TITLE", 200, 0);
    const navGroup = createMockNode({ name: "PAGE_NAV_group", type: "FRAME" }, [
      navItem("CHAPTER", 0, 0),
      title1,
      title2,
      navItem("STEP", 0, 20),
      navItem("STEP", 100, 20),
    ]);
    const root = createMockNode({ name: "03.Chapter One/Title One", type: "FRAME" }, [navGroup]);

    const result = injectNavigation({ node: root, page: titlePage, document });

    expect(result.warnings).toEqual([]);
    expect(combinedProperties(title1)).toMatchObject({
      "NAV_item/PAGE_TITLE_TEXT#text": "Title One",
      "SHOW#visible": true,
      "HIGHLIGHT#state": "on",
    });
    expect(combinedProperties(title2)).toMatchObject({
      "NAV_item/PAGE_TITLE_TEXT#text": "Title Two",
      "SHOW#visible": true,
      "HIGHLIGHT#state": "off",
    });
  });

  it("uses current frame chapter for a single PAGE_CHAPTER breadcrumb slot", () => {
    const currentPage: PagePlanItem = {
      ...page,
      kind: "TITLE",
      frameName: "18.Store Guide/Plan Spec",
      pageNumber: 18,
      pageNumberText: "18",
      chapterIndex: 2,
      titleIndex: 2,
      stepIndex: undefined,
      chapterTitle: "Store Guide",
      titleText: "Plan Spec",
      stepText: undefined,
    };
    const chapterSlot = navItem("CHAPTER", 0, 0);
    const title1 = navItem("TITLE", 100, 0);
    const title2 = navItem("TITLE", 200, 0);
    const navGroup = createMockNode({ name: "PAGE_NAV_group", type: "FRAME" }, [chapterSlot, title1, title2]);
    const root = createMockNode({ name: "18.Store Guide/Plan Spec", type: "FRAME" }, [navGroup]);

    const result = injectNavigation({ node: root, page: currentPage, document: multiChapterDocument });

    expect(result.warnings).toEqual([]);
    expect(combinedProperties(chapterSlot)).toMatchObject({
      "NAV_item/PAGE_CHAPTER_TEXT#text": "Store Guide",
      "HIGHLIGHT#state": "on",
    });
    expect(combinedProperties(title1)).toMatchObject({ "NAV_item/PAGE_TITLE_TEXT#text": "Prototype", "HIGHLIGHT#state": "off" });
    expect(combinedProperties(title2)).toMatchObject({ "NAV_item/PAGE_TITLE_TEXT#text": "Plan Spec", "HIGHLIGHT#state": "on" });
  });

  it("writes huge chapter text exposed from PAGE_NAV_group NAV_item", () => {
    const chapterSlot = createMockNode({
      name: "NAV_item",
      type: "INSTANCE",
      componentProperties: {
        TYPE: variantProperty("PAGE_CHAPTER"),
        "SHOW#visible": boolProperty(false),
        "HIGHLIGHT#state": variantProperty("off"),
        "NAV_item/PAGE_CHAPTER_TEXT (HUGE)#text": textProperty("chapter"),
      },
    });
    const navGroup = createMockNode({ name: "PAGE_NAV_group", type: "FRAME" }, [chapterSlot]);
    const root = createMockNode({ name: "02.Chapter One", type: "FRAME" }, [navGroup]);

    const result = injectNavigation({ node: root, page: { ...page, kind: "CHAPTER", titleIndex: undefined, stepIndex: undefined }, document });

    expect(result.warnings).toEqual([]);
    expect(combinedProperties(chapterSlot)).toMatchObject({
      "NAV_item/PAGE_CHAPTER_TEXT (HUGE)#text": "Chapter One",
      "SHOW#visible": true,
      "HIGHLIGHT#state": "on",
    });
  });

  it("does not write TOC text properties from PAGE_NAV_group", () => {
    const chapterSlot = createMockNode({
      name: "PAGE_NAV_group",
      type: "INSTANCE",
      componentProperties: {
        TYPE: variantProperty("CHAPTER"),
        "SHOW#visible": boolProperty(false),
        "HIGHLIGHT#state": variantProperty("off"),
        PAGE_CHAPTER_TEXT: textProperty("page chapter"),
        TOC_CHAPTER_TEXT: textProperty("toc chapter"),
        TOC_NUM_TEXT: textProperty("00"),
      },
    });
    const root = createMockNode({ name: "02.Chapter One", type: "FRAME" }, [chapterSlot]);

    const result = injectNavigation({ node: root, page: { ...page, kind: "CHAPTER", titleIndex: undefined, stepIndex: undefined }, document });

    expect(result.warnings).toEqual([]);
    expect(combinedProperties(chapterSlot)).toMatchObject({
      PAGE_CHAPTER_TEXT: "Chapter One",
      "SHOW#visible": true,
      "HIGHLIGHT#state": "on",
    });
    expect(combinedProperties(chapterSlot)).not.toHaveProperty("TOC_CHAPTER_TEXT");
    expect(combinedProperties(chapterSlot)).not.toHaveProperty("TOC_NUM_TEXT");
  });

  it("uses current frame title for a single PAGE_TITLE breadcrumb slot", () => {
    const currentPage: PagePlanItem = {
      ...page,
      kind: "TITLE",
      frameName: "18.Store Guide/Plan Spec",
      pageNumber: 18,
      pageNumberText: "18",
      chapterIndex: 2,
      titleIndex: 2,
      stepIndex: undefined,
      chapterTitle: "Store Guide",
      titleText: "Plan Spec",
      stepText: undefined,
    };
    const chapterSlot = navItem("CHAPTER", 0, 0);
    const titleSlot = navItem("TITLE", 100, 0);
    const navGroup = createMockNode({ name: "PAGE_NAV_group", type: "FRAME" }, [chapterSlot, titleSlot]);
    const root = createMockNode({ name: "18.Store Guide/Plan Spec", type: "FRAME" }, [navGroup]);

    const result = injectNavigation({ node: root, page: currentPage, document: multiChapterDocument });

    expect(result.warnings).toEqual([]);
    expect(combinedProperties(titleSlot)).toMatchObject({
      "NAV_item/PAGE_TITLE_TEXT#text": "Plan Spec",
      "HIGHLIGHT#state": "on",
    });
  });

  it("treats NAV_group as a container and injects PAGE_NAV_group children", () => {
    const title1 = nav("TITLE", 0, 0);
    const title2 = nav("TITLE", 100, 0);
    const navContainerNode = createMockNode({ name: "NAV_group", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      title1,
      title2,
      nav("STEP", 0, 20),
      nav("STEP", 100, 20),
    ]);
    const root = createMockNode({ name: "04.Chapter One/Title One/Step Two", type: "FRAME" }, [navContainerNode]);

    const result = injectNavigation({ node: root, page, document });

    expect(result.warnings).toEqual([]);
    expect(combinedProperties(title1)).toMatchObject({ PAGE_TITLE_TEXT: "Title One", "HIGHLIGHT#state": "on" });
    expect(combinedProperties(title2)).toMatchObject({ PAGE_TITLE_TEXT: "Title Two", "HIGHLIGHT#state": "off" });
  });

  it("uses frame name before page plan when deciding step highlight", () => {
    const step2 = nav("STEP", 0, 10);
    const root = createMockNode({ name: "04.Chapter One/Title One", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      nav("TITLE", 0, 0),
      nav("TITLE", 100, 0),
      nav("STEP", 0, 0),
      step2,
    ]);

    injectNavigation({ node: root, page, document });

    expect(combinedProperties(step2)).toMatchObject({ "SHOW#visible": true, "HIGHLIGHT#state": "off", PAGE_STEP_TEXT: "Step Two" });
  });

  it("keeps parsing legacy page.kind frame names", () => {
    const step2 = nav("STEP", 0, 10);
    const root = createMockNode({ name: "04.step", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      nav("TITLE", 0, 0),
      nav("TITLE", 100, 0),
      nav("STEP", 0, 0),
      step2,
    ]);

    injectNavigation({ node: root, page, document });

    expect(combinedProperties(step2)).toMatchObject({ "SHOW#visible": true, "HIGHLIGHT#state": "on", PAGE_STEP_TEXT: "Step Two" });
  });

  it("falls back to page plan when frame name cannot be parsed", () => {
    const step2 = nav("STEP", 0, 10);
    const root = createMockNode({ name: "legacy_STEP_frame", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      nav("TITLE", 0, 0),
      nav("TITLE", 100, 0),
      nav("STEP", 0, 0),
      step2,
    ]);

    injectNavigation({ node: root, page, document });

    expect(combinedProperties(step2)).toMatchObject({ "HIGHLIGHT#state": "on" });
  });

  it("uses the current step when PAGE_NAV_group has a single step breadcrumb slot", () => {
    const onlyStep = nav("STEP", 0, 0);
    const root = createMockNode({ name: "04.Chapter One/Title One/Step Two", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      nav("TITLE", 0, 0),
      nav("TITLE", 100, 0),
      onlyStep,
    ]);

    const result = injectNavigation({ node: root, page, document });

    expect(result.warnings).toEqual([]);
    expect((root.children.filter((child) => readNavKind(child as MockNode) === "STEP") as InstanceNode[])).toHaveLength(1);
    expect(combinedProperties(onlyStep)).toMatchObject({ "SHOW#visible": true, "HIGHLIGHT#state": "on", PAGE_STEP_TEXT: "Step Two" });
  });

  it("keeps text injection when SHOW or HIGHLIGHT variant write fails", () => {
    const title1 = nav("TITLE", 0, 0);
    const originalSetProperties = title1.setProperties.bind(title1);
    title1.setProperties = (properties: Record<string, string | boolean>): void => {
      if ("HIGHLIGHT#state" in properties) throw new Error("Unable to find a variant with those property values");
      originalSetProperties(properties);
    };
    const root = createMockNode({ name: "04.Chapter One/Title One/Step Two", type: "FRAME" }, [
      nav("CHAPTER", 0, 0),
      title1,
      nav("TITLE", 100, 0),
      nav("STEP", 0, 20),
      nav("STEP", 100, 20),
    ]);

    const result = injectNavigation({ node: root, page, document });

    expect(combinedProperties(title1)).toMatchObject({ PAGE_TITLE_TEXT: "Title One", "SHOW#visible": true });
    expect(combinedProperties(title1)).not.toHaveProperty("HIGHLIGHT#state");
    expect(result.warnings.map((item) => item.code)).toContain("NAV_PROPERTY_WRITE_FAILED");
  });
});
