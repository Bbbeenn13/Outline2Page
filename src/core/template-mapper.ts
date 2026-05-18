import type { PageKind, TemplateInfo, TemplateMappingInput, TemplateMappingResult } from "../types";

export function mapTemplates(input: TemplateMappingInput): TemplateMappingResult {
  const templatesById = new Map<string, TemplateInfo>(input.templates.map((template) => [template.id, template]));
  const mapping: Record<string, TemplateInfo | null> = {};
  const missingKinds: PageKind[] = [];
  const warnings: TemplateMappingResult["warnings"] = [];

  input.requiredPageKinds.forEach((pageKind) => {
    const selectedId = input.selectedTemplateIds[pageKind];
    const template = selectedId ? templatesById.get(selectedId) ?? null : null;
    mapping[pageKind] = template;

    if (!template) {
      missingKinds.push(pageKind);
      warnings.push({
        source: "template",
        code: selectedId ? "SELECTED_TEMPLATE_NOT_FOUND" : "MISSING_TEMPLATE_SELECTION",
        message: selectedId
          ? `${pageKind} 选择的模板不存在：${selectedId}。`
          : `${pageKind} 缺少模板选择。`,
        severity: "warning",
        pageKind,
        details: selectedId ? { selectedTemplateId: selectedId } : undefined,
      });
    }
  });

  return { mapping, missingKinds, warnings };
}
