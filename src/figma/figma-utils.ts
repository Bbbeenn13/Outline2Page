import type {
  AdapterWarning,
  ChildrenNode,
  ComponentPropertyValue,
  FigmaRuntime,
  FontName,
  InstanceNode,
  SceneNode,
  TextNode,
} from "./figma-types";

export const TEMPLATE_PREFIXES = ["PAGE_TEMP:", "PAGE_TEMP："] as const;
export const GENERATED_PLUGIN_DATA_KEY = "outline2page.generated";
export const GENERATED_PLUGIN_DATA_VALUE = "true";

export const TARGET_PROPERTY_NAMES = [
  "PAGE_TITLE_TEXT",
  "PAGE_CHAPTER_TEXT",
  "PAGE_STEP_TEXT",
  "PAGE_CHAPTER_TEXT (HUGE)",
  "PAGE_PAGE_TEXT",
  "PAGE_VERSION_TEXT",
  "TOC_TITLE_TEXT",
  "TOC_CHAPTER_TEXT",
  "TOC_NUM_TEXT",
  "TOC_PAGE_RANGE_TEXT",
  "SHOW",
  "HIGHLIGHT",
] as const;

export type TargetPropertyName = (typeof TARGET_PROPERTY_NAMES)[number];

export function resolveFigmaRuntime(runtime?: FigmaRuntime): FigmaRuntime {
  if (runtime) return runtime;
  const candidate = (globalThis as { figma?: FigmaRuntime }).figma;
  if (!candidate) {
    throw new Error("Figma runtime is not available.");
  }
  return candidate;
}

export function getChildren(node: SceneNode): SceneNode[] {
  return Array.isArray((node as ChildrenNode).children) ? (node as ChildrenNode).children : [];
}

export function walkScene(node: SceneNode, includeSelf = true): SceneNode[] {
  const result: SceneNode[] = [];
  const visit = (current: SceneNode): void => {
    result.push(current);
    for (const child of getChildren(current)) visit(child);
  };

  if (includeSelf) {
    visit(node);
    return result;
  }

  for (const child of getChildren(node)) visit(child);
  return result;
}

export function isChildrenNode(node: SceneNode): node is ChildrenNode {
  return Array.isArray((node as ChildrenNode).children) && typeof (node as ChildrenNode).appendChild === "function";
}

export function isInstanceNode(node: SceneNode): node is InstanceNode {
  return node.type === "INSTANCE";
}

export function isTextNode(node: SceneNode): node is TextNode {
  return node.type === "TEXT";
}

export function isTemplateNodeName(name: string): boolean {
  return TEMPLATE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

export function readNodeName(node: SceneNode | null | undefined): string {
  try {
    return node?.name ?? "";
  } catch {
    return "";
  }
}

export function extractTemplateKind(name: string): string {
  const prefix = TEMPLATE_PREFIXES.find((item) => name.startsWith(item));
  if (!prefix) return "";
  const body = name.slice(prefix.length).trim();
  const parts = body
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const kind = parts.length > 0 ? parts[parts.length - 1] : body;
  return kind.split(/\s+/)[0]?.toUpperCase() ?? "";
}

export function normalizeComponentPropertyName(name: string): string {
  return name.replace(/#[^/.]+/g, "").trim();
}

export function isInjectableTextPropertyName(name: string): boolean {
  return normalizeComponentPropertyName(name).includes("_TEXT");
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function hasClone(node: SceneNode): boolean {
  return typeof node.clone === "function";
}

export function canCreateFromTemplate(node: SceneNode): boolean {
  return node.type === "COMPONENT" || hasClone(node);
}

export function sortByVisualOrder<T extends { x?: number; y?: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => {
    const yDiff = (a.y ?? 0) - (b.y ?? 0);
    if (Math.abs(yDiff) > 1) return yDiff;
    return (a.x ?? 0) - (b.x ?? 0);
  });
}

export function getComponentPropertyValueType(property: ComponentPropertyValue | undefined): string | undefined {
  return property && typeof property === "object" ? property.type : undefined;
}

export function isWritableValueForProperty(property: ComponentPropertyValue | undefined, value: string | boolean): boolean {
  const type = getComponentPropertyValueType(property);
  if (!type) return true;
  if (type === "BOOLEAN") return typeof value === "boolean";
  if (type === "TEXT" || type === "VARIANT") return typeof value === "string";
  return typeof value === "string" || typeof value === "boolean";
}

export function readComponentProperties(instance: InstanceNode, warnings?: AdapterWarning[]): Record<string, ComponentPropertyValue> {
  try {
    return instance.componentProperties ?? {};
  } catch {
    warnings?.push(warning("COMPONENT_PROPERTIES_READ_FAILED", `组件属性读取失败，已跳过该实例：${readNodeName(instance)}`, instance));
    return {};
  }
}

export function formatTwoDigit(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "";
  return String(value).padStart(2, "0");
}

export function warning(code: string, message: string, node?: SceneNode, severity: AdapterWarning["severity"] = "warning"): AdapterWarning {
  return {
    code,
    message,
    nodeId: node?.id,
    nodeName: readNodeName(node),
    severity,
  };
}

export function readTextFonts(node: TextNode): FontName[] {
  const length = node.characters.length;
  if (typeof node.getRangeAllFontNames === "function") {
    return uniqueFonts(node.getRangeAllFontNames(0, length));
  }

  if (node.fontName && typeof node.fontName === "object" && "family" in node.fontName && "style" in node.fontName) {
    return [node.fontName];
  }

  return [];
}

function uniqueFonts(fonts: FontName[]): FontName[] {
  const seen = new Set<string>();
  const result: FontName[] = [];
  for (const font of fonts) {
    const key = `${font.family}\u0000${font.style}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(font);
  }
  return result;
}
