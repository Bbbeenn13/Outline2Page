import { describe, expect, it } from "vitest";
import { fitSectionToNodes, prepareGeneratedSection, selectGeneratedSection } from "../../src/figma/generated-section-manager";
import type { SectionNode } from "../../src/figma/figma-types";
import { GENERATED_PLUGIN_DATA_KEY, GENERATED_PLUGIN_DATA_VALUE } from "../../src/figma/figma-utils";
import { createMockNode, createPage, createRuntime } from "./figma-mock";

describe("GeneratedSectionManager", () => {
  it("只删除带生成标记的旧 Section，并创建新的生成 Section", () => {
    const oldGenerated = createMockNode({ name: "Outline2Page_GENERATED", type: "SECTION" });
    oldGenerated.setPluginData(GENERATED_PLUGIN_DATA_KEY, GENERATED_PLUGIN_DATA_VALUE);
    const userSection = createMockNode({ name: "User Section", type: "SECTION" });
    const template = createMockNode({ name: "PAGE_TEMP：COVER", type: "SECTION" });
    template.setPluginData(GENERATED_PLUGIN_DATA_KEY, GENERATED_PLUGIN_DATA_VALUE);
    const page = createPage([oldGenerated, userSection, template]);
    const runtime = createRuntime(page);

    const result = prepareGeneratedSection({
      currentPage: page,
      figma: runtime,
      generatedAt: "2026-05-17T00:00:00.000Z",
    });

    expect(result.removedCount).toBe(1);
    expect(oldGenerated.removed).toBe(true);
    expect(userSection.removed).toBe(false);
    expect(template.removed).toBe(false);
    expect(result.section.name).toBe("Outline2Page_GENERATED");
    expect(result.section.getPluginData?.(GENERATED_PLUGIN_DATA_KEY)).toBe(GENERATED_PLUGIN_DATA_VALUE);
    expect(page.children).toContain(result.section);
  });

  it("清理旧版本遗留的默认命名生成 Section，避免旧结果叠在新结果下面", () => {
    const legacyGenerated = createMockNode({ name: "Outline2Page_GENERATED", type: "SECTION" });
    const userSection = createMockNode({ name: "User Section", type: "SECTION" });
    const page = createPage([legacyGenerated, userSection]);
    const runtime = createRuntime(page);

    const result = prepareGeneratedSection({
      currentPage: page,
      figma: runtime,
      generatedAt: "2026-05-17T00:00:00.000Z",
    });

    expect(result.removedCount).toBe(1);
    expect(legacyGenerated.removed).toBe(true);
    expect(userSection.removed).toBe(false);
    expect(page.children).toContain(result.section);
  });

  it("可以在生成完成后选中新 Section", () => {
    const page = createPage();
    const runtime = createRuntime(page);
    const { section } = prepareGeneratedSection({ currentPage: page, figma: runtime });

    selectGeneratedSection(section, page);

    expect(page.selection).toEqual([section]);
  });

  it("可以调整生成 Section 外框包住所有生成 frame，并在四周保留 200 间距", () => {
    const section = createMockNode({ name: "Outline2Page_GENERATED", type: "SECTION", width: 0, height: 0 }) as SectionNode;
    const resizeCalls: { width: number; height: number }[] = [];
    section.resizeWithoutConstraints = (width: number, height: number): void => {
      resizeCalls.push({ width, height });
      section.width = width;
      section.height = height;
    };
    const first = createMockNode({ name: "Frame 1", type: "FRAME", x: 120, y: 80, width: 300, height: 200 });
    const second = createMockNode({ name: "Frame 2", type: "FRAME", x: 500, y: 360, width: 260, height: 180 });

    const warnings = fitSectionToNodes(section, [first, second]);

    expect(warnings).toEqual([]);
    expect(section.x).toBe(-80);
    expect(section.y).toBe(-120);
    expect(resizeCalls).toEqual([{ width: 1040, height: 860 }]);
    expect(section.width).toBe(1040);
    expect(section.height).toBe(860);
  });
});
