import { describe, expect, it } from "vitest";
import { injectProperties } from "../../src/figma/property-injector";
import type { PagePlanItem } from "../../src/figma/figma-types";
import { boolProperty, createMockNode, createRuntime, textProperty, variantProperty } from "./figma-mock";

const pageItem: PagePlanItem = {
  id: "page-1",
  kind: "STEP",
  frameName: "04.step",
  pageNumber: 4,
  pageNumberText: "04",
  chapterIndex: 1,
  titleIndex: 2,
  stepIndex: 3,
  chapterTitle: "第一章",
  titleText: "标题",
  stepText: "小节",
  vision: "愿景",
};

describe("PropertyInjector", () => {
  it("只写入组件属性，并且不修改 TYPE 或同名 Text Layer", async () => {
    const instance = createMockNode({
      name: "Content",
      type: "INSTANCE",
      componentProperties: {
        "PAGE_TITLE_TEXT#abc123": textProperty(),
        PAGE_CHAPTER_TEXT: textProperty(),
        PAGE_STEP_TEXT: textProperty(),
        PAGE_PAGE_TEXT: textProperty(),
        PAGE_VERSION_TEXT: textProperty(),
        TOC_NUM_TEXT: textProperty(),
        TOC_PAGE_RANGE_TEXT: textProperty(),
        SHOW: boolProperty(false),
        HIGHLIGHT: variantProperty("off"),
        TYPE: variantProperty("Default"),
      },
    });
    const text = createMockNode({
      name: "PAGE_TITLE_TEXT",
      type: "TEXT",
      fontName: { family: "Inter", style: "Regular" },
    });
    const root = createMockNode({ name: "Root", type: "FRAME" }, [instance, text]);
    const runtime = createRuntime();

    const result = await injectProperties({
      node: root,
      page: pageItem,
      chapterRanges: { 1: "02-08" },
      figma: runtime,
    });

    expect(result.writtenCount).toBe(7);
    expect(instance.setPropertiesCalls[0]).toMatchObject({
      "PAGE_TITLE_TEXT#abc123": "标题",
      PAGE_CHAPTER_TEXT: "第一章",
      PAGE_STEP_TEXT: "小节",
      PAGE_PAGE_TEXT: "04",
      PAGE_VERSION_TEXT: "愿景",
      TOC_NUM_TEXT: "01",
      TOC_PAGE_RANGE_TEXT: "02-08",
    });
    expect(instance.setPropertiesCalls[0]).not.toHaveProperty("TYPE");
    expect(instance.setPropertiesCalls[0]).not.toHaveProperty("SHOW");
    expect(instance.setPropertiesCalls[0]).not.toHaveProperty("HIGHLIGHT");
    expect(text.characters).toBe("");
    expect(runtime.loadFontCalls).toEqual([]);
  });

  it("忽略同名 Text Layer，不再触发字体加载 warning", async () => {
    const text = createMockNode({
      name: "PAGE_TITLE_TEXT",
      type: "TEXT",
      fontName: { family: "Missing", style: "Regular" },
    });
    const runtime = createRuntime();
    runtime.loadFontAsync = () => Promise.reject(new Error("missing font"));

    const result = await injectProperties({
      node: text,
      page: pageItem,
      chapterRanges: {},
      figma: runtime,
    });

    expect(text.characters).toBe("");
    expect(result.warnings.some((item) => item.code === "TEXT_FONT_LOAD_FAILED")).toBe(false);
  });

  it("组件属性读取失败时会跳过该实例并继续处理其他实例", async () => {
    const broken = createMockNode({ name: "Broken", type: "INSTANCE" });
    Object.defineProperty(broken, "componentProperties", {
      configurable: true,
      get() {
        throw new Error("get_componentProperties");
      },
    });
    const instance = createMockNode({
      name: "Content",
      type: "INSTANCE",
      componentProperties: {
        PAGE_TITLE_TEXT: textProperty(),
      },
    });
    const root = createMockNode({ name: "Root", type: "FRAME" }, [broken, instance]);

    const result = await injectProperties({
      node: root,
      page: pageItem,
      chapterRanges: {},
    });

    expect(result.writtenCount).toBeGreaterThan(0);
    expect(instance.setPropertiesCalls[0]).toMatchObject({ PAGE_TITLE_TEXT: "标题" });
    expect(result.warnings.some((item) => item.code === "COMPONENT_PROPERTIES_READ_FAILED")).toBe(true);
  });

  it("属性赋值会穿透外层容器写入内部实例", async () => {
    const innerInstance = createMockNode({
      name: "InnerContent",
      type: "INSTANCE",
      componentProperties: {
        PAGE_CHAPTER_TEXT: textProperty(),
      },
    });
    const wrapper = createMockNode({ name: "Wrapper", type: "FRAME" }, [
      createMockNode({ name: "Nested", type: "GROUP" }, [innerInstance]),
    ]);

    const result = await injectProperties({
      node: wrapper,
      page: pageItem,
      chapterRanges: {},
    });

    expect(result.writtenCount).toBe(1);
    expect(innerInstance.setPropertiesCalls[0]).toMatchObject({ PAGE_CHAPTER_TEXT: "第一章" });
  });

  it("propertyMapping 可以用旧属性名覆盖目标属性", async () => {
    const instance = createMockNode({
      name: "MappedContent",
      type: "INSTANCE",
      componentProperties: {
        PAGE_TITLE_TEXT: textProperty(),
        CUSTOM_TITLE_TEXT: textProperty(),
      },
    });
    const root = createMockNode({ name: "Root", type: "FRAME" }, [instance]);

    await injectProperties({
      node: root,
      page: { ...pageItem, titleText: "Mapped title" },
      chapterRanges: {},
      propertyMapping: {
        PAGE_TITLE_TEXT: "CUSTOM_TITLE_TEXT",
      },
    });

    expect(instance.setPropertiesCalls[0]).toMatchObject({
      CUSTOM_TITLE_TEXT: "Mapped title",
    });
    expect(instance.setPropertiesCalls[0]).not.toHaveProperty("PAGE_TITLE_TEXT");
  });

  it("propertyMapping 会忽略不含 _TEXT 的目标属性", async () => {
    const instance = createMockNode({
      name: "MappedContent",
      type: "INSTANCE",
      componentProperties: {
        TITLE: textProperty(),
        PAGE_TITLE_TEXT: textProperty(),
      },
    });
    const root = createMockNode({ name: "Root", type: "FRAME" }, [instance]);

    await injectProperties({
      node: root,
      page: { ...pageItem, titleText: "Mapped title" },
      chapterRanges: {},
      propertyMapping: {
        PAGE_TITLE_TEXT: "TITLE",
      },
    });

    expect(instance.setPropertiesCalls[0]).toMatchObject({ PAGE_TITLE_TEXT: "Mapped title" });
    expect(instance.setPropertiesCalls[0]).not.toHaveProperty("TITLE");
  });

  it("propertyMapping 支持 UI 发送的语义字段 key", async () => {
    const instance = createMockNode({
      name: "SemanticContent",
      type: "INSTANCE",
      componentProperties: {
        CUSTOM_VISION_TEXT: textProperty(),
        CUSTOM_STEP_TEXT: textProperty(),
      },
    });
    const root = createMockNode({ name: "Root", type: "FRAME" }, [instance]);

    await injectProperties({
      node: root,
      page: { ...pageItem, kind: "COVER", vision: "Vision 1.0", stepText: "小节 A" },
      chapterRanges: {},
      propertyMapping: {
        vision: "CUSTOM_VISION_TEXT",
        stepText: "CUSTOM_STEP_TEXT",
      },
    });

    expect(instance.setPropertiesCalls[0]).toMatchObject({
      CUSTOM_VISION_TEXT: "Vision 1.0",
      CUSTOM_STEP_TEXT: "小节 A",
    });
  });

  it("封面 vision 默认写入 COVER_VERSION_TEXT", async () => {
    const instance = createMockNode({
      name: "Cover",
      type: "INSTANCE",
      componentProperties: {
        COVER_VERSION_TEXT: textProperty(),
      },
    });
    const root = createMockNode({ name: "Root", type: "FRAME" }, [instance]);

    await injectProperties({
      node: root,
      page: { ...pageItem, kind: "COVER", vision: "Vision 1.0" },
      chapterRanges: {},
    });

    expect(instance.setPropertiesCalls[0]).toMatchObject({
      COVER_VERSION_TEXT: "Vision 1.0",
    });
  });
  it("skips navigation groups so nav injectors own repeated PAGE_TITLE_TEXT values", async () => {
    const navItem = createMockNode({
      name: "PAGE_NAV_group",
      type: "INSTANCE",
      componentProperties: {
        TYPE: variantProperty("TITLE"),
        PAGE_TITLE_TEXT: textProperty(),
      },
    });
    const root = createMockNode({ name: "Root", type: "FRAME" }, [navItem]);

    const result = await injectProperties({
      node: root,
      page: { ...pageItem, titleText: "Current Title" },
      chapterRanges: {},
    });

    expect(result.writtenCount).toBe(0);
    expect(navItem.setPropertiesCalls).toEqual([]);
    expect(result.missingProperties).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("does not skip ordinary writable instances only because they are inside NAV_group", async () => {
    const ordinaryContent = createMockNode({
      name: "Content",
      type: "INSTANCE",
      componentProperties: {
        PAGE_TITLE_TEXT: textProperty(),
      },
    });
    const navItem = createMockNode({
      name: "PAGE_NAV_group",
      type: "INSTANCE",
      componentProperties: {
        TYPE: variantProperty("TITLE"),
        PAGE_TITLE_TEXT: textProperty(),
      },
    });
    const root = createMockNode({ name: "NAV_group", type: "FRAME" }, [ordinaryContent, navItem]);

    const result = await injectProperties({
      node: root,
      page: { ...pageItem, titleText: "Current Title" },
      chapterRanges: {},
    });

    expect(result.writtenCount).toBe(1);
    expect(ordinaryContent.setPropertiesCalls[0]).toMatchObject({ PAGE_TITLE_TEXT: "Current Title" });
    expect(navItem.setPropertiesCalls).toEqual([]);
  });
});
