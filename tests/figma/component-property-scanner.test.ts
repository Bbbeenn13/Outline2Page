import { describe, expect, it } from "vitest";
import { scanFileComponentProperties } from "../../src/figma/component-property-scanner";
import { boolProperty, createMockNode, createRoot, createRuntime, textProperty, variantProperty } from "./figma-mock";

describe("ComponentPropertyScanner", () => {
  it("扫描当前文件中组件定义和实例暴露的所有组件属性", async () => {
    const component = createMockNode({
      name: "Button Component",
      type: "COMPONENT",
      componentPropertyDefinitions: {
        "PAGE_TITLE_TEXT#abc": textProperty(),
        "HIGHLIGHT#state": variantProperty("off"),
        TITLE: textProperty(),
      },
    });
    const instance = createMockNode({
      name: "Nav Instance",
      type: "INSTANCE",
      componentProperties: {
        "PAGE_TITLE_TEXT#xyz": textProperty(),
        "SHOW#visible": boolProperty(false),
      },
    });
    const root = createRoot([component, instance]);
    const runtime = createRuntime();
    runtime.root = root;

    const result = await scanFileComponentProperties(runtime);

    expect(result.properties).toEqual([
      { name: "PAGE_TITLE_TEXT", count: 2, nodeNames: ["Button Component", "Nav Instance"], types: ["TEXT"] },
    ]);
  });

  it("扫描组件集定义时跳过变体子组件，避免 Figma 抛出 componentPropertyDefinitions 错误", async () => {
    const variant = createMockNode({
      name: "TYPE=PAGE_TITLE, HIGHLIGHT=on",
      type: "COMPONENT",
    });
    Object.defineProperty(variant, "componentPropertyDefinitions", {
      get() {
        throw new Error("Component set for node has existing errors");
      },
    });

    const componentSet = createMockNode(
      {
        name: "Page Navigation",
        type: "COMPONENT_SET",
        componentPropertyDefinitions: {
          "TYPE#type": variantProperty("TITLE"),
          "HIGHLIGHT#state": variantProperty("on"),
          TOC_TITLE_TEXT: textProperty(),
        },
      },
      [variant],
    );
    const root = createRoot([componentSet]);
    const runtime = createRuntime();
    runtime.root = root;

    const result = await scanFileComponentProperties(runtime);

    expect(result.warnings).toEqual([]);
    expect(result.properties).toEqual([
      { name: "TOC_TITLE_TEXT", count: 1, nodeNames: ["Page Navigation"], types: ["TEXT"] },
    ]);
  });
});
