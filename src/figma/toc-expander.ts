import type { AdapterWarning, InstanceNode, OutlineDocument, SceneNode } from "./figma-types";
import {
  isChildrenNode,
  isInstanceNode,
  normalizeComponentPropertyName,
  readComponentProperties,
  readNodeName,
  sortByVisualOrder,
  walkScene,
  warning,
} from "./figma-utils";

export type TocWarning = AdapterWarning;

export type TocExpanderInput = {
  tocNode: SceneNode;
  document: OutlineDocument;
  chapterRanges: Record<number, string>;
};

export type TocExpanderOutput = {
  expandedCount: number;
  writtenCount: number;
  warnings: TocWarning[];
};

type TocRow = {
  chapterIndex: number;
  chapterTitle: string;
  titles: string[];
  numText: string;
  pageRangeText: string;
};

type TocItemRole = "NUM" | "CHAPTER" | "PAGE" | "TITLE";

type FlatTocItem = {
  instance: InstanceNode;
  role: TocItemRole;
  textKeys: string[];
  showKey?: string;
};

export function expandAndInjectToc(input: TocExpanderInput): TocExpanderOutput {
  const warnings: TocWarning[] = [];
  const rows = buildTocRows(input.document, input.chapterRanges);
  const navGroups = collectTocNavGroups(input.tocNode);

  if (navGroups.length === 0) {
    return {
      expandedCount: 0,
      writtenCount: 0,
      warnings: [warning("TOC_NAV_GROUP_MISSING", "TOC 节点中缺少 TOC_NAV_group，无法扩展目录行。", input.tocNode)],
    };
  }

  const expandedCount = ensureRowCapacity(navGroups, rows.length, warnings);
  const availableRows = collectTocNavGroups(input.tocNode);
  let writtenCount = 0;

  for (let index = 0; index < availableRows.length; index += 1) {
    writtenCount +=
      index < rows.length ? injectTocRow(availableRows[index], rows[index], warnings) : hideTocGroup(availableRows[index], warnings);
  }

  return { expandedCount, writtenCount, warnings };
}

function collectTocNavGroups(root: SceneNode): SceneNode[] {
  return sortByVisualOrder(walkScene(root).filter((node) => isTocNavigationGroupName(readNodeName(node))));
}

function isTocNavigationGroupName(name: string): boolean {
  return name === "TOC_NAV_group";
}

export function buildTocRows(document: OutlineDocument, chapterRanges: Record<number, string>): TocRow[] {
  return document.chapters.map((chapter) => ({
    chapterIndex: chapter.index,
    chapterTitle: chapter.title,
    titles: chapter.titles.map((title) => title.title),
    numText: String(chapter.index).padStart(2, "0"),
    pageRangeText: chapterRanges[chapter.index] ?? "",
  }));
}

function ensureRowCapacity(navGroups: SceneNode[], requiredCount: number, warnings: TocWarning[]): number {
  if (requiredCount <= navGroups.length) return 0;
  const source = navGroups[navGroups.length - 1];
  if (typeof source.clone !== "function") {
    warnings.push(warning("TOC_NAV_GROUP_CLONE_FAILED", "TOC_NAV_group 不支持 clone()，无法自动扩展目录。", source));
    return 0;
  }

  const parent = source.parent;
  if (!parent || typeof parent.appendChild !== "function") {
    warnings.push(warning("TOC_NAV_GROUP_PARENT_MISSING", "TOC_NAV_group 缺少可追加子节点的父级，无法自动扩展目录。", source));
    return 0;
  }

  const offset = calculateCloneOffset(navGroups, { x: 0, y: (source.height ?? 24) + 8 });
  let expandedCount = 0;
  let lastRow = source;
  while (navGroups.length < requiredCount) {
    try {
      const clone = source.clone();
      clone.name = readNodeName(source);
      clone.x = source.x ?? 0;
      clone.y = (lastRow.y ?? 0) + offset.y;
      parent.appendChild(clone);
      navGroups.push(clone);
      lastRow = clone;
      expandedCount += 1;
    } catch {
      warnings.push(warning("TOC_NAV_GROUP_CLONE_FAILED", "TOC_NAV_group 复制失败，目录扩展已停止。", source));
      break;
    }
  }
  return expandedCount;
}

function injectTocRow(rowNode: SceneNode, row: TocRow, warnings: TocWarning[]): number {
  let writtenCount = 0;
  const items = collectFlatTocItems(rowNode);
  for (const item of items) {
    if (item.role === "TITLE") continue;
    writtenCount += writeFlatTocItem(item, getTocItemTextValue(item.role, row), true, warnings);
  }

  ensureTitleItemCapacity(items, row.titles.length, warnings);
  const titleItems = collectFlatTocItems(rowNode).filter((item) => item.role === "TITLE");
  for (let index = 0; index < titleItems.length; index += 1) {
    const title = row.titles[index] ?? "";
    writtenCount += writeFlatTocItem(titleItems[index], title, index < row.titles.length, warnings);
  }

  return writtenCount;
}

function collectFlatTocItems(rowNode: SceneNode): FlatTocItem[] {
  const result: FlatTocItem[] = [];
  const instances = sortByVisualOrder(walkScene(rowNode, false).filter((node): node is InstanceNode => isInstanceNode(node)));
  for (const node of instances) {
    if (!isInstanceNode(node)) continue;
    const properties = readComponentProperties(node);
    const propertyNames = Object.keys(properties);
    const role = readTocRoleFromProperties(properties, propertyNames);
    if (!role) continue;
    result.push({
      instance: node,
      role,
      textKeys: propertyNames.filter((name) => isTocTextPropertyForRole(role, name)),
      showKey: propertyNames.find((name) => normalizeTocPropertyName(name) === "SHOW"),
    });
  }
  return result;
}

function ensureTitleItemCapacity(items: FlatTocItem[], requiredCount: number, warnings: TocWarning[]): number {
  const titleItems = items.filter((item) => item.role === "TITLE");
  if (requiredCount <= titleItems.length) return 0;
  if (titleItems.length === 0) {
    if (requiredCount > 0) warnings.push(warning("TOC_TITLE_SLOT_MISSING", "TOC_NAV_group 中缺少 TOC_TITLE_TEXT 标题槽位。"));
    return 0;
  }

  const source = titleItems[titleItems.length - 1].instance;
  const parent = getParent(source);
  if (typeof source.clone !== "function" || !parent || !isChildrenNode(parent)) {
    warnings.push(warning("TOC_TITLE_SLOT_CLONE_FAILED", "TOC_TITLE_TEXT 标题槽位缺少可复制容器，无法自动扩展。", source));
    return 0;
  }

  const offset = calculateCloneOffset(titleItems.map((item) => item.instance), { x: 0, y: (source.height ?? 20) + 4 });
  let expandedCount = 0;
  let lastSlot: SceneNode = source;
  while (titleItems.length + expandedCount < requiredCount) {
    try {
      const clone = source.clone();
      clone.name = readNodeName(source);
      clone.x = (lastSlot.x ?? 0) + offset.x;
      clone.y = (lastSlot.y ?? 0) + offset.y;
      parent.appendChild(clone);
      lastSlot = clone;
      expandedCount += 1;
    } catch {
      warnings.push(warning("TOC_TITLE_SLOT_CLONE_FAILED", "TOC_TITLE_TEXT 标题槽位复制失败，目录标题扩展已停止。", source));
      break;
    }
  }
  return expandedCount;
}

function getParent(node: SceneNode): SceneNode | null {
  return (node as { parent?: SceneNode | null }).parent ?? null;
}

function hideTocGroup(rowNode: SceneNode, warnings: TocWarning[]): number {
  let writtenCount = 0;
  for (const item of collectFlatTocItems(rowNode)) {
    writtenCount += writeFlatTocItem(item, "", false, warnings);
  }
  return writtenCount;
}

function getTocItemTextValue(role: TocItemRole, row: TocRow): string {
  if (role === "NUM") return row.numText;
  if (role === "CHAPTER") return row.chapterTitle;
  if (role === "PAGE") return row.pageRangeText;
  return "";
}

function readTocRoleFromProperties(properties: Record<string, { value?: unknown }>, propertyNames: string[]): TocItemRole | null {
  const typeKey = propertyNames.find((name) => normalizeTocPropertyName(name) === "TYPE");
  const typeValue = typeKey ? properties[typeKey].value : undefined;
  if (typeof typeValue === "string") {
    const role = parseTocRoleValue(typeValue);
    if (role) return role;
  }

  return null;
}

function parseTocRoleValue(value: string): TocItemRole | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === "TOC_NUM") return "NUM";
  if (normalized === "TOC_CHAPTER") return "CHAPTER";
  if (normalized === "TOC_PAGE_RANGE" || normalized === "TOC_PAGE") return "PAGE";
  if (normalized === "TOC_TITLE") return "TITLE";
  return null;
}

function isTocTextPropertyForRole(role: TocItemRole, rawName: string): boolean {
  const name = normalizeTocPropertyName(rawName);
  if (role === "NUM") return name === "TOC_NUM_TEXT";
  if (role === "CHAPTER") return name === "TOC_CHAPTER_TEXT";
  if (role === "PAGE") return name === "TOC_PAGE_RANGE_TEXT" || name === "TOC_PAGE_TEXT";
  return name === "TOC_TITLE_TEXT";
}

function normalizeTocPropertyName(name: string): string {
  const normalized = normalizeComponentPropertyName(name);
  return normalized.split(/[/.]/).pop()?.trim() ?? normalized;
}

function calculateCloneOffset(nodes: SceneNode[], fallback: { x: number; y: number }): { x: number; y: number } {
  if (nodes.length >= 2) {
    const sorted = sortByVisualOrder(nodes);
    const first = sorted[sorted.length - 2];
    const second = sorted[sorted.length - 1];
    const x = (second.x ?? 0) - (first.x ?? 0);
    const y = (second.y ?? 0) - (first.y ?? 0);
    if (x !== 0 || y !== 0) return { x, y };
  }

  return fallback;
}

function writeFlatTocItem(item: FlatTocItem, text: string, visible: boolean, warnings: TocWarning[]): number {
  let writtenCount = 0;
  const textPatch = Object.fromEntries(item.textKeys.map((key) => [key, text])) as Record<string, string>;
  if (item.textKeys.length === 0 && visible) {
    warnings.push(warning("TOC_TEXT_PROPERTY_MISSING", `TOC item 缺少可写文本属性：${readNodeName(item.instance)}`, item.instance));
  }
  writtenCount += writeInstancePatch(item.instance, textPatch, warnings);
  if (item.showKey) writtenCount += writeInstancePatch(item.instance, { [item.showKey]: visible }, warnings);
  return writtenCount;
}

function writeInstancePatch(instance: InstanceNode, patch: Record<string, string | boolean>, warnings: TocWarning[]): number {
  const entries = Object.entries(patch);
  if (entries.length === 0) return 0;

  const cleanPatch = Object.fromEntries(entries) as Record<string, string | boolean>;
  try {
    instance.setProperties?.(cleanPatch);
    return entries.length;
  } catch {
    if (entries.length === 1) {
      const [propertyName, value] = entries[0];
      warnings.push(createTocPropertyWriteWarning(instance, propertyName, value));
      return 0;
    }

    let writtenCount = 0;
    for (const [propertyName, value] of entries) {
      try {
        instance.setProperties?.({ [propertyName]: value });
        writtenCount += 1;
      } catch {
        warnings.push(createTocPropertyWriteWarning(instance, propertyName, value));
      }
    }
    return writtenCount;
  }
}

function createTocPropertyWriteWarning(instance: InstanceNode, propertyName: string, value: string | boolean): TocWarning {
  return warning(
    "TOC_PROPERTY_WRITE_FAILED",
    `TOC 属性写入失败：${normalizeComponentPropertyName(propertyName)}=${String(value)}。请检查组件属性类型或 variant 取值。`,
    instance,
  );
}
