/* eslint-disable @typescript-eslint/array-type, @typescript-eslint/no-confusing-void-expression, @typescript-eslint/no-unnecessary-condition, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unnecessary-type-parameters */

export type PageKind = string;

export type AppWarning = {
  code: string;
  message: string;
  line?: number;
  source?: string;
  severity: "warning" | "error";
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

export type PropertyMapping = Record<string, string[]>;

type PropertyField = {
  key: string;
  label: string;
  defaults: string[];
};

export type ComponentPropertySummary = {
  name: string;
  count: number;
  nodeNames: string[];
  types: string[];
};

export type OutlineSummary = {
  vision: string | null;
  chapterCount: number;
  titleCount: number;
  stepCount: number;
  estimatedPageCount: number;
  requiredPageKinds: PageKind[];
};

export type OutlineDocument = {
  vision: string | null;
  hasToc: boolean;
  chapters: Array<{
    id: string;
    index: number;
    title: string;
    sourceLine: number;
    titles: Array<{
      id: string;
      chapterIndex: number;
      index: number;
      title: string;
      sourceLine: number;
      steps: Array<{
        id: string;
        chapterIndex: number;
        titleIndex: number;
        index: number;
        title: string;
        sourceLine: number;
      }>;
    }>;
  }>;
  warnings: AppWarning[];
};

export type GenerationReport = {
  createdSectionId: string | null;
  createdCount: number;
  createdByKind: Record<string, number>;
  replacedSectionCount: number;
  skippedCount: number;
  missingTemplates: PageKind[];
  warningCount: number;
  warnings: AppWarning[];
  tocExpandedCount: number;
  selectedNodeIds: string[];
};

export type UiToPluginMessage =
  | { type: "SCAN_TEMPLATES" }
  | { type: "SCAN_FILE_COMPONENT_PROPERTIES" }
  | { type: "PARSE_OUTLINE"; markdown: string }
  | { type: "RESIZE_UI"; width: number; height: number }
  | {
      type: "GENERATE";
      markdown: string;
      templateMapping: Record<string, string>;
      propertyMapping: PropertyMapping;
    };

export type PluginToUiMessage =
  | { type: "TEMPLATES_SCANNED"; templates: TemplateInfo[]; warnings: AppWarning[] }
  | { type: "FILE_COMPONENT_PROPERTIES_SCANNED"; properties: ComponentPropertySummary[]; warnings: AppWarning[] }
  | { type: "OUTLINE_PARSED"; document: OutlineDocument; summary: OutlineSummary }
  | { type: "GENERATION_DONE"; report: GenerationReport }
  | { type: "ERROR"; message: string; details?: string };

type ControllerOptions = {
  root: Document;
  postMessage: (message: UiToPluginMessage) => void;
  debounceMs?: number;
};

type ControllerState = {
  templates: TemplateInfo[];
  templateWarnings: AppWarning[];
  document: OutlineDocument | null;
  summary: OutlineSummary | null;
  report: GenerationReport | null;
  propertyMappingDrafts: Record<string, string>;
  fileComponentProperties: ComponentPropertySummary[];
  filePropertyWarnings: AppWarning[];
  error: string | null;
  generating: boolean;
};

type Elements = {
  markdown: HTMLTextAreaElement;
  scanButton: HTMLButtonElement;
  generateButton: HTMLButtonElement;
  templateCount: HTMLElement;
  parseStatus: HTMLElement;
  stats: HTMLElement;
  tree: HTMLElement;
  selectors: HTMLElement;
  properties: HTMLElement;
  fileProperties: HTMLElement;
  warnings: HTMLElement;
  report: HTMLElement;
  error: HTMLElement;
  resizeHandle: HTMLElement;
};

const UI_MIN_WIDTH = 380;
const UI_MIN_HEIGHT = 460;
const UI_MAX_WIDTH = 1200;
const UI_MAX_HEIGHT = 1000;

const PROPERTY_FIELDS: PropertyField[] = [
  { key: "vision", label: "封面主题", defaults: ["COVER_VERSION_TEXT", "PAGE_VERSION_TEXT"] },
  {
    key: "chapterTitle",
    label: "章节标题",
    defaults: ["PAGE_CHAPTER_TEXT", "PAGE_CHAPTER_TEXT (HUGE)", "CHAPTER_TITLE_TEXT"],
  },
  { key: "titleText", label: "标题文字", defaults: ["PAGE_TITLE_TEXT", "TITLE_TEXT"] },
  { key: "stepText", label: "小节文字", defaults: ["PAGE_STEP_TEXT", "STEP_TEXT"] },
  { key: "pageNumber", label: "页码", defaults: ["PAGE_PAGE_TEXT", "PAGE_NUMBER_TEXT"] },
  { key: "tocChapter", label: "目录章节", defaults: ["TOC_CHAPTER_TEXT"] },
  { key: "tocNumber", label: "目录编号", defaults: ["TOC_NUM_TEXT", "TOC_NUMBER_TEXT"] },
  { key: "tocPageRange", label: "目录页码范围", defaults: ["TOC_PAGE_RANGE_TEXT"] },
];

export function createOutline2PageUiController(options: ControllerOptions) {
  const state: ControllerState = {
    templates: [],
    templateWarnings: [],
    document: null,
    summary: null,
    report: null,
    propertyMappingDrafts: {},
    fileComponentProperties: [],
    filePropertyWarnings: [],
    error: null,
    generating: false,
  };
  const elements = getElements(options.root);
  let parseTimer: ReturnType<typeof setTimeout> | null = null;

  const send = (message: UiToPluginMessage) => options.postMessage(message);

  const requestParse = () => {
    if (parseTimer) clearTimeout(parseTimer);
    parseTimer = setTimeout(() => {
      const markdown = elements.markdown.value.trim();
      if (!markdown) {
        state.document = null;
        state.summary = null;
        state.report = null;
        render(state, elements);
        return;
      }
      send({ type: "PARSE_OUTLINE", markdown });
    }, options.debounceMs ?? 180);
  };

  elements.markdown.addEventListener("input", requestParse);
  elements.scanButton.addEventListener("click", () => send({ type: "SCAN_TEMPLATES" }));
  installResizeHandle(options.root, elements.resizeHandle, send);
  elements.properties.addEventListener("input", (event) => {
    const target = event.target;
    if (!isPropertyMappingInput(target)) return;
    state.propertyMappingDrafts[target.dataset.field] = target.value;
  });
  elements.fileProperties.addEventListener("click", (event) => {
    const target = event.target;
    if (hasDatasetAction(target, "scan-file-properties")) {
      send({ type: "SCAN_FILE_COMPONENT_PROPERTIES" });
    }
  });
  elements.generateButton.addEventListener("click", () => {
    if (!state.summary) return;
    syncPropertyMappingDrafts(elements.properties, state.propertyMappingDrafts);
    const templateMapping = collectTemplateMapping(elements.selectors, state.summary.requiredPageKinds);
    const propertyMapping = collectPropertyMapping(elements.properties);
    state.generating = true;
    state.report = null;
    state.error = null;
    render(state, elements);
    send({
      type: "GENERATE",
      markdown: elements.markdown.value,
      templateMapping,
      propertyMapping,
    });
  });

  const receive = (message: PluginToUiMessage) => {
    if (message.type === "TEMPLATES_SCANNED") {
      state.templates = message.templates;
      state.templateWarnings = message.warnings;
      state.error = null;
      render(state, elements);
      return;
    }

    if (message.type === "FILE_COMPONENT_PROPERTIES_SCANNED") {
      state.fileComponentProperties = message.properties;
      state.filePropertyWarnings = message.warnings;
      state.error = null;
      render(state, elements);
      return;
    }

    if (message.type === "OUTLINE_PARSED") {
      state.document = message.document;
      state.summary = message.summary;
      state.error = null;
      render(state, elements);
      return;
    }

    if (message.type === "GENERATION_DONE") {
      state.report = message.report;
      state.generating = false;
      state.error = null;
      render(state, elements);
      return;
    }

    state.error = message.details ? `${message.message}\n${message.details}` : message.message;
    state.generating = false;
    render(state, elements);
  };

  send({ type: "SCAN_TEMPLATES" });
  render(state, elements);

  return {
    receive,
    getState: () => ({ ...state }),
    requestParse,
  };
}

export function collectTemplateMapping(root: HTMLElement, requiredKinds: PageKind[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  requiredKinds.forEach((kind) => {
    const select = root.querySelector<HTMLSelectElement>(`select[data-kind="${cssEscape(kind)}"]`);
    if (select?.value) mapping[kind] = select.value;
  });
  return mapping;
}

export function collectPropertyMapping(root: HTMLElement): PropertyMapping {
  const mapping: PropertyMapping = {};
  PROPERTY_FIELDS.forEach((field) => {
    const input = root.querySelector<HTMLInputElement>(`input[data-field="${cssEscape(field.key)}"]`);
    const values = parsePropertyTargets(input?.value ?? "");
    if (values.length > 0) mapping[field.key] = values;
  });
  return mapping;
}

export function chooseDefaultTemplate(kind: PageKind, templates: TemplateInfo[]): string {
  return templates.find((template) => template.kindGuess === kind)?.id ?? templates[0]?.id ?? "";
}

function chooseDefaultProperties(field: PropertyField, options: string[]): string[] {
  return field.defaults.filter((name) => options.includes(name));
}

function getElements(root: Document): Elements {
  return {
    markdown: mustFind<HTMLTextAreaElement>(root, "#markdown"),
    scanButton: mustFind<HTMLButtonElement>(root, "#scanButton"),
    generateButton: mustFind<HTMLButtonElement>(root, "#generateButton"),
    templateCount: mustFind(root, "#templateCount"),
    parseStatus: mustFind(root, "#parseStatus"),
    stats: mustFind(root, "#stats"),
    tree: mustFind(root, "#tree"),
    selectors: mustFind(root, "#selectors"),
    properties: mustFind(root, "#properties"),
    fileProperties: mustFind(root, "#fileProperties"),
    warnings: mustFind(root, "#warnings"),
    report: mustFind(root, "#report"),
    error: mustFind(root, "#error"),
    resizeHandle: mustFind(root, "#resizeHandle"),
  };
}

function installResizeHandle(root: Document, handle: HTMLElement, send: (message: UiToPluginMessage) => void): void {
  let startX = 0;
  let startY = 0;
  let startWidth = UI_MIN_WIDTH;
  let startHeight = UI_MIN_HEIGHT;
  let dragging = false;

  const getWindow = () => root.defaultView ?? window;

  const move = (event: MouseEvent): void => {
    if (!dragging) return;
    event.preventDefault();
    send({
      type: "RESIZE_UI",
      width: clampNumber(startWidth + event.clientX - startX, UI_MIN_WIDTH, UI_MAX_WIDTH),
      height: clampNumber(startHeight + event.clientY - startY, UI_MIN_HEIGHT, UI_MAX_HEIGHT),
    });
  };

  const stop = (): void => {
    dragging = false;
    getWindow().removeEventListener("mousemove", move);
    getWindow().removeEventListener("mouseup", stop);
  };

  handle.addEventListener("mousedown", (event) => {
    event.preventDefault();
    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    startWidth = getWindow().innerWidth || UI_MIN_WIDTH;
    startHeight = getWindow().innerHeight || UI_MIN_HEIGHT;
    getWindow().addEventListener("mousemove", move);
    getWindow().addEventListener("mouseup", stop);
  });
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function render(state: ControllerState, elements: Elements): void {
  elements.templateCount.textContent = `${state.templates.length} 个模板`;
  elements.parseStatus.textContent = state.summary ? `${state.summary.estimatedPageCount} 页待生成` : "等待 Markdown";
  elements.generateButton.disabled = state.generating || !state.summary;
  elements.generateButton.textContent = state.generating ? "生成中..." : "生成";
  elements.error.hidden = !state.error;
  elements.error.textContent = state.error ?? "";

  renderStats(elements.stats, state.summary);
  renderTree(elements.tree, state.document);
  renderTemplateSelectors(elements.selectors, state.summary, state.templates);
  renderProperties(elements.properties, state.templates, state.propertyMappingDrafts);
  renderFileProperties(elements.fileProperties, state.fileComponentProperties);
  renderWarnings(elements.warnings, [
    ...state.templateWarnings,
    ...state.filePropertyWarnings,
    ...(state.document?.warnings ?? []),
    ...(state.report?.warnings ?? []),
  ]);
  renderReport(elements.report, state.report);
}

function renderFileProperties(root: HTMLElement, properties: ComponentPropertySummary[]): void {
  const button = `<button type="button" data-action="scan-file-properties">扫描文件属性</button>`;
  if (properties.length === 0) {
    root.innerHTML = `${button}<div class="empty">点击后扫描当前文件全部组件属性</div>`;
    return;
  }

  root.innerHTML = `${button}<div class="property-table">${properties
    .map(
      (property) => `<div class="property-row">
        <code>${escapeHtml(property.name)}</code>
        <span>${String(property.count)} 处</span>
        <small>${escapeHtml(property.types.join(" / ") || "UNKNOWN")}</small>
      </div>`,
    )
    .join("")}</div>`;
}

function renderStats(root: HTMLElement, summary: OutlineSummary | null): void {
  if (!summary) {
    root.innerHTML = `<div class="empty">粘贴 Markdown 后显示解析统计</div>`;
    return;
  }

  root.innerHTML = [
    statItem("主题", summary.vision ?? "未设置"),
    statItem("章节", String(summary.chapterCount)),
    statItem("标题", String(summary.titleCount)),
    statItem("小节", String(summary.stepCount)),
    statItem("预计页数", String(summary.estimatedPageCount)),
  ].join("");
}

function renderTree(root: HTMLElement, document: OutlineDocument | null): void {
  if (!document || document.chapters.length === 0) {
    root.innerHTML = `<div class="empty">暂无结构树</div>`;
    return;
  }

  root.innerHTML = document.chapters
    .map((chapter) => {
      const titles = chapter.titles
        .map((title) => {
          const steps = title.steps
            .map((step) => `<li><span>STEP ${formatNumber(step.index)}</span>${escapeHtml(step.title)}</li>`)
            .join("");
          return `<li><span>TITLE ${formatNumber(title.index)}</span>${escapeHtml(title.title)}${
            steps ? `<ul>${steps}</ul>` : ""
          }</li>`;
        })
        .join("");
      return `<ul><li><span>CHAPTER ${formatNumber(chapter.index)}</span>${escapeHtml(chapter.title)}${
        titles ? `<ul>${titles}</ul>` : ""
      }</li></ul>`;
    })
    .join("");
}

function renderTemplateSelectors(root: HTMLElement, summary: OutlineSummary | null, templates: TemplateInfo[]): void {
  if (!summary || summary.requiredPageKinds.length === 0) {
    root.innerHTML = `<div class="empty">解析后显示模板选择</div>`;
    return;
  }

  root.innerHTML = summary.requiredPageKinds
    .map((kind) => {
      const defaultId = chooseDefaultTemplate(kind, templates);
      const options = templates
        .map((template) => {
          const selected = template.id === defaultId ? " selected" : "";
          return `<option value="${escapeAttr(template.id)}"${selected}>${escapeHtml(template.name)}</option>`;
        })
        .join("");

      return `<label class="selector-row">
        <span>${escapeHtml(kind)}</span>
        <select data-kind="${escapeAttr(kind)}">
          ${templates.length ? options : `<option value="">没有可用模板</option>`}
        </select>
      </label>`;
    })
    .join("");
}

function renderProperties(root: HTMLElement, templates: TemplateInfo[], drafts: Record<string, string>): void {
  const propertyNames = uniqueStrings(templates.flatMap((template) => template.propertyNames));
  const options = propertyNames;

  if (options.length === 0) {
    root.innerHTML = `<div class="empty">扫描模板后显示字段映射</div>`;
    return;
  }

  root.innerHTML = [
    `<div class="mapping-grid">${PROPERTY_FIELDS.map((field) => propertyMappingRow(field, options, drafts)).join("")}</div>`,
    groupedChipGroups(options),
  ].join("");
}

function propertyMappingRow(field: PropertyField, options: string[], drafts: Record<string, string>): string {
  const value = Object.prototype.hasOwnProperty.call(drafts, field.key) ? (drafts[field.key] ?? "") : chooseDefaultProperties(field, options).join(" + ");

  return `<label class="mapping-row">
    <span>${escapeHtml(field.label)}</span>
    <input class="mapping-input" type="text" data-field="${escapeAttr(field.key)}" value="${escapeAttr(value)}" />
  </label>`;
}

function parsePropertyTargets(value: string): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value.split(/\s*\+\s*|\r?\n|[,，]/)) {
    const target = item.trim();
    if (!target || seen.has(target)) continue;
    seen.add(target);
    result.push(target);
  }
  return result;
}

function syncPropertyMappingDrafts(root: HTMLElement, drafts: Record<string, string>): void {
  PROPERTY_FIELDS.forEach((field) => {
    const input = root.querySelector<HTMLInputElement>(`input[data-field="${cssEscape(field.key)}"]`);
    if (input) drafts[field.key] = input.value;
  });
}

function renderWarnings(root: HTMLElement, warnings: AppWarning[]): void {
  const uniqueWarnings = uniqueBy(warnings, (warning) => `${warning.code}-${warning.line ?? ""}-${warning.message}`);
  if (uniqueWarnings.length === 0) {
    root.innerHTML = `<div class="ok">暂无警告</div>`;
    return;
  }

  root.innerHTML = uniqueWarnings
    .map((warning) => {
      const line = warning.line ? `第 ${warning.line} 行 · ` : "";
      return `<div class="warning"><strong>${escapeHtml(warning.code)}</strong><span>${line}${escapeHtml(
        warning.message,
      )}</span></div>`;
    })
    .join("");
}

function renderReport(root: HTMLElement, report: GenerationReport | null): void {
  if (!report) {
    root.innerHTML = `<div class="empty">生成后显示报告</div>`;
    return;
  }

  const byKind = ["COVER", "TOC", "CHAPTER", "TITLE", "STEP"]
    .map((kind) => statItem(kind, String(report.createdByKind[kind] ?? 0)))
    .join("");

  root.innerHTML = `<div class="report-grid">
    ${statItem("生成", String(report.createdCount))}
    ${statItem("覆盖 Section", String(report.replacedSectionCount))}
    ${statItem("跳过", String(report.skippedCount))}
    ${statItem("警告", String(report.warningCount))}
    ${statItem("TOC 扩展", String(report.tocExpandedCount))}
    ${byKind}
  </div>`;
}

function statItem(label: string, value: string): string {
  return `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function chipGroup(label: string, values: string[]): string {
  if (values.length === 0) return "";
  return `<div class="chip-group"><span>${escapeHtml(label)}</span><div class="chip-list">${values
    .map((value) => `<code>${escapeHtml(value)}</code>`)
    .join("")}</div></div>`;
}

function groupedChipGroups(values: string[]): string {
  const groups = [
    { label: "COVER_", values: values.filter((value) => value.startsWith("COVER_")) },
    { label: "TOC_", values: values.filter((value) => value.startsWith("TOC_")) },
    { label: "PAGE_", values: values.filter((value) => value.startsWith("PAGE_")) },
    {
      label: "其他",
      values: values.filter((value) => !value.startsWith("COVER_") && !value.startsWith("PAGE_") && !value.startsWith("TOC_")),
    },
  ];
  return groups.map((group) => chipGroup(group.label, group.values)).join("");
}

function mustFind<T extends HTMLElement>(root: Document, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`缺少 UI 节点：${selector}`);
  return element;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function uniqueBy<T>(values: T[], getKey: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = getKey(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatNumber(value: number): string {
  return value.toString().padStart(2, "0");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(value);
  return value.replace(/["\\]/g, "\\$&");
}

function hasDatasetAction(target: EventTarget | null, action: string): boolean {
  if (!target || typeof target !== "object" || !("dataset" in target)) return false;
  const dataset = (target as { dataset?: { action?: string } }).dataset;
  return dataset?.action === action;
}

function isPropertyMappingInput(target: EventTarget | null): target is HTMLInputElement & { dataset: { field: string } } {
  if (!target || typeof target !== "object" || !("dataset" in target) || !("value" in target)) return false;
  const dataset = (target as { dataset?: { field?: string } }).dataset;
  return typeof dataset?.field === "string" && dataset.field.length > 0;
}
