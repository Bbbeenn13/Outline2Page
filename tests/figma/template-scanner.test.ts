import { describe, expect, it } from "vitest";
import { scanTemplates } from "../../src/figma/template-scanner";
import { boolProperty, createMockNode, createPage, resetMockIds, textProperty, variantProperty } from "./figma-mock";

describe("TemplateScanner", () => {
  it("只扫描当前 Page 中的 PAGE_TEMP 模板并提取元信息", () => {
    resetMockIds();
    const titleText = createMockNode({ name: "PAGE_TITLE_TEXT", type: "TEXT" });
    const innerInstance = createMockNode({
      name: "Card",
      type: "INSTANCE",
      componentProperties: {
        "PAGE_TITLE_TEXT#1:2": textProperty(),
        PAGE_PAGE_TEXT: textProperty(),
        TITLE: textProperty(),
        SHOW: boolProperty(true),
        HIGHLIGHT: variantProperty("off"),
      },
    });
    const template = createMockNode({ name: "PAGE_TEMP：TOC", type: "FRAME", width: 320, height: 180 }, [
      innerInstance,
      titleText,
    ]);
    const normalFrame = createMockNode({ name: "Normal Frame", type: "FRAME" });
    const page = createPage([template, normalFrame]);

    const result = scanTemplates(page);

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0]).toMatchObject({
      id: template.id,
      name: "PAGE_TEMP：TOC",
      kindGuess: "TOC",
      nodeType: "FRAME",
      width: 320,
      height: 180,
    });
    expect(result.templates[0].propertyNames).toEqual(["PAGE_PAGE_TEXT", "PAGE_TITLE_TEXT"]);
    expect(result.templates[0].textLayerNames).toEqual([]);
    expect(template.name).toBe("PAGE_TEMP：TOC");
    expect(template.x).toBe(0);
  });

  it("对非标准但可 clone 的模板返回提示，对不可复制模板返回 warning", () => {
    const cloneable = createMockNode({ name: "PAGE_TEMP:DECOR", type: "GROUP" });
    const uncloneable = createMockNode({ name: "PAGE_TEMP:BROKEN", type: "VECTOR" });
    uncloneable.clone = undefined;
    const page = createPage([cloneable, uncloneable]);

    const result = scanTemplates(page);

    expect(result.templates.map((item) => item.kindGuess)).toEqual(["DECOR", "BROKEN"]);
    expect(result.warnings.map((item) => item.code)).toEqual(["TEMPLATE_UNUSUAL_NODE_TYPE", "TEMPLATE_NOT_CLONEABLE"]);
  });

  it("路径式模板名使用最后一级作为默认匹配类型", () => {
    const titleTemplate = createMockNode({ name: "PAGE_TEMP：CHAPTER / TITLE", type: "FRAME" });
    const stepTemplate = createMockNode({ name: "PAGE_TEMP：CHAPTER / TITLE / STEP", type: "FRAME" });
    const page = createPage([titleTemplate, stepTemplate]);

    const result = scanTemplates(page);

    expect(result.templates.map((item) => item.kindGuess)).toEqual(["TITLE", "STEP"]);
  });

  it("组件属性读取失败时继续扫描并返回 warning", () => {
    const brokenInstance = createMockNode({
      name: "Broken Instance",
      type: "INSTANCE",
      componentProperties: {
        PAGE_TITLE_TEXT: textProperty(),
      },
    });
    Object.defineProperty(brokenInstance, "componentProperties", {
      get() {
        throw new Error("Component set for node has existing errors");
      },
    });
    const template = createMockNode({ name: "PAGE_TEMP：TITLE", type: "FRAME" }, [brokenInstance]);
    const page = createPage([template]);

    const result = scanTemplates(page);

    expect(result.templates).toHaveLength(1);
    expect(result.templates[0].propertyNames).toEqual([]);
    expect(result.warnings.some((item) => item.code === "COMPONENT_PROPERTIES_READ_FAILED")).toBe(true);
  });
});
