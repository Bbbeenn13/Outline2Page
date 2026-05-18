import { describe, expect, it } from "vitest";
import { createNodeFromTemplate } from "../../src/figma/node-factory";
import type { PagePlanItem, SectionNode, TemplateInfo } from "../../src/figma/figma-types";
import { createMockNode } from "./figma-mock";

const pageItem: PagePlanItem = {
  id: "page-1",
  kind: "TITLE",
  frameName: "03_TITLE_Chapter_Title",
  pageNumber: 3,
  pageNumberText: "03",
  chapterIndex: 1,
  titleIndex: 1,
  chapterTitle: "Chapter",
  titleText: "Title",
  vision: "Vision",
};

function templateInfo(id: string, nodeType: string): TemplateInfo {
  return {
    id,
    name: "PAGE_TEMP：TITLE",
    kindGuess: "TITLE",
    nodeType,
    width: 100,
    height: 50,
    propertyNames: [],
    textLayerNames: [],
  };
}

describe("NodeFactory", () => {
  it("Frame 和 Instance 模板使用 clone，并写入名称坐标和 Section", () => {
    const template = createMockNode({ id: "template-1", name: "PAGE_TEMP：TITLE", type: "FRAME", x: 9, y: 9 });
    const section = createMockNode({ name: "Generated", type: "SECTION" }) as SectionNode;

    const result = createNodeFromTemplate({
      page: pageItem,
      template: templateInfo(template.id, template.type),
      templateNode: template,
      section,
      placement: { x: 120, y: 240 },
    });

    expect(result.node).not.toBe(template);
    expect(result.node?.name).toBe("03_TITLE_Chapter_Title");
    expect(result.node?.x).toBe(120);
    expect(result.node?.y).toBe(240);
    expect(section.children).toContain(result.node);
    expect(template.name).toBe("PAGE_TEMP：TITLE");
  });

  it("Component 模板使用 createInstance", () => {
    const template = createMockNode({ id: "component-1", name: "PAGE_TEMP：STEP", type: "COMPONENT" });
    const section = createMockNode({ name: "Generated", type: "SECTION" }) as SectionNode;

    const result = createNodeFromTemplate({
      page: { ...pageItem, kind: "STEP", frameName: "04_STEP_Title_Step" },
      template: templateInfo(template.id, template.type),
      templateNode: template,
      section,
      placement: { x: 1, y: 2 },
    });

    expect(result.node?.type).toBe("INSTANCE");
    expect(template.createInstanceCalls).toBe(1);
  });

  it("复制失败时返回 warning 并不中断调用方", () => {
    const template = createMockNode({ id: "bad", name: "PAGE_TEMP：BAD", type: "VECTOR" });
    template.clone = () => {
      throw new Error("boom");
    };
    const section = createMockNode({ name: "Generated", type: "SECTION" }) as SectionNode;

    const result = createNodeFromTemplate({
      page: pageItem,
      template: templateInfo(template.id, template.type),
      templateNode: template,
      section,
      placement: { x: 0, y: 0 },
    });

    expect(result.node).toBeNull();
    expect(result.warnings[0].code).toBe("TEMPLATE_CLONE_FAILED");
    expect(section.children).toHaveLength(0);
  });
});
