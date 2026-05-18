import type { AdapterWarning, ChapterNode, InstanceNode, OutlineDocument, PagePlanItem, SceneNode, StepNode, TitleNode } from "./figma-types";
import {
  formatTwoDigit,
  isInstanceNode,
  normalizeComponentPropertyName,
  readComponentProperties,
  readNodeName,
  sortByVisualOrder,
  walkScene,
  warning,
} from "./figma-utils";

export type NavigationWarning = AdapterWarning;

export type NavigationInjectorInput = {
  node: SceneNode;
  page: PagePlanItem;
  document: OutlineDocument;
};

export type NavigationInjectorOutput = {
  showWrittenCount: number;
  highlightWrittenCount: number;
  textWrittenCount: number;
  warnings: NavigationWarning[];
};

type NavKind = "CHAPTER" | "TITLE" | "STEP";

type NavWriteTarget = {
  instance: InstanceNode;
  propertyNames?: string[];
};

type NavItem = {
  node: SceneNode;
  writeTargets: NavWriteTarget[];
  kind: NavKind;
  kindCount: number;
  logicalIndex: number;
};

type FrameNavigationContext = {
  kind: NavKind | null;
};

export function injectNavigation(input: NavigationInjectorInput): NavigationInjectorOutput {
  const warnings: NavigationWarning[] = [];
  const navItems = collectNavigationItems(input.node);
  assignLogicalIndexes(navItems);
  warnForMissingNavigationGroups(navItems, input.page, input.document, warnings, input.node);
  const frameContext = resolveFrameNavigationContext(input.node, input.page);

  let showWrittenCount = 0;
  let highlightWrittenCount = 0;
  let textWrittenCount = 0;

  for (const item of navItems) {
    const state = resolveNavigationState(item, input.page, input.document, frameContext);
    const writeResult = writeNavigationItem(item, state, warnings);
    showWrittenCount += writeResult.showWrittenCount;
    highlightWrittenCount += writeResult.highlightWrittenCount;
    textWrittenCount += writeResult.textWrittenCount;
  }

  return { showWrittenCount, highlightWrittenCount, textWrittenCount, warnings };
}

function writeNavigationItem(
  item: NavItem,
  state: { show: boolean; highlight: boolean; label: string },
  warnings: NavigationWarning[],
): { showWrittenCount: number; highlightWrittenCount: number; textWrittenCount: number } {
  let showWrittenCount = 0;
  let highlightWrittenCount = 0;
  let textWrittenCount = 0;
  let hasShowTarget = false;
  let hasHighlightTarget = false;

  for (const target of item.writeTargets) {
    const instance = target.instance;
    const properties = readComponentProperties(instance, warnings);
    const propertyNames = target.propertyNames ?? Object.keys(properties);
    const showKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "SHOW");
    const highlightKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "HIGHLIGHT");
    const textPatch = buildNavigationTextPatch(item, state.label, propertyNames);

    const textWrittenKeys = writePropertiesSafe(instance, textPatch, warnings);
    textWrittenCount += textWrittenKeys.length;

    if (showKey) {
      hasShowTarget = true;
      const showWrittenKeys = writePropertiesSafe(instance, { [showKey]: state.show }, warnings);
      showWrittenCount += showWrittenKeys.length;
    }

    if (highlightKey) {
      hasHighlightTarget = true;
      const highlightValue = resolveHighlightValue(properties[highlightKey].value, state.highlight);
      const highlightWrittenKeys = writePropertiesSafe(instance, { [highlightKey]: highlightValue }, warnings);
      highlightWrittenCount += highlightWrittenKeys.length;
    }
  }

  if (!hasShowTarget) warnings.push(warning("NAV_SHOW_MISSING", `Navigation item is missing SHOW: ${readNodeName(item.node)}`, item.node));
  if (!hasHighlightTarget) {
    warnings.push(warning("NAV_HIGHLIGHT_MISSING", `Navigation item is missing HIGHLIGHT: ${readNodeName(item.node)}`, item.node));
  }

  return { showWrittenCount, highlightWrittenCount, textWrittenCount };
}

function resolveHighlightValue(currentValue: unknown, active: boolean): string {
  if (typeof currentValue !== "string") return active ? "on" : "off";

  const normalized = currentValue.trim().toLowerCase();
  if (normalized === "on" || normalized === "off") return active ? preserveVariantCase(currentValue, "on") : preserveVariantCase(currentValue, "off");
  if (normalized === "true" || normalized === "false") {
    return active ? preserveVariantCase(currentValue, "true") : preserveVariantCase(currentValue, "false");
  }
  if (normalized === "yes" || normalized === "no") return active ? preserveVariantCase(currentValue, "yes") : preserveVariantCase(currentValue, "no");
  if (normalized === "active" || normalized === "inactive") {
    return active ? preserveVariantCase(currentValue, "active") : preserveVariantCase(currentValue, "inactive");
  }
  if (normalized === "selected" || normalized === "default") {
    return active ? preserveVariantCase(currentValue, "selected") : preserveVariantCase(currentValue, "default");
  }

  return active ? "on" : currentValue;
}

function preserveVariantCase(reference: string, value: string): string {
  if (reference === reference.toUpperCase()) return value.toUpperCase();
  if (/^[A-Z]/.test(reference)) return value.charAt(0).toUpperCase() + value.slice(1);
  return value;
}

function writePropertiesSafe(instance: InstanceNode, patch: Record<string, string | boolean>, warnings: NavigationWarning[]): string[] {
  const entries = Object.entries(patch);
  if (entries.length === 0) return [];

  const cleanPatch = Object.fromEntries(entries) as Record<string, string | boolean>;
  try {
    instance.setProperties?.(cleanPatch);
    return Object.keys(cleanPatch);
  } catch {
    if (entries.length === 1) {
      const [propertyName, value] = entries[0];
      warnings.push(
        warning(
          "NAV_PROPERTY_WRITE_FAILED",
          `导航属性写入失败：${normalizeComponentPropertyName(propertyName)}=${String(value)}。请检查组件 variant 是否存在该取值组合。`,
          instance,
        ),
      );
      return [];
    }

    const written: string[] = [];
    for (const [propertyName, value] of entries) {
      try {
        instance.setProperties?.({ [propertyName]: value });
        written.push(propertyName);
      } catch {
        warnings.push(
          warning(
            "NAV_PROPERTY_WRITE_FAILED",
            `导航属性写入失败：${normalizeComponentPropertyName(propertyName)}=${String(value)}。请检查组件 variant 是否存在该取值组合。`,
            instance,
          ),
        );
      }
    }
    return written;
  }
}

function collectNavigationItems(root: SceneNode): NavItem[] {
  const items: NavItem[] = [];
  for (const node of walkScene(root)) {
    if (!isPageNavigationGroupName(readNodeName(node))) continue;
    if (hasPageNavigationGroupAncestor(node)) continue;
    items.push(...collectNavigationItemsFromGroup(node));
  }
  return items;
}

function collectNavigationItemsFromGroup(group: SceneNode): NavItem[] {
  const descendantItems = collectDescendantNavigationItems(group);
  if (descendantItems.length > 0) return descendantItems;

  const exposedItems = collectExposedNavigationItems(group);
  if (exposedItems.length > 0) return exposedItems;

  return collectLegacyNavigationGroupItem(group);
}

function isPageNavigationGroupName(name: string): boolean {
  return name === "PAGE_NAV_group";
}

function hasPageNavigationGroupAncestor(node: SceneNode): boolean {
  let parent = node.parent;
  while (parent) {
    if (isPageNavigationGroupName(readNodeName(parent))) return true;
    parent = parent.parent;
  }
  return false;
}

function collectExposedNavigationItems(group: SceneNode): NavItem[] {
  if (!isInstanceNode(group)) return [];

  const properties = readComponentProperties(group);
  const propertyNames = Object.keys(properties);
  const slotKeys = propertyNames.filter((name) => isExposedNavItemPropertyName(name));
  if (slotKeys.length === 0) return [];

  const groups = new Map<string, string[]>();
  for (const key of slotKeys) {
    const groupKey = getExposedNavItemGroupKey(key);
    const keys = groups.get(groupKey) ?? [];
    keys.push(key);
    groups.set(groupKey, keys);
  }

  const result: NavItem[] = [];
  for (const keys of groups.values()) {
    const kind = readNavigationKindFromProperties(properties, keys);
    if (!kind) continue;
    result.push({
      node: group,
      writeTargets: [{ instance: group, propertyNames: keys }],
      kind,
      kindCount: 0,
      logicalIndex: 0,
    });
  }

  return result;
}

function collectDescendantNavigationItems(group: SceneNode): NavItem[] {
  const items: NavItem[] = [];
  for (const node of walkScene(group, false)) {
    if (!isInstanceNode(node)) continue;
    if (readNodeName(node) !== "NAV_item" && !hasPageNavigationTextProperty(node)) continue;
    const kind = readNavigationKindFromInstance(node);
    if (!kind) continue;
    items.push({
      node,
      writeTargets: [{ instance: node }],
      kind,
      kindCount: 0,
      logicalIndex: 0,
    });
  }
  return items;
}

function collectLegacyNavigationGroupItem(group: SceneNode): NavItem[] {
  const writableInstances = collectWritableInstances(group);
  for (const instance of writableInstances) {
    const kind = readNavigationKindFromInstance(instance);
    if (!kind) continue;
    return [
      {
        node: group,
        writeTargets: writableInstances.map((target) => ({ instance: target })),
        kind,
        kindCount: 0,
        logicalIndex: 0,
      },
    ];
  }
  return [];
}

function readNavigationKindFromInstance(node: InstanceNode): NavKind | null {
  const properties = readComponentProperties(node);
  const propertyNames = Object.keys(properties);
  const typeKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "TYPE");
  const value = typeKey ? properties[typeKey].value : undefined;
  return (typeof value === "string" ? parseNavigationKindValue(value) : null) ?? readNavigationKindFromProperties(properties, propertyNames);
}

function readNavigationKindFromProperties(properties: Record<string, { value?: unknown }>, propertyNames: string[]): NavKind | null {
  const typeKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "TYPE");
  const typeValue = typeKey ? properties[typeKey].value : undefined;
  if (typeof typeValue === "string") {
    const kind = parseNavigationKindValue(typeValue);
    if (kind) return kind;
  }

  const normalizedNames = propertyNames.map((name) => normalizeNavigationPropertyName(name));
  if (normalizedNames.includes("PAGE_CHAPTER_TEXT")) return "CHAPTER";
  if (normalizedNames.includes("PAGE_TITLE_TEXT")) return "TITLE";
  if (normalizedNames.includes("PAGE_STEP_TEXT")) return "STEP";
  return null;
}

function parseNavigationKindValue(value: string): NavKind | null {
  const normalized = value.trim().toUpperCase();
  if (normalized === "CHAPTER" || normalized === "TITLE" || normalized === "STEP") return normalized;
  if (normalized === "PAGE_CHAPTER") return "CHAPTER";
  if (normalized === "PAGE_TITLE") return "TITLE";
  if (normalized === "PAGE_STEP") return "STEP";
  return null;
}

function collectWritableInstances(node: SceneNode): InstanceNode[] {
  const instances: InstanceNode[] = [];
  if (isInstanceNode(node)) instances.push(node);
  for (const child of walkScene(node, false)) {
    if (isInstanceNode(child)) instances.push(child);
  }
  return instances;
}

function assignLogicalIndexes(items: NavItem[]): void {
  for (const kind of ["CHAPTER", "TITLE", "STEP"] as const) {
    const sameKind = items.filter((item) => item.kind === kind);
    sameKind.forEach((item) => {
      item.kindCount = sameKind.length;
    });
    const orderedNodes = sortByVisualOrder(sameKind.map((item) => item.node));
    orderedNodes.forEach((node, index) => {
      const item = sameKind.find((candidate) => candidate.node === node);
      if (item) item.logicalIndex = index + 1;
    });
  }
}

function warnForMissingNavigationGroups(
  items: NavItem[],
  page: PagePlanItem,
  document: OutlineDocument,
  warnings: NavigationWarning[],
  node: SceneNode,
): void {
  for (const kind of ["CHAPTER", "TITLE", "STEP"] as const) {
    const actual = items.filter((item) => item.kind === kind).length;
    const expected = expectedNavigationCount(kind, actual, page, document);
    if (actual < expected) {
      warnings.push(
        warning(
          "NAV_GROUP_INSUFFICIENT",
          `NAV_group 数量不足：${kind} 需要 ${String(expected)} 个，当前 ${String(actual)} 个。`,
          node,
        ),
      );
    }
  }
}

function expectedNavigationCount(kind: NavKind, actual: number, page: PagePlanItem, document: OutlineDocument): number {
  const currentChapter = typeof page.chapterIndex === "number" ? getChapter(document, page.chapterIndex) : undefined;
  const currentTitle =
    currentChapter && typeof page.titleIndex === "number" ? getTitle(currentChapter, page.titleIndex) : undefined;

  if (kind === "CHAPTER") {
    if (typeof page.chapterIndex !== "number") return 0;
    return actual <= 1 ? 1 : document.chapters.length;
  }

  if (kind === "TITLE") {
    if (typeof page.titleIndex !== "number") return 0;
    return actual <= 1 ? 1 : (currentChapter?.titles.length ?? 0);
  }

  if (typeof page.stepIndex !== "number") return 0;
  return actual <= 1 ? 1 : (currentTitle?.steps.length ?? 0);
}

function resolveFrameNavigationContext(node: SceneNode, page: PagePlanItem): FrameNavigationContext {
  return parseFrameNavigationContext(readNodeName(node)) ?? parseFrameNavigationContext(page.frameName) ?? { kind: null };
}

function parseFrameNavigationContext(frameName: string): FrameNavigationContext | null {
  const match = /^\s*\d+\.(.+?)\s*$/.exec(frameName);
  if (!match) return null;

  const suffix = match[1].trim();
  const legacyKind = parseLegacyFrameKind(suffix);
  if (legacyKind) return { kind: legacyKind };

  const segments = suffix.split("/").map((segment) => segment.trim());
  if (segments[2]) return { kind: "STEP" };
  if (segments[1]) return { kind: "TITLE" };
  if (segments[0]) return { kind: "CHAPTER" };
  return null;
}

function parseLegacyFrameKind(suffix: string): NavKind | null {
  const normalized = suffix.toUpperCase();
  if (normalized === "CHAPTER" || normalized === "TITLE" || normalized === "STEP") return normalized;
  return null;
}

function resolveNavigationState(
  item: NavItem,
  page: PagePlanItem,
  document: OutlineDocument,
  frameContext: FrameNavigationContext,
): {
  show: boolean;
  highlight: boolean;
  label: string;
} {
  const currentKind = frameContext.kind ?? normalizePageKind(page.kind);
  if (item.kind === "CHAPTER") {
    const chapterIndex = item.kindCount === 1 && typeof page.chapterIndex === "number" ? page.chapterIndex : item.logicalIndex;
    const chapter = getChapter(document, chapterIndex);
    return {
      show: Boolean(chapter),
      highlight: Boolean(currentKind) && page.chapterIndex === chapterIndex,
      label: chapter?.title ?? "",
    };
  }

  const chapter = typeof page.chapterIndex === "number" ? getChapter(document, page.chapterIndex) : undefined;
  if (item.kind === "TITLE") {
    const titleIndex = item.kindCount === 1 && typeof page.titleIndex === "number" ? page.titleIndex : item.logicalIndex;
    const title = chapter ? getTitle(chapter, titleIndex) : undefined;
    return {
      show: Boolean(title),
      highlight: (currentKind === "TITLE" || currentKind === "STEP") && page.titleIndex === titleIndex,
      label: title?.title ?? "",
    };
  }

  const title = chapter && typeof page.titleIndex === "number" ? getTitle(chapter, page.titleIndex) : undefined;
  const stepIndex = item.kindCount === 1 && typeof page.stepIndex === "number" ? page.stepIndex : item.logicalIndex;
  const step = title ? getStep(title, stepIndex) : undefined;
  return {
    show: Boolean(step),
    highlight: currentKind === "STEP" && page.stepIndex === stepIndex,
    label: step?.title ?? "",
  };
}

function normalizePageKind(kind: PagePlanItem["kind"]): NavKind | null {
  const normalized = String(kind).trim().toUpperCase();
  if (normalized === "CHAPTER" || normalized === "TITLE" || normalized === "STEP") return normalized;
  return null;
}

function getChapter(document: OutlineDocument, index: number): ChapterNode | undefined {
  if (index < 1 || index > document.chapters.length) return undefined;
  return document.chapters[index - 1];
}

function getTitle(chapter: ChapterNode, index: number): TitleNode | undefined {
  if (index < 1 || index > chapter.titles.length) return undefined;
  return chapter.titles[index - 1];
}

function getStep(title: TitleNode, index: number): StepNode | undefined {
  if (index < 1 || index > title.steps.length) return undefined;
  return title.steps[index - 1];
}

function buildNavigationTextPatch(item: NavItem, label: string, propertyNames: string[]): Record<string, string> {
  const targetsByKind: Record<NavKind, string[]> = {
    CHAPTER: ["PAGE_CHAPTER_TEXT", "PAGE_CHAPTER_TEXT (HUGE)", "TOC_CHAPTER_TEXT"],
    TITLE: ["PAGE_TITLE_TEXT", "TOC_TITLE_TEXT"],
    STEP: ["PAGE_STEP_TEXT"],
  };
  const patch: Record<string, string> = {};
  for (const rawName of propertyNames) {
    const name = normalizeNavigationPropertyName(rawName);
    if (targetsByKind[item.kind].includes(name)) patch[rawName] = label;
    if (name === "TOC_NUM_TEXT" && item.kind === "CHAPTER") patch[rawName] = formatTwoDigit(item.logicalIndex);
  }
  return patch;
}

function hasPageNavigationTextProperty(instance: InstanceNode): boolean {
  return Object.keys(readComponentProperties(instance)).some((name) =>
    ["PAGE_CHAPTER_TEXT", "PAGE_CHAPTER_TEXT (HUGE)", "PAGE_TITLE_TEXT", "PAGE_STEP_TEXT"].includes(normalizeNavigationPropertyName(name)),
  );
}

function isExposedNavItemPropertyName(name: string): boolean {
  const normalized = normalizeComponentPropertyName(name);
  return normalized.includes("/") && normalized.split(/[/.]/).some((part) => part.trim() === "NAV_item");
}

function getExposedNavItemGroupKey(name: string): string {
  const normalized = normalizeComponentPropertyName(name);
  const slashIndex = normalized.lastIndexOf("/");
  if (slashIndex < 0) return normalized;
  return normalized.slice(0, slashIndex);
}

function normalizeNavigationPropertyName(name: string): string {
  const normalized = normalizeComponentPropertyName(name);
  return normalized.split(/[/.]/).pop()?.trim() ?? normalized;
}
