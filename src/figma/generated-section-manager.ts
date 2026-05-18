import type { AdapterWarning, FigmaRuntime, PageNode, SceneNode, SectionNode } from "./figma-types";
import {
  GENERATED_PLUGIN_DATA_KEY,
  GENERATED_PLUGIN_DATA_VALUE,
  isTemplateNodeName,
  readNodeName,
  resolveFigmaRuntime,
  warning,
} from "./figma-utils";

export type SectionManagerInput = {
  currentPage: PageNode;
  sectionName?: string;
  figma?: FigmaRuntime;
  generatedAt?: string;
  sourceHash?: string;
  version?: string;
};

export type SectionManagerOutput = {
  section: SectionNode;
  removedCount: number;
  warnings: AdapterWarning[];
};

export const DEFAULT_GENERATED_SECTION_NAME = "Outline2Page_GENERATED";
export const GENERATED_SECTION_PADDING = 200;

export function prepareGeneratedSection(input: SectionManagerInput): SectionManagerOutput {
  const runtime = resolveFigmaRuntime(input.figma);
  if (typeof runtime.createSection !== "function") {
    throw new Error("figma.createSection is required to create generated section.");
  }

  const warnings: AdapterWarning[] = [];
  let removedCount = 0;

  for (const node of input.currentPage.children.slice()) {
    if (node.type !== "SECTION") continue;
    if (isTemplateNodeName(readNodeName(node))) continue;
    if (node.getPluginData?.(GENERATED_PLUGIN_DATA_KEY) !== GENERATED_PLUGIN_DATA_VALUE) continue;

    try {
      node.remove?.();
      removedCount += 1;
    } catch {
      warnings.push(warning("GENERATED_SECTION_REMOVE_FAILED", `旧生成 Section 删除失败：${readNodeName(node)}`, node));
    }
  }

  const section = runtime.createSection();
  section.name = input.sectionName ?? DEFAULT_GENERATED_SECTION_NAME;
  section.setPluginData?.(GENERATED_PLUGIN_DATA_KEY, GENERATED_PLUGIN_DATA_VALUE);
  section.setPluginData?.("outline2page.generatedAt", input.generatedAt ?? new Date().toISOString());
  if (input.sourceHash) section.setPluginData?.("outline2page.sourceHash", input.sourceHash);
  if (input.version) section.setPluginData?.("outline2page.version", input.version);

  if (section.parent !== input.currentPage) {
    input.currentPage.appendChild(section);
  }

  return { section, removedCount, warnings };
}

export function selectGeneratedSection(section: SectionNode, currentPage?: PageNode): void {
  const page = currentPage ?? ((globalThis as { figma?: FigmaRuntime }).figma?.currentPage);
  if (!page) return;
  page.selection = [section];
}

export function fitSectionToNodes(section: SectionNode, nodes: SceneNode[]): AdapterWarning[] {
  const bounds = calculateNodeBounds(nodes);
  if (!bounds) return [];

  const width = Math.max(0.01, bounds.maxX - bounds.minX + GENERATED_SECTION_PADDING * 2);
  const height = Math.max(0.01, bounds.maxY - bounds.minY + GENERATED_SECTION_PADDING * 2);

  try {
    section.x = bounds.minX - GENERATED_SECTION_PADDING;
    section.y = bounds.minY - GENERATED_SECTION_PADDING;
    if (typeof section.resizeWithoutConstraints === "function") {
      section.resizeWithoutConstraints(width, height);
    } else if (typeof section.resize === "function") {
      section.resize(width, height);
    } else {
      section.width = width;
      section.height = height;
    }
  } catch {
    return [warning("GENERATED_SECTION_RESIZE_FAILED", `生成 Section 尺寸调整失败：${readNodeName(section)}`, section)];
  }

  return [];
}

function calculateNodeBounds(nodes: SceneNode[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  if (nodes.length === 0) return null;

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const width = node.width ?? 0;
    const height = node.height ?? 0;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
  return { minX, minY, maxX, maxY };
}
