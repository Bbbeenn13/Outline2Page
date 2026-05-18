import type { AdapterWarning, PageNode, SceneNode, TemplateInfo } from "./figma-types";
import {
  canCreateFromTemplate,
  extractTemplateKind,
  getComponentPropertyValueType,
  getChildren,
  isInjectableTextPropertyName,
  isInstanceNode,
  isTemplateNodeName,
  normalizeComponentPropertyName,
  readComponentProperties,
  readNodeName,
  uniqueSorted,
  walkScene,
  warning,
} from "./figma-utils";

export type TemplateWarning = AdapterWarning;

export type TemplateScanInput = {
  currentPage: PageNode;
};

export type TemplateScanOutput = {
  templates: TemplateInfo[];
  warnings: TemplateWarning[];
};

export function scanTemplates(input: PageNode | TemplateScanInput): TemplateScanOutput;
export function scanTemplates(input: PageNode | TemplateScanInput): TemplateScanOutput {
  const currentPage = "currentPage" in input ? input.currentPage : input;
  const templates: TemplateInfo[] = [];
  const warnings: TemplateWarning[] = [];
  const candidates = findTemplateCandidates(currentPage);

  for (const node of candidates) {
    const propertyWarnings: TemplateWarning[] = [];
    const nodeName = readNodeName(node);
    if (!canCreateFromTemplate(node)) {
      warnings.push(warning("TEMPLATE_NOT_CLONEABLE", `模板节点无法复制：${nodeName}`, node));
    } else if (!["FRAME", "COMPONENT", "INSTANCE"].includes(node.type)) {
      warnings.push(warning("TEMPLATE_UNUSUAL_NODE_TYPE", `模板节点类型 ${node.type} 将按 clone() 尝试复制。`, node, "info"));
    }

    templates.push({
      id: node.id,
      name: nodeName,
      kindGuess: extractTemplateKind(nodeName),
      nodeType: node.type,
      width: node.width ?? 0,
      height: node.height ?? 0,
      propertyNames: collectComponentPropertyNames(node, propertyWarnings),
      textLayerNames: [],
    });
    pushAll(warnings, propertyWarnings);
  }

  return { templates, warnings };
}

function findTemplateCandidates(currentPage: PageNode): SceneNode[] {
  const nodes =
    typeof currentPage.findAll === "function"
      ? currentPage.findAll((node) => isTemplateNodeName(readNodeName(node)))
      : walkScene(currentPage, false).filter((node) => isTemplateNodeName(readNodeName(node)));
  return nodes.filter((node) => node !== currentPage);
}

function collectComponentPropertyNames(template: SceneNode, warnings: TemplateWarning[]): string[] {
  const names: string[] = [];
  for (const node of walkScene(template)) {
    if (!isInstanceNode(node)) continue;
    for (const [name, property] of Object.entries(readComponentProperties(node, warnings))) {
      const normalizedName = normalizeComponentPropertyName(name);
      if (!isInjectableTextPropertyName(normalizedName)) continue;
      if (getComponentPropertyValueType(property) !== "TEXT") continue;
      names.push(normalizedName);
    }
  }
  return uniqueSorted(names);
}

export function listTemplateChildren(template: SceneNode): SceneNode[] {
  return getChildren(template);
}

function pushAll<T>(target: T[], source: T[]): void {
  for (const item of source) target.push(item);
}
