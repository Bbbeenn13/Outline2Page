export type PageKind = "COVER" | "TOC" | "CHAPTER" | "TITLE" | "STEP" | (string & {});

export type WarningSeverity = "info" | "warning" | "error";

export type AdapterWarning = {
  code: string;
  message: string;
  nodeId?: string;
  nodeName?: string;
  severity?: WarningSeverity;
};

export type FigmaNodeType =
  | "PAGE"
  | "SECTION"
  | "FRAME"
  | "COMPONENT_SET"
  | "COMPONENT"
  | "INSTANCE"
  | "TEXT"
  | (string & {});

export type FontName = {
  family: string;
  style: string;
};

export type ComponentPropertyType = "TEXT" | "BOOLEAN" | "INSTANCE_SWAP" | "VARIANT" | (string & {});

export type ComponentPropertyValue = {
  type?: ComponentPropertyType;
  value?: unknown;
};

export type FigmaNode = {
  id: string;
  name: string;
  type: FigmaNodeType;
  parent?: ChildrenNode | null;
  removed?: boolean;
  children?: SceneNode[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  clone?: () => SceneNode;
  remove?: () => void;
  getPluginData?: (key: string) => string;
  setPluginData?: (key: string, value: string) => void;
};

export type ChildrenNode = FigmaNode & {
  children: SceneNode[];
  appendChild: (node: SceneNode) => void;
};

export type PageNode = ChildrenNode & {
  type: "PAGE";
  selection?: SceneNode[];
  findAll?: (callback?: (node: SceneNode) => boolean) => SceneNode[];
};

export type SectionNode = ChildrenNode & {
  type: "SECTION";
  resize?: (width: number, height: number) => void;
  resizeWithoutConstraints?: (width: number, height: number) => void;
};

export type ComponentNode = ChildrenNode & {
  type: "COMPONENT";
  createInstance: () => InstanceNode;
  componentPropertyDefinitions?: Record<string, ComponentPropertyValue>;
};

export type ComponentSetNode = ChildrenNode & {
  type: "COMPONENT_SET";
  componentPropertyDefinitions?: Record<string, ComponentPropertyValue>;
};

export type InstanceNode = ChildrenNode & {
  type: "INSTANCE";
  componentProperties?: Record<string, ComponentPropertyValue>;
  setProperties?: (properties: Record<string, string | boolean>) => void;
};

export type TextNode = FigmaNode & {
  type: "TEXT";
  characters: string;
  fontName?: FontName | typeof MIXED;
  getRangeAllFontNames?: (start: number, end: number) => FontName[];
};

export type SceneNode =
  | FigmaNode
  | ChildrenNode
  | PageNode
  | SectionNode
  | ComponentSetNode
  | ComponentNode
  | InstanceNode
  | TextNode;

export type FigmaRuntime = {
  currentPage?: PageNode;
  root?: ChildrenNode & {
    findAll?: (callback?: (node: SceneNode) => boolean) => SceneNode[];
  };
  createSection?: () => SectionNode;
  getNodeById?: (id: string) => FigmaNode | null;
  getNodeByIdAsync?: (id: string) => Promise<FigmaNode | null>;
  loadFontAsync?: (fontName: FontName) => Promise<void>;
  loadAllPagesAsync?: () => Promise<void>;
};

export type TemplateInfo = {
  id: string;
  name: string;
  kindGuess: string;
  nodeType: SceneNode["type"];
  width: number;
  height: number;
  propertyNames: string[];
  textLayerNames: string[];
};

export type ComponentPropertySummary = {
  name: string;
  count: number;
  nodeNames: string[];
  types: string[];
};

export type ComponentPropertyScanOutput = {
  properties: ComponentPropertySummary[];
  warnings: AdapterWarning[];
};

export type PropertyMapping = Record<string, string | string[] | undefined>;

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

export type ParseWarning = {
  code: string;
  message: string;
  line?: number;
};

export type OutlineDocument = {
  vision: string | null;
  hasToc: boolean;
  chapters: ChapterNode[];
  warnings: ParseWarning[];
};

export const MIXED = Symbol("figma.mixed");
