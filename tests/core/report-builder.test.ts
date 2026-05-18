import { describe, expect, it } from "vitest";
import { buildGenerationReport } from "../../src/core/report-builder";
import type { AppWarning, SkippedPage } from "../../src/types";

describe("ReportBuilder", () => {
  it("生成正常报告摘要", () => {
    const report = buildGenerationReport({
      createdSectionId: "section-1",
      createdCount: 5,
      removedCount: 1,
      skippedPages: [],
      warnings: [],
      tocExpandedCount: 0,
      selectedNodeIds: ["section-1"],
    });

    expect(report).toMatchObject({
      createdSectionId: "section-1",
      createdCount: 5,
      replacedSectionCount: 1,
      skippedCount: 0,
      warningCount: 0,
      selectedNodeIds: ["section-1"],
    });
    expect(report.summaryText).toContain("创建页面：5");
    expect(report.summaryText).toContain("覆盖旧 Section：1");
  });

  it("汇总缺模板报告", () => {
    const report = buildGenerationReport({
      createdCount: 2,
      removedCount: 0,
      skippedPages: [skipped("STEP")],
      warnings: [warning("planning", "PAGE_SKIPPED_MISSING_TEMPLATE", { pageKind: "STEP" })],
      tocExpandedCount: 0,
      selectedNodeIds: [],
    });

    expect(report.skippedCount).toBe(1);
    expect(report.missingTemplates).toEqual(["STEP"]);
  });

  it("汇总缺属性报告", () => {
    const report = buildGenerationReport({
      createdCount: 1,
      removedCount: 0,
      skippedPages: [],
      warnings: [
        warning("injection", "MISSING_PROPERTY", {
          propertyName: "PAGE_TITLE_TEXT",
          pageId: "title-1-1",
        }),
      ],
      tocExpandedCount: 0,
      selectedNodeIds: [],
    });

    expect(report.missingProperties).toEqual([
      { propertyName: "PAGE_TITLE_TEXT", pageId: "title-1-1", source: "injection" },
    ]);
  });

  it("汇总 TOC 扩展报告", () => {
    const report = buildGenerationReport({
      createdCount: 1,
      removedCount: 0,
      skippedPages: [],
      warnings: [warning("toc", "NAV_GROUP_EXPANDED")],
      tocExpandedCount: 3,
      selectedNodeIds: [],
    });

    expect(report.tocExpandedCount).toBe(3);
    expect(report.warningCount).toBe(1);
  });

  it("稳定合并解析、字体加载、无后缀导航排序、TOC 扩展和旧 Section 覆盖边界警告", () => {
    const warnings: AppWarning[] = [
      warning("parser", "MISSING_VISION", { line: 1 }),
      warning("parser", "MISSING_TOC", { line: 1 }),
      warning("parser", "UNSUPPORTED_HEADING_LEVEL", { line: 4 }),
      warning("parser", "TITLE_WITHOUT_CHAPTER", { line: 5 }),
      warning("parser", "STEP_WITHOUT_TITLE", { line: 6 }),
      warning("injection", "FONT_LOAD_FAILED", { pageId: "title-1-1" }),
      warning("navigation", "VISUAL_ORDER_USED"),
      warning("toc", "NAV_GROUP_EXPANDED"),
      warning("generation", "REPLACED_GENERATED_SECTION"),
    ];

    const report = buildGenerationReport({
      createdCount: 4,
      removedCount: 1,
      skippedPages: [],
      warnings,
      tocExpandedCount: 2,
      selectedNodeIds: ["section-1"],
    });

    expect(report.warnings.map((item) => item.code)).toEqual(warnings.map((item) => item.code));
    expect(report.parseWarnings).toHaveLength(5);
    expect(report.replacedSectionCount).toBe(1);
    expect(report.tocExpandedCount).toBe(2);
  });
});

function skipped(kind: SkippedPage["kind"]): SkippedPage {
  return {
    id: `${kind}-id`,
    kind,
    reason: "missing-template",
  };
}

function warning(
  source: AppWarning["source"],
  code: string,
  patch: Partial<AppWarning> = {},
): AppWarning {
  return {
    source,
    code,
    message: code,
    severity: "warning",
    ...patch,
  };
}
