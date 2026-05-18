export type KnownPageKind = "COVER" | "TOC" | "CHAPTER" | "TITLE" | "STEP";
export type PageKind = KnownPageKind | (string & {});

export type WarningSeverity = "info" | "warning" | "error";

export type WarningSource =
  | "parser"
  | "template"
  | "planning"
  | "layout"
  | "generation"
  | "injection"
  | "navigation"
  | "toc"
  | "report";

export type AppWarning = {
  source: WarningSource;
  code: string;
  message: string;
  severity: WarningSeverity;
  line?: number;
  pageKind?: PageKind;
  pageId?: string;
  propertyName?: string;
  details?: Record<string, unknown>;
};

export type ParseWarning = AppWarning & {
  source: "parser";
  line: number;
};

export type TemplateWarning = AppWarning & {
  source: "template";
  pageKind?: PageKind;
};

export type PlanningWarning = AppWarning & {
  source: "planning";
  pageKind?: PageKind;
};

export type LayoutWarning = AppWarning & {
  source: "layout";
  pageId?: string;
};

export type GenerationWarning = AppWarning & {
  source: "generation";
};

export type InjectionWarning = AppWarning & {
  source: "injection";
  propertyName?: string;
};

export type NavigationWarning = AppWarning & {
  source: "navigation";
};

export type TocWarning = AppWarning & {
  source: "toc";
};

export type ChapterNode = {
  id: string;
  index: number;
  title: string;
  titles: TitleNode[];
  sourceLine: number;
};

export type TitleNode = {
  id: string;
  chapterIndex: number;
  index: number;
  title: string;
  steps: StepNode[];
  sourceLine: number;
};

export type StepNode = {
  id: string;
  chapterIndex: number;
  titleIndex: number;
  index: number;
  title: string;
  sourceLine: number;
};

export type OutlineDocument = {
  vision: string | null;
  hasToc: boolean;
  chapters: ChapterNode[];
  warnings: ParseWarning[];
};

export type ParseOutput = {
  document: OutlineDocument;
  warnings: ParseWarning[];
};

export type OutlineSummary = {
  vision: string | null;
  chapterCount: number;
  titleCount: number;
  stepCount: number;
  estimatedPageCount: number;
  requiredPageKinds: PageKind[];
};

export type TemplateInfo = {
  id: string;
  name: string;
  kindGuess: PageKind;
  nodeType: string;
  width: number;
  height: number;
  propertyNames: string[];
  textLayerNames: string[];
};

export type PropertyMapping = Record<string, string | string[] | undefined>;

export type TemplateMappingInput = {
  requiredPageKinds: PageKind[];
  templates: TemplateInfo[];
  selectedTemplateIds: Record<string, string | undefined>;
};

export type TemplateMappingResult = {
  mapping: Record<string, TemplateInfo | null>;
  missingKinds: PageKind[];
  warnings: TemplateWarning[];
};

export type PagePlanItem = {
  id: string;
  kind: PageKind;
  frameName: string;
  pageNumber: number;
  pageNumberText: string;
  chapterIndex?: number;
  titleIndex?: number;
  stepIndex?: number;
  chapterTitle?: string;
  titleText?: string;
  stepText?: string;
  vision: string | null;
  tocRange?: string;
  templateId?: string;
};

export type SkippedPage = {
  id: string;
  kind: PageKind;
  reason: string;
  chapterIndex?: number;
  titleIndex?: number;
  stepIndex?: number;
};

export type PagePlannerInput = {
  document: OutlineDocument;
  templateMapping: Record<string, TemplateInfo | null | undefined>;
};

export type PagePlannerOutput = {
  pages: PagePlanItem[];
  skippedPages: SkippedPage[];
  warnings: PlanningWarning[];
};

export type PaginationOutput = {
  pages: PagePlanItem[];
  chapterRanges: Record<number, string>;
};

export type Size = {
  width: number;
  height: number;
};

export type Placement = {
  x: number;
  y: number;
};

export type LayoutOptions = {
  rowGap?: number;
  stepGap?: number;
  titleGroupGap?: number;
  fallbackSize?: Size;
};

export type LayoutInput = {
  pages: PagePlanItem[];
  templateSizes: Record<string, Size | undefined>;
  options?: LayoutOptions;
};

export type LayoutOutput = {
  placements: Record<string, Placement>;
  warnings: LayoutWarning[];
};

export type ReportBuilderInput = {
  createdSectionId?: string | null;
  createdCount: number;
  removedCount: number;
  skippedPages: SkippedPage[];
  warnings: AppWarning[];
  tocExpandedCount: number;
  selectedNodeIds: string[];
};

export type MissingPropertyWarning = {
  propertyName: string;
  pageId?: string;
  source: WarningSource;
};

export type GenerationReport = {
  createdSectionId: string | null;
  createdCount: number;
  replacedSectionCount: number;
  skippedCount: number;
  warningCount: number;
  warnings: AppWarning[];
  missingTemplates: PageKind[];
  missingProperties: MissingPropertyWarning[];
  parseWarnings: ParseWarning[];
  tocExpandedCount: number;
  selectedNodeIds: string[];
  summaryText: string;
};
