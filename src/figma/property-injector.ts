import type {
  AdapterWarning,
  FigmaRuntime,
  InstanceNode,
  PagePlanItem,
  PropertyMapping,
  SceneNode,
} from "./figma-types";
import {
  formatTwoDigit,
  isInstanceNode,
  isInjectableTextPropertyName,
  isWritableValueForProperty,
  normalizeComponentPropertyName,
  readComponentProperties,
  readNodeName,
  walkScene,
  warning,
} from "./figma-utils";

export type InjectionWarning = AdapterWarning;

export type PropertyInjectorInput = {
  node: SceneNode;
  page: PagePlanItem;
  chapterRanges: Record<number, string>;
  propertyMapping?: PropertyMapping;
  figma?: FigmaRuntime;
};

export type PropertyInjectorOutput = {
  writtenCount: number;
  missingProperties: string[];
  warnings: InjectionWarning[];
};

type PropertyValueMap = Record<string, string | boolean>;

type TargetValue = {
  value: string | boolean;
};

type TargetValueMap = Partial<Record<string, TargetValue>>;

const INJECTABLE_PROPERTY_NAMES = [
  "COVER_VERSION_TEXT",
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
] as const;

const SEMANTIC_PROPERTY_NAMES: Record<string, keyof PropertyValueMap> = {
  vision: "COVER_VERSION_TEXT",
  chapterTitle: "PAGE_CHAPTER_TEXT",
  titleText: "PAGE_TITLE_TEXT",
  stepText: "PAGE_STEP_TEXT",
  pageNumber: "PAGE_PAGE_TEXT",
  pageNumberText: "PAGE_PAGE_TEXT",
  tocChapter: "TOC_CHAPTER_TEXT",
  tocNumber: "TOC_NUM_TEXT",
  tocPageRange: "TOC_PAGE_RANGE_TEXT",
  tocRange: "TOC_PAGE_RANGE_TEXT",
};

export async function injectProperties(input: PropertyInjectorInput): Promise<PropertyInjectorOutput> {
  await Promise.resolve();
  const values = buildPagePropertyValues(input.page, input.chapterRanges);
  const targets = buildPropertyTargets(values, input.propertyMapping);
  const targetValues = buildTargetValueMap(values, targets);
  const warnings: InjectionWarning[] = [];
  const seenTargets = new Set<string>();
  const ownedTargets = new Set<string>();
  let writtenCount = 0;

  for (const node of walkScene(input.node)) {
    try {
      if (isInstanceNode(node)) {
        if (isNavigationInstance(node)) continue;
        const result = injectInstanceProperties(node, targetValues);
        writtenCount += result.writtenCount;
        result.warnings.forEach((item) => warnings.push(item));
        result.seenTargets.forEach((name) => seenTargets.add(name));
        result.ownedTargets.forEach((name) => ownedTargets.add(name));
      }
    } catch {
      warnings.push(warning("NODE_ACCESS_FAILED", `节点名称读取失败，已跳过该节点：${readNodeName(node)}`, node, "info"));
    }
  }

  const missingProperties = buildExpectedTargetNames(values, targets).filter((name) => ownedTargets.has(name) && !seenTargets.has(name));
  for (const propertyName of missingProperties) {
    warnings.push({
      code: "PROPERTY_TARGET_MISSING",
      message: `生成节点缺少可写入目标：${propertyName}`,
      severity: "info",
    });
  }

  return { writtenCount, missingProperties, warnings };
}

function isNavigationInstance(instance: InstanceNode): boolean {
  if (hasNavigationName(instance)) return true;
  if (hasNavigationTypeProperty(instance)) return true;

  let parent = instance.parent;
  while (parent) {
    if (hasNavigationName(parent)) return true;
    parent = parent.parent;
  }

  return false;
}

function hasNavigationName(node: SceneNode): boolean {
  const name = readNodeName(node);
  return name === "PAGE_NAV_group" || name === "TOC_NAV_group";
}

function hasNavigationTypeProperty(instance: InstanceNode): boolean {
  return hasNavigationName(instance);
}

export function buildPagePropertyValues(page: PagePlanItem, chapterRanges: Record<number, string>): PropertyValueMap {
  const chapterNumber = formatTwoDigit(page.chapterIndex);
  const chapterRange =
    typeof page.chapterIndex === "number" ? (readChapterRange(chapterRanges, page.chapterIndex) ?? page.tocRange ?? "") : (page.tocRange ?? "");

  return {
    COVER_VERSION_TEXT: page.kind === "COVER" ? (page.vision ?? "") : "",
    PAGE_TITLE_TEXT: page.titleText ?? "",
    PAGE_CHAPTER_TEXT: page.chapterTitle ?? "",
    PAGE_STEP_TEXT: page.stepText ?? "",
    "PAGE_CHAPTER_TEXT (HUGE)": page.chapterTitle ?? "",
    PAGE_PAGE_TEXT: page.pageNumberText,
    PAGE_VERSION_TEXT: page.vision ?? "",
    TOC_TITLE_TEXT: page.titleText ?? "",
    TOC_CHAPTER_TEXT: page.chapterTitle ?? "",
    TOC_NUM_TEXT: chapterNumber,
    TOC_PAGE_RANGE_TEXT: chapterRange,
  };
}

function readChapterRange(chapterRanges: Record<number, string>, chapterIndex: number): string | undefined {
  const ranges: Record<number, string | undefined> = chapterRanges;
  return ranges[chapterIndex];
}

function buildPropertyTargets(values: PropertyValueMap, propertyMapping?: PropertyMapping): Record<string, string[]> {
  const targets: Record<string, string[]> = {};
  for (const name of Object.keys(values)) {
    targets[name] = [name];
  }

  if (!propertyMapping) return targets;

  for (const [semanticName, rawTargets] of Object.entries(propertyMapping)) {
    const propertyName = resolvePropertyMappingKey(semanticName);
    if (!(propertyName in values)) continue;

    const mappedTargets = normalizeMappedTargets(rawTargets);
    if (mappedTargets.length > 0) {
      targets[propertyName] = mappedTargets;
    }
  }

  return targets;
}

function resolvePropertyMappingKey(name: string): string {
  const normalizedName = normalizeComponentPropertyName(name);
  return SEMANTIC_PROPERTY_NAMES[normalizedName] ?? normalizedName;
}

function normalizeMappedTargets(rawTargets: string | string[] | undefined): string[] {
  const values = Array.isArray(rawTargets) ? rawTargets : [rawTargets];
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") continue;
    const normalized = normalizeComponentPropertyName(value);
    if (!isInjectableTextPropertyName(normalized)) continue;
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function buildTargetValueMap(values: PropertyValueMap, targets: Record<string, string[]>): TargetValueMap {
  const result: TargetValueMap = {};
  for (const [semanticName, targetNames] of Object.entries(targets)) {
    for (const targetName of targetNames) {
      result[targetName] = {
        value: values[semanticName],
      };
    }
  }
  return result;
}

function buildExpectedTargetNames(values: PropertyValueMap, targets: Record<string, string[]>): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const semanticName of INJECTABLE_PROPERTY_NAMES) {
    if (values[semanticName] === "") continue;
    for (const targetName of targets[semanticName] ?? []) {
      if (seen.has(targetName)) continue;
      seen.add(targetName);
      result.push(targetName);
    }
  }
  return result;
}

function injectInstanceProperties(instance: InstanceNode, targetValues: TargetValueMap): {
  writtenCount: number;
  seenTargets: Set<string>;
  ownedTargets: Set<string>;
  warnings: InjectionWarning[];
} {
  const patch: Record<string, string | boolean> = {};
  const seenTargets = new Set<string>();
  const ownedTargets = new Set<string>();
  const warnings: InjectionWarning[] = [];
  const properties = readComponentProperties(instance, warnings);

  for (const [rawName, property] of Object.entries(properties)) {
    const name = normalizeComponentPropertyName(rawName);
    if (name === "TYPE") continue;
    const target = targetValues[name];
    if (target === undefined) continue;
    ownedTargets.add(name);
    const value = target.value;
    seenTargets.add(name);
    if (!isWritableValueForProperty(property, value)) {
      warnings.push(warning("PROPERTY_TYPE_MISMATCH", `属性 ${name} 的类型与写入值不匹配。`, instance));
      continue;
    }
    patch[rawName] = value;
  }

  const keys = Object.keys(patch);
  if (keys.length > 0) {
    instance.setProperties?.(patch);
  }

  return { writtenCount: keys.length, seenTargets, ownedTargets, warnings };
}
