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

type TocTitleTarget = {
  instance: InstanceNode;
  textKey: string;
  showKey?: string;
};

type CloneCandidate = {
  node: SceneNode;
  parent: SceneNode & { appendChild: (node: SceneNode) => void };
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
  for (const node of walkScene(rowNode)) {
    if (!isInstanceNode(node)) continue;
    const properties = readComponentProperties(node, warnings);
    const patch: Record<string, string | boolean> = {};
    const hasRowMetadata = hasAnyProperty(node, ["TOC_CHAPTER_TEXT", "TOC_NUM_TEXT", "TOC_PAGE_RANGE_TEXT"]);
    for (const rawName of Object.keys(properties)) {
      const name = normalizeTocPropertyName(rawName);
      if (name === "TOC_CHAPTER_TEXT") patch[rawName] = row.chapterTitle;
      if (name === "TOC_NUM_TEXT") patch[rawName] = row.numText;
      if (name === "TOC_PAGE_RANGE_TEXT") patch[rawName] = row.pageRangeText;
      if (name === "SHOW" && (hasRowMetadata || !hasProperty(node, "TOC_TITLE_TEXT"))) patch[rawName] = true;
    }
    writtenCount += writeInstancePatch(node, patch, warnings);
  }

  const initialTitleTargets = collectTitleTargets(rowNode);
  ensureTitleTargetCapacity(initialTitleTargets, row.titles.length, warnings);
  const titleTargets = collectTitleTargets(rowNode);
  for (let index = 0; index < titleTargets.length; index += 1) {
    const title = row.titles[index] ?? "";
    writtenCount += writeTitleTarget(titleTargets[index], title, index < row.titles.length, warnings);
  }

  return writtenCount;
}

function collectTitleTargets(rowNode: SceneNode): TocTitleTarget[] {
  const instances = sortByVisualOrder(walkScene(rowNode).filter((node): node is InstanceNode => isInstanceNode(node)));
  const dedicatedInstances = instances.filter(
    (node) => hasProperty(node, "TOC_TITLE_TEXT") && !hasAnyProperty(node, ["TOC_CHAPTER_TEXT", "TOC_NUM_TEXT", "TOC_PAGE_RANGE_TEXT"]),
  );
  const targetInstances = dedicatedInstances.length > 0 ? dedicatedInstances : instances.filter((node) => hasProperty(node, "TOC_TITLE_TEXT"));

  return targetInstances.flatMap((instance) => {
    const properties = readComponentProperties(instance);
    const hasRowMetadata = hasAnyProperty(instance, ["TOC_CHAPTER_TEXT", "TOC_NUM_TEXT", "TOC_PAGE_RANGE_TEXT"]);
    const showKey = hasRowMetadata ? undefined : Object.keys(properties).find((name) => normalizeTocPropertyName(name) === "SHOW");
    return Object.keys(properties)
      .filter((name) => normalizeTocPropertyName(name) === "TOC_TITLE_TEXT")
      .map((textKey) => ({ instance, textKey, showKey }));
  });
}


function ensureTitleTargetCapacity(targets: TocTitleTarget[], requiredCount: number, warnings: TocWarning[]): number {
  if (requiredCount <= targets.length) return 0;
  if (targets.length === 0) {
    if (requiredCount > 0) warnings.push(warning("TOC_TITLE_SLOT_MISSING", "TOC_NAV_group 中缺少 TOC_TITLE_TEXT 标题槽位。"));
    return 0;
  }

  const source = targets[targets.length - 1];
  const candidates = findTitleCloneCandidates(source.instance);
  if (candidates.length === 0) {
    warnings.push(warning("TOC_TITLE_SLOT_CLONE_FAILED", "TOC_TITLE_TEXT 标题槽位缺少可复制容器，无法自动扩展。", source.instance));
    return 0;
  }

  for (const candidate of candidates) {
    const expandedCount = expandTitleTargetsWithCandidate(targets, requiredCount, candidate);
    if (targets.length >= requiredCount) return expandedCount;
  }

  warnings.push(warning("TOC_TITLE_SLOT_CLONE_FAILED", "TOC_TITLE_TEXT 标题槽位复制失败，目录标题扩展已停止。", source.instance));
  return 0;
}

function findTitleCloneCandidates(instance: InstanceNode): CloneCandidate[] {
  const candidates: CloneCandidate[] = [];
  let current: SceneNode | undefined | null = instance;
  while (current) {
    const parent = getParent(current);
    if (typeof current.clone === "function" && parent && isChildrenNode(parent)) {
      candidates.push({ node: current, parent });
    }
    current = parent;
  }
  return candidates;
}

function getParent(node: SceneNode): SceneNode | null {
  return (node as { parent?: SceneNode | null }).parent ?? null;
}

function expandTitleTargetsWithCandidate(targets: TocTitleTarget[], requiredCount: number, candidate: CloneCandidate): number {
  const candidateTargets = targets.map((target) => getCloneCandidateNode(target.instance, candidate.node)).filter((node): node is SceneNode => node !== null);
  const offset = calculateCloneOffset(candidateTargets, { x: (candidate.node.width ?? 80) + 24, y: 0 });
  let expandedCount = 0;
  let lastSlot = candidate.node;
  while (targets.length < requiredCount) {
    try {
      const clone = candidate.node.clone?.();
      if (!clone) throw new Error("clone unavailable");
      clone.name = readNodeName(candidate.node);
      clone.x = (lastSlot.x ?? 0) + offset.x;
      clone.y = (lastSlot.y ?? 0) + offset.y;
      candidate.parent.appendChild(clone);
      targets.push(...collectTitleTargets(clone));
      lastSlot = clone;
      expandedCount += 1;
    } catch {
      return expandedCount;
    }
  }
  return expandedCount;
}

function getCloneCandidateNode(instance: InstanceNode, reference: SceneNode): SceneNode | null {
  let current: SceneNode | undefined | null = instance;
  while (current) {
    if (current.parent === reference.parent && readNodeName(current) === readNodeName(reference)) return current;
    current = current.parent;
  }
  return null;
}

function writeTitleTarget(target: TocTitleTarget, title: string, visible: boolean, warnings: TocWarning[]): number {
  const patch: Record<string, string | boolean> = {};
  patch[target.textKey] = title;
  if (target.showKey) patch[target.showKey] = visible;
  return writeInstancePatch(target.instance, patch, warnings);
}


function hideTocGroup(rowNode: SceneNode, warnings: TocWarning[]): number {
  let writtenCount = 0;
  for (const node of walkScene(rowNode)) {
    if (!isInstanceNode(node)) continue;
    const properties = readComponentProperties(node, warnings);
    const patch: Record<string, string | boolean> = {};
    for (const rawName of Object.keys(properties)) {
      const name = normalizeTocPropertyName(rawName);
      if (name === "SHOW") patch[rawName] = false;
      if (name === "TOC_CHAPTER_TEXT" || name === "TOC_TITLE_TEXT" || name === "TOC_NUM_TEXT" || name === "TOC_PAGE_RANGE_TEXT") {
        patch[rawName] = "";
      }
    }
    writtenCount += writeInstancePatch(node, patch, warnings);
  }
  return writtenCount;
}

function hasProperty(instance: InstanceNode, wantedName: string): boolean {
  return Object.keys(readComponentProperties(instance)).some((name) => normalizeTocPropertyName(name) === wantedName);
}

function hasAnyProperty(instance: InstanceNode, wantedNames: string[]): boolean {
  return wantedNames.some((name) => hasProperty(instance, name));
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

function writeInstancePatch(instance: InstanceNode, patch: Record<string, string | boolean>, warnings: TocWarning[]): number {
  if (Object.keys(patch).length === 0) return 0;
  try {
    instance.setProperties?.(patch);
    return Object.keys(patch).length;
  } catch {
    warnings.push(warning("TOC_ROW_WRITE_FAILED", `TOC 行写入失败：${readNodeName(instance)}`, instance));
    return 0;
  }
}
