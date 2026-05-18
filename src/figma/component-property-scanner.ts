import type {
  AdapterWarning,
  ComponentNode,
  ComponentSetNode,
  ComponentPropertyScanOutput,
  ComponentPropertySummary,
  ComponentPropertyValue,
  FigmaRuntime,
  SceneNode,
} from "./figma-types";
import {
  isInstanceNode,
  isInjectableTextPropertyName,
  normalizeComponentPropertyName,
  readComponentProperties,
  readNodeName,
  resolveFigmaRuntime,
  walkScene,
  warning,
} from "./figma-utils";

type MutableSummary = {
  name: string;
  count: number;
  nodeNames: Set<string>;
  types: Set<string>;
};

export async function scanFileComponentProperties(figma?: FigmaRuntime): Promise<ComponentPropertyScanOutput> {
  const runtime = resolveFigmaRuntime(figma);
  await runtime.loadAllPagesAsync?.();

  const warnings: AdapterWarning[] = [];
  const nodes = collectInspectableNodes(runtime);
  const summaries = new Map<string, MutableSummary>();

  for (const node of nodes) {
    if (isInstanceNode(node)) {
      collectPropertiesFromRecord(readComponentProperties(node, warnings), readNodeName(node), summaries);
      continue;
    }

    if (isComponentSetNode(node)) {
      collectPropertiesFromRecord(readComponentPropertyDefinitions(node, warnings), readNodeName(node), summaries);
      continue;
    }

    if (isComponentNode(node) && !isVariantComponentNode(node)) {
      collectPropertiesFromRecord(readComponentPropertyDefinitions(node, warnings), readNodeName(node), summaries);
    }
  }

  return {
    properties: Array.from(summaries.values())
      .map(toSummary)
      .sort((left, right) => left.name.localeCompare(right.name)),
    warnings,
  };
}

function collectInspectableNodes(runtime: FigmaRuntime): SceneNode[] {
  if (runtime.root?.findAll) return runtime.root.findAll();
  if (runtime.currentPage) return walkScene(runtime.currentPage);
  return [];
}

function collectPropertiesFromRecord(
  properties: Record<string, ComponentPropertyValue>,
  nodeName: string,
  summaries: Map<string, MutableSummary>,
): void {
  for (const [rawName, property] of Object.entries(properties)) {
    const name = normalizeComponentPropertyName(rawName);
    if (!name) continue;
    if (!isInjectableTextPropertyName(name)) continue;
    const summary = summaries.get(name) ?? {
      name,
      count: 0,
      nodeNames: new Set<string>(),
      types: new Set<string>(),
    };
    summary.count += 1;
    summary.nodeNames.add(nodeName);
    if (property.type) summary.types.add(property.type);
    summaries.set(name, summary);
  }
}

function readComponentPropertyDefinitions(
  component: ComponentNode | ComponentSetNode,
  warnings: AdapterWarning[],
): Record<string, ComponentPropertyValue> {
  try {
    return component.componentPropertyDefinitions ?? {};
  } catch {
    warnings.push(warning("COMPONENT_PROPERTY_DEFINITIONS_READ_FAILED", `组件属性定义读取失败：${readNodeName(component)}`, component));
    return {};
  }
}

function isComponentNode(node: SceneNode): node is ComponentNode {
  return node.type === "COMPONENT";
}

function isComponentSetNode(node: SceneNode): node is ComponentSetNode {
  return node.type === "COMPONENT_SET";
}

function isVariantComponentNode(node: ComponentNode): boolean {
  return node.parent?.type === "COMPONENT_SET";
}

function toSummary(summary: MutableSummary): ComponentPropertySummary {
  return {
    name: summary.name,
    count: summary.count,
    nodeNames: Array.from(summary.nodeNames).sort((left, right) => left.localeCompare(right)).slice(0, 8),
    types: Array.from(summary.types).sort((left, right) => left.localeCompare(right)),
  };
}
