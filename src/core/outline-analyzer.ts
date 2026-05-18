import type { OutlineDocument, OutlineSummary, PageKind } from "../types";

export function analyzeOutline(document: OutlineDocument): OutlineSummary {
  const chapterCount = document.chapters.length;
  const titleCount = document.chapters.reduce((sum, chapter) => sum + chapter.titles.length, 0);
  const stepCount = document.chapters.reduce(
    (sum, chapter) =>
      sum + chapter.titles.reduce((titleSum, title) => titleSum + title.steps.length, 0),
    0,
  );

  const requiredPageKinds: PageKind[] = [];
  if (document.vision) {
    requiredPageKinds.push("COVER");
  }
  if (document.hasToc) {
    requiredPageKinds.push("TOC");
  }
  if (chapterCount > 0) {
    requiredPageKinds.push("CHAPTER");
  }
  if (titleCount > 0) {
    requiredPageKinds.push("TITLE");
  }
  if (stepCount > 0) {
    requiredPageKinds.push("STEP");
  }

  return {
    vision: document.vision,
    chapterCount,
    titleCount,
    stepCount,
    estimatedPageCount:
      (document.vision ? 1 : 0) + (document.hasToc ? 1 : 0) + chapterCount + titleCount + stepCount,
    requiredPageKinds,
  };
}
