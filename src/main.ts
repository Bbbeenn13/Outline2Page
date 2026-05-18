import {
  analyzeOutline,
  applyPagination,
  buildGenerationReport,
  calculateLayout,
  createFrameName,
  createPagePlan,
  mapTemplates,
  parseOutline,
} from "./core";
import {
  DEFAULT_GENERATED_SECTION_NAME,
  createNodeFromTemplate,
  expandAndInjectToc,
  fitSectionToNodes,
  injectNavigation,
  injectProperties,
  prepareGeneratedSection,
  scanTemplates,
  scanFileComponentProperties,
  selectGeneratedSection,
  type AdapterWarning,
  type FigmaRuntime,
  type PageNode as AdapterPageNode,
  type SceneNode as AdapterSceneNode,
  type SectionNode as AdapterSectionNode,
} from "./figma";
import type {
  AppWarning,
  GenerationReport,
  OutlineDocument,
  OutlineSummary,
  PageKind,
  PagePlanItem,
  PropertyMapping,
  TemplateInfo,
  WarningSource,
} from "./types";
import type { ComponentPropertySummary } from "./figma";

type UiToPluginMessage =
  | { type: "SCAN_TEMPLATES" }
  | { type: "SCAN_FILE_COMPONENT_PROPERTIES" }
  | { type: "PARSE_OUTLINE"; markdown: string }
  | { type: "RESIZE_UI"; width: number; height: number }
  | { type: "GENERATE"; markdown: string; templateMapping: Record<string, string>; propertyMapping?: PropertyMapping };

type UiGenerationReport = GenerationReport & {
  createdByKind: Record<string, number>;
};

type PluginToUiMessage =
  | { type: "TEMPLATES_SCANNED"; templates: TemplateInfo[]; warnings: AppWarning[] }
  | { type: "FILE_COMPONENT_PROPERTIES_SCANNED"; properties: ComponentPropertySummary[]; warnings: AppWarning[] }
  | { type: "OUTLINE_PARSED"; document: OutlineDocument; summary: OutlineSummary }
  | { type: "GENERATION_DONE"; report: UiGenerationReport }
  | { type: "ERROR"; message: string; details?: string };

figma.showUI(__html__, { width: 520, height: 700, themeColors: true });

figma.ui.onmessage = (message: UiToPluginMessage): void => {
  void handleUiMessage(message);
};

async function handleUiMessage(message: UiToPluginMessage): Promise<void> {
  try {
    if (message.type === "RESIZE_UI") {
      figma.ui.resize(clampUiSize(message.width, 380, 1200), clampUiSize(message.height, 460, 1000));
      return;
    }

    if (message.type === "SCAN_TEMPLATES") {
      const result = await scanCurrentPageTemplates();
      postToUi({ type: "TEMPLATES_SCANNED", templates: result.templates, warnings: result.warnings });
      return;
    }

    if (message.type === "SCAN_FILE_COMPONENT_PROPERTIES") {
      const result = await scanCurrentFileComponentProperties();
      postToUi({ type: "FILE_COMPONENT_PROPERTIES_SCANNED", properties: result.properties, warnings: result.warnings });
      return;
    }

    if (message.type === "PARSE_OUTLINE") {
      const parsed = parseOutline(message.markdown);
      postToUi({
        type: "OUTLINE_PARSED",
        document: parsed.document,
        summary: analyzeOutline(parsed.document),
      });
      return;
    }

    const report = await generateFromOutline(message.markdown, message.templateMapping, message.propertyMapping);
    postToUi({ type: "GENERATION_DONE", report });
  } catch (error) {
    postToUi({
      type: "ERROR",
      message: error instanceof Error ? error.message : "插件执行失败",
      details: error instanceof Error ? error.stack : String(error),
    });
  }
}

function postToUi(message: PluginToUiMessage): void {
  figma.ui.postMessage(message);
}

function clampUiSize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

async function scanCurrentPageTemplates(): Promise<{ templates: TemplateInfo[]; warnings: AppWarning[] }> {
  await loadCurrentPageIfNeeded();
  const result = scanTemplates({ currentPage: getCurrentPage() });
  return {
    templates: result.templates,
    warnings: result.warnings.map((item) => toAppWarning("template", item)),
  };
}

async function scanCurrentFileComponentProperties(): Promise<{
  properties: ComponentPropertySummary[];
  warnings: AppWarning[];
}> {
  const result = await scanFileComponentProperties(createRuntime(getCurrentPage()));
  return {
    properties: result.properties,
    warnings: result.warnings.map((item) => toAppWarning("template", item)),
  };
}

async function generateFromOutline(
  markdown: string,
  selectedTemplateIds: Record<string, string>,
  propertyMapping?: PropertyMapping,
): Promise<UiGenerationReport> {
  await loadCurrentPageIfNeeded();

  const parsed = parseOutline(markdown);
  const summary = analyzeOutline(parsed.document);
  const scan = await scanCurrentPageTemplates();
  const templateMapping = mapTemplates({
    requiredPageKinds: summary.requiredPageKinds,
    templates: scan.templates,
    selectedTemplateIds: withKindDefaults(summary.requiredPageKinds, scan.templates, selectedTemplateIds),
  });
  const plan = createPagePlan({
    document: parsed.document,
    templateMapping: templateMapping.mapping,
  });
  const pagination = applyPagination(plan.pages);
  const pages: PagePlanItem[] = pagination.pages.map((page) => Object.assign({}, page, { frameName: createFrameName(page) }));
  const layout = calculateLayout({
    pages,
    templateSizes: Object.fromEntries(scan.templates.map((template) => [template.id, template])),
  });

  const warnings: AppWarning[] = [];
  pushAll(warnings, parsed.warnings);
  pushAll(warnings, scan.warnings);
  pushAll(warnings, templateMapping.warnings);
  pushAll(warnings, plan.warnings);
  pushAll(warnings, layout.warnings);

  if (pages.length === 0) {
    return withCreatedByKind(
      buildGenerationReport({
        createdSectionId: null,
        createdCount: 0,
        removedCount: 0,
        skippedPages: plan.skippedPages,
        warnings,
        tocExpandedCount: 0,
        selectedNodeIds: [],
      }),
      [],
    );
  }

  const currentPage = getCurrentPage();
  const runtime = createRuntime(currentPage);
  const sectionResult = prepareGeneratedSection({
    currentPage,
    sectionName: DEFAULT_GENERATED_SECTION_NAME,
    figma: runtime,
  });
  pushAll(warnings, sectionResult.warnings.map((item) => toAppWarning("generation", item)));

  const createdPages: PagePlanItem[] = [];
  const createdNodes: AdapterSceneNode[] = [];
  let tocExpandedCount = 0;

  for (const page of pages) {
    const template = templateMapping.mapping[page.kind];
    if (!template) continue;

    const templateNode = runtime.getNodeById?.(template.id) as AdapterSceneNode | null;
    const placement = layout.placements[page.id] ?? { x: 0, y: 0 };
    const nodeResult = createNodeFromTemplate({
      page,
      template,
      section: sectionResult.section,
      placement,
      templateNode: templateNode ?? undefined,
      figma: runtime,
    });
    pushAll(warnings, nodeResult.warnings.map((item) => toAppWarning("generation", item, page)));
    if (!nodeResult.node) continue;

    createdPages.push(page);
    createdNodes.push(nodeResult.node);

    const injection = await injectProperties({
      node: nodeResult.node,
      page,
      chapterRanges: pagination.chapterRanges,
      propertyMapping,
      figma: runtime,
    });
    pushAll(warnings, injection.warnings.map((item) => toAppWarning("injection", item, page)));
    pushAll(
      warnings,
      injection.missingProperties.map((propertyName) => ({
        source: "injection" as const,
        code: "MISSING_PROPERTY",
        message: `${page.frameName} 缺少可注入属性：${propertyName}`,
        severity: "info" as const,
        pageKind: page.kind,
        pageId: page.id,
        propertyName,
      })),
    );

    const navigation = injectNavigation({ node: nodeResult.node, page, document: parsed.document });
    pushAll(warnings, navigation.warnings.map((item) => toAppWarning("navigation", item, page)));

    if (page.kind === "TOC") {
      const toc = expandAndInjectToc({
        tocNode: nodeResult.node,
        document: parsed.document,
        chapterRanges: pagination.chapterRanges,
      });
      tocExpandedCount += toc.expandedCount;
      pushAll(warnings, toc.warnings.map((item) => toAppWarning("toc", item, page)));
    }
  }

  pushAll(warnings, fitSectionToNodes(sectionResult.section, createdNodes).map((item) => toAppWarning("generation", item)));
  selectGeneratedSection(sectionResult.section, currentPage);
  scrollToGeneratedSection(sectionResult.section);

  return withCreatedByKind(
    buildGenerationReport({
      createdSectionId: sectionResult.section.id,
      createdCount: createdNodes.length,
      removedCount: sectionResult.removedCount,
      skippedPages: plan.skippedPages.concat(
        pages
          .filter((page) => !createdPages.includes(page))
          .map((page: PagePlanItem) => ({
            id: page.id,
            kind: page.kind,
            reason: "generation-failed",
            chapterIndex: page.chapterIndex,
            titleIndex: page.titleIndex,
            stepIndex: page.stepIndex,
          })),
      ),
      warnings,
      tocExpandedCount,
      selectedNodeIds: [sectionResult.section.id],
    }),
    createdPages,
  );
}

function withKindDefaults(
  requiredKinds: PageKind[],
  templates: TemplateInfo[],
  selectedTemplateIds: Record<string, string>,
): Record<string, string | undefined> {
  const mapping: Record<string, string | undefined> = Object.assign({}, selectedTemplateIds);
  for (const kind of requiredKinds) {
    mapping[kind] = mapping[kind] ?? templates.find((template) => template.kindGuess === kind)?.id;
  }
  return mapping;
}

function withCreatedByKind(report: GenerationReport, pages: PagePlanItem[]): UiGenerationReport {
  return Object.assign({}, report, {
    createdByKind: pages.reduce<Record<string, number>>((counts, page) => {
      counts[page.kind] = (counts[page.kind] ?? 0) + 1;
      return counts;
    }, {}),
  });
}

function toAppWarning(source: WarningSource, warning: AdapterWarning, page?: PagePlanItem): AppWarning {
  return {
    source,
    code: warning.code,
    message: warning.message,
    severity: warning.severity ?? "warning",
    pageKind: page?.kind,
    pageId: page?.id,
    details: {
      nodeId: warning.nodeId,
      nodeName: warning.nodeName,
    },
  };
}

function getCurrentPage(): AdapterPageNode {
  return figma.currentPage as unknown as AdapterPageNode;
}

function createRuntime(currentPage: AdapterPageNode): FigmaRuntime {
  return {
    currentPage,
    root: figma.root as unknown as FigmaRuntime["root"],
    createSection: () => figma.createSection() as unknown as AdapterSectionNode,
    getNodeById: (id: string) => findNodeById(currentPage, id),
    loadFontAsync: (fontName) => figma.loadFontAsync(fontName),
    loadAllPagesAsync: () => figma.loadAllPagesAsync(),
  };
}

function findNodeById(currentPage: AdapterPageNode, id: string): AdapterSceneNode | null {
  return currentPage.findAll?.((node) => node.id === id)[0] ?? null;
}

function pushAll<T>(target: T[], source: readonly T[]): void {
  for (const item of source) target.push(item);
}

async function loadCurrentPageIfNeeded(): Promise<void> {
  const maybeLoadablePage = figma.currentPage as PageNode & { loadAsync?: () => Promise<void> };
  if (typeof maybeLoadablePage.loadAsync === "function") {
    await maybeLoadablePage.loadAsync();
  }
}

function scrollToGeneratedSection(section: AdapterSectionNode): void {
  const node = section as unknown as SceneNode;
  figma.viewport.scrollAndZoomIntoView([node]);
}
