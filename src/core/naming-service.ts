import type { PagePlanItem } from "../types";

export function createFrameName(page: PagePlanItem): string {
  const pagePrefix = cleanPagePrefix(page);
  const hierarchyPath = buildHierarchyPath(page);
  return `${pagePrefix}.${hierarchyPath}`;
}

function cleanPagePrefix(page: PagePlanItem): string {
  const raw = page.kind === "COVER" ? "00" : page.pageNumberText || String(page.pageNumber);
  const digits = /\d+/.exec(raw.trim())?.[0];
  if (!digits) return page.kind === "TOC" ? "01" : "00";
  return digits.padStart(2, "0");
}

function buildHierarchyPath(page: PagePlanItem): string {
  const kind = String(page.kind).trim().toUpperCase();
  if (kind === "COVER") return "cover";
  if (kind === "TOC") return "toc";

  const segments = [
    cleanPathSegment(page.chapterTitle),
    cleanPathSegment(page.titleText),
    cleanPathSegment(page.stepText),
  ];

  if (kind === "CHAPTER") return segments[0] || "chapter";
  if (kind === "TITLE") return joinAvailableSegments(segments.slice(0, 2), "title");
  if (kind === "STEP") return joinAvailableSegments(segments, "step");
  return String(page.kind).trim().toLowerCase() || "page";
}

function joinAvailableSegments(segments: string[], fallback: string): string {
  const availableSegments = segments.filter((segment) => segment.length > 0);
  return availableSegments.length > 0 ? availableSegments.join("/") : fallback;
}

function cleanPathSegment(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}
