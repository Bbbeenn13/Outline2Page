import type {
  PagePlanItem,
  PagePlannerInput,
  PagePlannerOutput,
  SkippedPage,
  TemplateInfo,
} from "../types";

type PageContext = Omit<PagePlanItem, "frameName" | "pageNumber" | "pageNumberText" | "vision" | "templateId">;

export function createPagePlan(input: PagePlannerInput): PagePlannerOutput {
  const pages: PagePlanItem[] = [];
  const skippedPages: SkippedPage[] = [];
  const warnings: PagePlannerOutput["warnings"] = [];
  const { document, templateMapping } = input;

  const pushPage = (context: PageContext): void => {
    const template = templateMapping[context.kind];
    if (!template) {
      skippedPages.push(toSkippedPage(context));
      warnings.push({
        source: "planning",
        code: "PAGE_SKIPPED_MISSING_TEMPLATE",
        message: `${context.kind} 页面缺少模板，已跳过。`,
        severity: "warning",
        pageKind: context.kind,
        pageId: context.id,
      });
      return;
    }

    pages.push(toPagePlanItem(context, template, document.vision));
  };

  if (document.vision) {
    pushPage({ id: "cover", kind: "COVER" });
  }

  if (document.hasToc) {
    pushPage({ id: "toc", kind: "TOC" });
  }

  document.chapters.forEach((chapter) => {
    pushPage({
      id: chapter.id,
      kind: "CHAPTER",
      chapterIndex: chapter.index,
      chapterTitle: chapter.title,
    });

    chapter.titles.forEach((title) => {
      pushPage({
        id: title.id,
        kind: "TITLE",
        chapterIndex: chapter.index,
        titleIndex: title.index,
        chapterTitle: chapter.title,
        titleText: title.title,
      });

      title.steps.forEach((step) => {
        pushPage({
          id: step.id,
          kind: "STEP",
          chapterIndex: chapter.index,
          titleIndex: title.index,
          stepIndex: step.index,
          chapterTitle: chapter.title,
          titleText: title.title,
          stepText: step.title,
        });
      });
    });
  });

  return { pages, skippedPages, warnings };
}

function toPagePlanItem(context: PageContext, template: TemplateInfo, vision: string | null): PagePlanItem {
  return Object.assign({}, context, {
    frameName: "",
    pageNumber: 0,
    pageNumberText: "",
    vision,
    templateId: template.id,
  });
}

function toSkippedPage(context: PageContext): SkippedPage {
  return {
    id: context.id,
    kind: context.kind,
    reason: "missing-template",
    chapterIndex: context.chapterIndex,
    titleIndex: context.titleIndex,
    stepIndex: context.stepIndex,
  };
}
