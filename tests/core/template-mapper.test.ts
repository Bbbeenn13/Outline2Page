import { describe, expect, it } from "vitest";
import { mapTemplates } from "../../src/core/template-mapper";
import type { PageKind, TemplateInfo } from "../../src/types";

describe("TemplateMapper", () => {
  it("生成完整模板映射", () => {
    const result = mapTemplates({
      requiredPageKinds: ["COVER", "TOC"],
      templates: [template("cover", "COVER"), template("toc", "TOC")],
      selectedTemplateIds: { COVER: "cover", TOC: "toc" },
    });

    expect(result.mapping.COVER?.id).toBe("cover");
    expect(result.mapping.TOC?.id).toBe("toc");
    expect(result.missingKinds).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("缺少一个模板时映射为 null 并返回 warning", () => {
    const result = mapTemplates({
      requiredPageKinds: ["COVER", "STEP"],
      templates: [template("cover", "COVER")],
      selectedTemplateIds: { COVER: "cover" },
    });

    expect(result.mapping.STEP).toBeNull();
    expect(result.missingKinds).toEqual(["STEP"]);
    expect(result.warnings[0]).toMatchObject({
      code: "MISSING_TEMPLATE_SELECTION",
      pageKind: "STEP",
    });
  });

  it("用户选择不存在 id 时返回 SELECTED_TEMPLATE_NOT_FOUND", () => {
    const result = mapTemplates({
      requiredPageKinds: ["TITLE"],
      templates: [template("other", "TITLE")],
      selectedTemplateIds: { TITLE: "missing" },
    });

    expect(result.mapping.TITLE).toBeNull();
    expect(result.warnings[0]).toMatchObject({
      code: "SELECTED_TEMPLATE_NOT_FOUND",
      pageKind: "TITLE",
    });
  });

  it("requiredPageKinds 为空时返回空结果", () => {
    const result = mapTemplates({
      requiredPageKinds: [],
      templates: [template("cover", "COVER")],
      selectedTemplateIds: {},
    });

    expect(result).toEqual({ mapping: {}, missingKinds: [], warnings: [] });
  });
});

function template(id: string, kindGuess: PageKind): TemplateInfo {
  return {
    id,
    name: `PAGE_TEMP:${kindGuess}`,
    kindGuess,
    nodeType: "FRAME",
    width: 1200,
    height: 800,
    propertyNames: [],
    textLayerNames: [],
  };
}
