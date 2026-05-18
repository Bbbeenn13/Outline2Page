import type {
  AppWarning,
  GenerationReport,
  MissingPropertyWarning,
  PageKind,
  ParseWarning,
  ReportBuilderInput,
} from "../types";

export function buildGenerationReport(input: ReportBuilderInput): GenerationReport {
  const warnings = input.warnings.slice();
  const missingTemplates = collectMissingTemplates(input);
  const missingProperties = collectMissingProperties(warnings);
  const skippedCount = input.skippedPages.length;
  const warningCount = warnings.length;

  return {
    createdSectionId: input.createdSectionId ?? null,
    createdCount: input.createdCount,
    replacedSectionCount: input.removedCount,
    skippedCount,
    warningCount,
    warnings,
    missingTemplates,
    missingProperties,
    parseWarnings: warnings.filter((warning): warning is ParseWarning => warning.source === "parser"),
    tocExpandedCount: input.tocExpandedCount,
    selectedNodeIds: input.selectedNodeIds.slice(),
    summaryText: createSummaryText({
      createdCount: input.createdCount,
      removedCount: input.removedCount,
      skippedCount,
      warningCount,
      tocExpandedCount: input.tocExpandedCount,
    }),
  };
}

function collectMissingTemplates(input: ReportBuilderInput): PageKind[] {
  const missingKinds: PageKind[] = [];

  input.skippedPages.forEach((page) => {
    if (page.reason === "missing-template" && !missingKinds.includes(page.kind)) {
      missingKinds.push(page.kind);
    }
  });

  input.warnings.forEach((warning) => {
    if (
      (warning.code === "MISSING_TEMPLATE_SELECTION" ||
        warning.code === "SELECTED_TEMPLATE_NOT_FOUND" ||
        warning.code === "PAGE_SKIPPED_MISSING_TEMPLATE") &&
      warning.pageKind &&
      !missingKinds.includes(warning.pageKind)
    ) {
      missingKinds.push(warning.pageKind);
    }
  });

  return missingKinds;
}

function collectMissingProperties(warnings: AppWarning[]): MissingPropertyWarning[] {
  return warnings
    .filter(hasMissingProperty)
    .map((warning) => ({
      propertyName: warning.propertyName,
      pageId: warning.pageId,
      source: warning.source,
    }));
}

function hasMissingProperty(warning: AppWarning): warning is AppWarning & { propertyName: string } {
  return warning.code === "MISSING_PROPERTY" && typeof warning.propertyName === "string";
}

function createSummaryText(input: {
  createdCount: number;
  removedCount: number;
  skippedCount: number;
  warningCount: number;
  tocExpandedCount: number;
}): string {
  return [
    "生成完成",
    `创建页面：${String(input.createdCount)}`,
    `覆盖旧 Section：${String(input.removedCount)}`,
    `跳过页面：${String(input.skippedCount)}`,
    `警告：${String(input.warningCount)}`,
    `TOC 扩展：${String(input.tocExpandedCount)}`,
  ].join("\n");
}
