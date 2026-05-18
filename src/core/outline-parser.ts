import type {
  ChapterNode,
  OutlineDocument,
  ParseOutput,
  ParseWarning,
  StepNode,
  TitleNode,
} from "../types";

const headingPattern = /^(#{1,6})\s*(.*)$/;
const titledVisionPattern = /^《.+?》\s*=\s*(.+)$/;
const plainVisionPattern = /^《(.+?)》$/;

export function parseOutline(markdown: string): ParseOutput {
  const warnings: ParseWarning[] = [];
  const chapters: ChapterNode[] = [];
  let vision: string | null = null;
  let hasToc = false;
  let currentChapter: ChapterNode | null = null;
  let currentTitle: TitleNode | null = null;

  const addWarning = (code: string, message: string, line: number): void => {
    warnings.push({
      source: "parser",
      code,
      message,
      severity: "warning",
      line,
    });
  };

  const lines = markdown.split(/\r?\n/);
  for (let zeroBasedLine = 0; zeroBasedLine < lines.length; zeroBasedLine += 1) {
    const rawLine = lines[zeroBasedLine];
    const sourceLine = zeroBasedLine + 1;
    const line = rawLine.trim();

    if (line.length === 0) {
      continue;
    }

    const titledVisionMatch = titledVisionPattern.exec(line);
    const plainVisionMatch = plainVisionPattern.exec(line);
    if (titledVisionMatch || plainVisionMatch) {
      const nextVision = getVisionTitle(titledVisionMatch, plainVisionMatch);
      if (nextVision.length === 0) {
        addWarning("EMPTY_TITLE", "Vision 标题为空。", sourceLine);
        continue;
      }
      vision = nextVision;
      continue;
    }

    const headingMatch = headingPattern.exec(line);
    if (!headingMatch) {
      continue;
    }

    const [, marks, rawTitle] = headingMatch;
    const level = marks.length;
    const title = rawTitle.trim();

    if (title.length === 0) {
      addWarning("EMPTY_TITLE", `第 ${String(level)} 级标题为空。`, sourceLine);
    }

    if (level === 1) {
      hasToc = true;
      continue;
    }

    if (level === 2) {
      const chapterIndex = chapters.length + 1;
      currentChapter = {
        id: `chapter-${String(chapterIndex)}`,
        index: chapterIndex,
        title,
        titles: [],
        sourceLine,
      };
      chapters.push(currentChapter);
      currentTitle = null;
      continue;
    }

    if (level === 3) {
      if (!currentChapter) {
        addWarning("TITLE_WITHOUT_CHAPTER", "TITLE 缺少上级 CHAPTER，已跳过该标题。", sourceLine);
        currentTitle = null;
        continue;
      }

      const titleIndex = currentChapter.titles.length + 1;
      currentTitle = {
        id: `title-${String(currentChapter.index)}-${String(titleIndex)}`,
        chapterIndex: currentChapter.index,
        index: titleIndex,
        title,
        steps: [],
        sourceLine,
      };
      currentChapter.titles.push(currentTitle);
      continue;
    }

    if (level === 5) {
      if (!currentTitle) {
        addWarning("STEP_WITHOUT_TITLE", "STEP 缺少上级 TITLE，已跳过该小节。", sourceLine);
        continue;
      }

      const stepIndex = currentTitle.steps.length + 1;
      const step: StepNode = {
        id: `step-${String(currentTitle.chapterIndex)}-${String(currentTitle.index)}-${String(stepIndex)}`,
        chapterIndex: currentTitle.chapterIndex,
        titleIndex: currentTitle.index,
        index: stepIndex,
        title,
        sourceLine,
      };
      currentTitle.steps.push(step);
      continue;
    }

    addWarning("UNSUPPORTED_HEADING_LEVEL", `不支持的 Markdown 层级：${marks}。`, sourceLine);
  }

  if (vision === null) {
    warnings.push({
      source: "parser",
      code: "MISSING_VISION",
      message: "缺少 Vision：请使用《主题》或《Vision》= 主题。",
      severity: "warning",
      line: 1,
    });
  }

  if (!hasToc) {
    warnings.push({
      source: "parser",
      code: "MISSING_TOC",
      message: "缺少 TOC：请添加 # TOC。",
      severity: "warning",
      line: 1,
    });
  }

  const document: OutlineDocument = {
    vision,
    hasToc,
    chapters,
    warnings,
  };

  return { document, warnings };
}

function getVisionTitle(titledVisionMatch: RegExpExecArray | null, plainVisionMatch: RegExpExecArray | null): string {
  if (titledVisionMatch) {
    return titledVisionMatch[1].trim();
  }

  if (plainVisionMatch) {
    return plainVisionMatch[1].trim();
  }

  return "";
}
