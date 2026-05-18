import type { AdapterWarning, ComponentNode, FigmaRuntime, PagePlanItem, SceneNode, SectionNode, TemplateInfo } from "./figma-types";
import { resolveFigmaRuntime, warning } from "./figma-utils";

export type NodeFactoryInput = {
  page: PagePlanItem;
  template: TemplateInfo;
  section: SectionNode;
  placement: { x: number; y: number };
  templateNode?: SceneNode;
  figma?: FigmaRuntime;
};

export type NodeFactoryOutput = {
  node: SceneNode | null;
  warnings: AdapterWarning[];
};

export function createNodeFromTemplate(input: NodeFactoryInput): NodeFactoryOutput {
  const warnings: AdapterWarning[] = [];
  const templateNode = input.templateNode ?? resolveTemplateNode(input);

  if (!templateNode) {
    return {
      node: null,
      warnings: [warning("TEMPLATE_NODE_NOT_FOUND", `未找到模板节点：${input.template.id}`)],
    };
  }

  let node: SceneNode;
  try {
    node = cloneTemplateNode(templateNode);
  } catch {
    return {
      node: null,
      warnings: [warning("TEMPLATE_CLONE_FAILED", `模板复制失败：${templateNode.name}`, templateNode)],
    };
  }

  node.name = input.page.frameName;
  node.x = input.placement.x;
  node.y = input.placement.y;
  node.setPluginData?.("outline2page.generatedNode", "true");
  node.setPluginData?.("outline2page.pageId", input.page.id);
  node.setPluginData?.("outline2page.pageKind", input.page.kind);

  input.section.appendChild(node);
  return { node, warnings };
}

function resolveTemplateNode(input: NodeFactoryInput): SceneNode | null {
  const runtime = resolveFigmaRuntime(input.figma);
  return runtime.getNodeById?.(input.template.id) as SceneNode | null;
}

function cloneTemplateNode(templateNode: SceneNode): SceneNode {
  if (templateNode.type === "COMPONENT") {
    return (templateNode as ComponentNode).createInstance();
  }

  if (typeof templateNode.clone !== "function") {
    throw new Error(`Node ${templateNode.id} cannot be cloned.`);
  }

  return templateNode.clone();
}

