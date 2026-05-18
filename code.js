"use strict";
(() => {
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/core/layout-engine.ts
  var defaultRowGap = 100;
  var defaultStepGap = 100;
  var defaultTitleGroupGap = 200;
  var defaultFallbackSize = { width: 1e3, height: 600 };
  function calculateLayout(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const options = {
      rowGap: (_b = (_a = input.options) == null ? void 0 : _a.rowGap) != null ? _b : defaultRowGap,
      stepGap: (_d = (_c = input.options) == null ? void 0 : _c.stepGap) != null ? _d : defaultStepGap,
      titleGroupGap: (_f = (_e = input.options) == null ? void 0 : _e.titleGroupGap) != null ? _f : defaultTitleGroupGap,
      fallbackSize: (_h = (_g = input.options) == null ? void 0 : _g.fallbackSize) != null ? _h : defaultFallbackSize
    };
    const placements = {};
    const warnings = [];
    let y = 0;
    const prefixPages = input.pages.filter((page) => page.kind === "COVER" || page.kind === "TOC");
    const chapterRows = groupChapterRows(input.pages);
    if (prefixPages.length > 0) {
      const rowHeight = placeRow(prefixPages, 0, y, input, placements, warnings, options.fallbackSize, options.stepGap);
      y += rowHeight + options.rowGap;
    }
    chapterRows.forEach((row) => {
      const rowHeight = placeRow(
        row,
        0,
        y,
        input,
        placements,
        warnings,
        options.fallbackSize,
        options.stepGap,
        options.titleGroupGap
      );
      y += rowHeight + options.rowGap;
    });
    return { placements, warnings };
  }
  function groupChapterRows(pages) {
    const rows = /* @__PURE__ */ new Map();
    pages.forEach((page) => {
      var _a;
      if (page.chapterIndex === void 0) {
        return;
      }
      const row = (_a = rows.get(page.chapterIndex)) != null ? _a : [];
      row.push(page);
      rows.set(page.chapterIndex, row);
    });
    return Array.from(rows.entries()).sort(([left], [right]) => left - right).map(([, row]) => row);
  }
  function placeRow(row, startX, y, input, placements, warnings, fallbackSize, stepGap, titleGroupGap = stepGap) {
    let x = startX;
    let rowHeight = 0;
    row.forEach((page, index) => {
      if (index > 0) {
        const previousPage = row[index - 1];
        const previousSize = resolveSize(previousPage, input, warnings, fallbackSize);
        x += previousSize.width + gapBetween(previousPage, page, stepGap, titleGroupGap);
      }
      const size = resolveSize(page, input, warnings, fallbackSize);
      placements[page.id] = { x, y };
      rowHeight = Math.max(rowHeight, size.height);
    });
    return rowHeight;
  }
  function resolveSize(page, input, warnings, fallbackSize) {
    const size = page.templateId ? input.templateSizes[page.templateId] : void 0;
    if (size) {
      return size;
    }
    if (!warnings.some((warning2) => warning2.pageId === page.id && warning2.code === "MISSING_TEMPLATE_SIZE")) {
      warnings.push({
        source: "layout",
        code: "MISSING_TEMPLATE_SIZE",
        message: `${page.id} \u7F3A\u5C11\u6A21\u677F\u5C3A\u5BF8\uFF0C\u5DF2\u4F7F\u7528\u5B89\u5168 fallback\u3002`,
        severity: "warning",
        pageId: page.id,
        pageKind: page.kind
      });
    }
    return fallbackSize;
  }
  function gapBetween(previousPage, nextPage, stepGap, titleGroupGap) {
    if (previousPage.titleIndex !== void 0 && nextPage.titleIndex !== void 0 && previousPage.titleIndex !== nextPage.titleIndex) {
      return titleGroupGap;
    }
    if (nextPage.kind === "TITLE" && previousPage.kind !== "CHAPTER") {
      return titleGroupGap;
    }
    return stepGap;
  }

  // src/core/naming-service.ts
  function createFrameName(page) {
    const pagePrefix = cleanPagePrefix(page);
    const hierarchyPath = buildHierarchyPath(page);
    return `${pagePrefix}.${hierarchyPath}`;
  }
  function cleanPagePrefix(page) {
    var _a;
    const raw = page.kind === "COVER" ? "00" : page.pageNumberText || String(page.pageNumber);
    const digits = (_a = /\d+/.exec(raw.trim())) == null ? void 0 : _a[0];
    if (!digits) return page.kind === "TOC" ? "01" : "00";
    return digits.padStart(2, "0");
  }
  function buildHierarchyPath(page) {
    const kind = String(page.kind).trim().toUpperCase();
    if (kind === "COVER") return "cover";
    if (kind === "TOC") return "toc";
    const segments = [
      cleanPathSegment(page.chapterTitle),
      cleanPathSegment(page.titleText),
      cleanPathSegment(page.stepText)
    ];
    if (kind === "CHAPTER") return segments[0] || "chapter";
    if (kind === "TITLE") return joinAvailableSegments(segments.slice(0, 2), "title");
    if (kind === "STEP") return joinAvailableSegments(segments, "step");
    return String(page.kind).trim().toLowerCase() || "page";
  }
  function joinAvailableSegments(segments, fallback) {
    const availableSegments = segments.filter((segment) => segment.length > 0);
    return availableSegments.length > 0 ? availableSegments.join("/") : fallback;
  }
  function cleanPathSegment(value) {
    return (value != null ? value : "").replace(/\s+/g, " ").trim();
  }

  // src/core/outline-analyzer.ts
  function analyzeOutline(document) {
    const chapterCount = document.chapters.length;
    const titleCount = document.chapters.reduce((sum, chapter) => sum + chapter.titles.length, 0);
    const stepCount = document.chapters.reduce(
      (sum, chapter) => sum + chapter.titles.reduce((titleSum, title) => titleSum + title.steps.length, 0),
      0
    );
    const requiredPageKinds = [];
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
      estimatedPageCount: (document.vision ? 1 : 0) + (document.hasToc ? 1 : 0) + chapterCount + titleCount + stepCount,
      requiredPageKinds
    };
  }

  // src/core/outline-parser.ts
  var headingPattern = /^(#{1,6})\s*(.*)$/;
  var titledVisionPattern = /^《.+?》\s*=\s*(.+)$/;
  var plainVisionPattern = /^《(.+?)》$/;
  function parseOutline(markdown) {
    const warnings = [];
    const chapters = [];
    let vision = null;
    let hasToc = false;
    let currentChapter = null;
    let currentTitle = null;
    const addWarning = (code, message, line) => {
      warnings.push({
        source: "parser",
        code,
        message,
        severity: "warning",
        line
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
          addWarning("EMPTY_TITLE", "Vision \u6807\u9898\u4E3A\u7A7A\u3002", sourceLine);
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
        addWarning("EMPTY_TITLE", `\u7B2C ${String(level)} \u7EA7\u6807\u9898\u4E3A\u7A7A\u3002`, sourceLine);
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
          sourceLine
        };
        chapters.push(currentChapter);
        currentTitle = null;
        continue;
      }
      if (level === 3) {
        if (!currentChapter) {
          addWarning("TITLE_WITHOUT_CHAPTER", "TITLE \u7F3A\u5C11\u4E0A\u7EA7 CHAPTER\uFF0C\u5DF2\u8DF3\u8FC7\u8BE5\u6807\u9898\u3002", sourceLine);
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
          sourceLine
        };
        currentChapter.titles.push(currentTitle);
        continue;
      }
      if (level === 5) {
        if (!currentTitle) {
          addWarning("STEP_WITHOUT_TITLE", "STEP \u7F3A\u5C11\u4E0A\u7EA7 TITLE\uFF0C\u5DF2\u8DF3\u8FC7\u8BE5\u5C0F\u8282\u3002", sourceLine);
          continue;
        }
        const stepIndex = currentTitle.steps.length + 1;
        const step = {
          id: `step-${String(currentTitle.chapterIndex)}-${String(currentTitle.index)}-${String(stepIndex)}`,
          chapterIndex: currentTitle.chapterIndex,
          titleIndex: currentTitle.index,
          index: stepIndex,
          title,
          sourceLine
        };
        currentTitle.steps.push(step);
        continue;
      }
      addWarning("UNSUPPORTED_HEADING_LEVEL", `\u4E0D\u652F\u6301\u7684 Markdown \u5C42\u7EA7\uFF1A${marks}\u3002`, sourceLine);
    }
    if (vision === null) {
      warnings.push({
        source: "parser",
        code: "MISSING_VISION",
        message: "\u7F3A\u5C11 Vision\uFF1A\u8BF7\u4F7F\u7528\u300A\u4E3B\u9898\u300B\u6216\u300AVision\u300B= \u4E3B\u9898\u3002",
        severity: "warning",
        line: 1
      });
    }
    if (!hasToc) {
      warnings.push({
        source: "parser",
        code: "MISSING_TOC",
        message: "\u7F3A\u5C11 TOC\uFF1A\u8BF7\u6DFB\u52A0 # TOC\u3002",
        severity: "warning",
        line: 1
      });
    }
    const document = {
      vision,
      hasToc,
      chapters,
      warnings
    };
    return { document, warnings };
  }
  function getVisionTitle(titledVisionMatch, plainVisionMatch) {
    if (titledVisionMatch) {
      return titledVisionMatch[1].trim();
    }
    if (plainVisionMatch) {
      return plainVisionMatch[1].trim();
    }
    return "";
  }

  // src/core/page-planner.ts
  function createPagePlan(input) {
    const pages = [];
    const skippedPages = [];
    const warnings = [];
    const { document, templateMapping } = input;
    const pushPage = (context) => {
      const template = templateMapping[context.kind];
      if (!template) {
        skippedPages.push(toSkippedPage(context));
        warnings.push({
          source: "planning",
          code: "PAGE_SKIPPED_MISSING_TEMPLATE",
          message: `${context.kind} \u9875\u9762\u7F3A\u5C11\u6A21\u677F\uFF0C\u5DF2\u8DF3\u8FC7\u3002`,
          severity: "warning",
          pageKind: context.kind,
          pageId: context.id
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
        chapterTitle: chapter.title
      });
      chapter.titles.forEach((title) => {
        pushPage({
          id: title.id,
          kind: "TITLE",
          chapterIndex: chapter.index,
          titleIndex: title.index,
          chapterTitle: chapter.title,
          titleText: title.title
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
            stepText: step.title
          });
        });
      });
    });
    return { pages, skippedPages, warnings };
  }
  function toPagePlanItem(context, template, vision) {
    return Object.assign({}, context, {
      frameName: "",
      pageNumber: 0,
      pageNumberText: "",
      vision,
      templateId: template.id
    });
  }
  function toSkippedPage(context) {
    return {
      id: context.id,
      kind: context.kind,
      reason: "missing-template",
      chapterIndex: context.chapterIndex,
      titleIndex: context.titleIndex,
      stepIndex: context.stepIndex
    };
  }

  // src/core/pagination-service.ts
  function applyPagination(pages) {
    let nextPageNumber = 1;
    const chapterBounds = /* @__PURE__ */ new Map();
    const paginatedPages = pages.map((page) => {
      const pageNumber = page.kind === "COVER" ? 0 : nextPageNumber++;
      const pageNumberText = page.kind === "COVER" ? "00" : formatPageNumber(pageNumber);
      if (page.chapterIndex !== void 0 && page.kind !== "COVER" && page.kind !== "TOC") {
        const existing = chapterBounds.get(page.chapterIndex);
        if (existing) {
          existing.end = pageNumber;
        } else {
          chapterBounds.set(page.chapterIndex, { start: pageNumber, end: pageNumber });
        }
      }
      return Object.assign({}, page, {
        pageNumber,
        pageNumberText
      });
    });
    const chapterRanges = {};
    chapterBounds.forEach((bounds, chapterIndex) => {
      chapterRanges[chapterIndex] = `${formatPageNumber(bounds.start)}-${formatPageNumber(bounds.end)}`;
    });
    return {
      pages: paginatedPages.map(
        (page) => page.chapterIndex === void 0 ? page : Object.assign({}, page, {
          tocRange: chapterRanges[page.chapterIndex]
        })
      ),
      chapterRanges
    };
  }
  function formatPageNumber(pageNumber) {
    return pageNumber.toString().padStart(2, "0");
  }

  // src/core/report-builder.ts
  function buildGenerationReport(input) {
    var _a;
    const warnings = input.warnings.slice();
    const missingTemplates = collectMissingTemplates(input);
    const missingProperties = collectMissingProperties(warnings);
    const skippedCount = input.skippedPages.length;
    const warningCount = warnings.length;
    return {
      createdSectionId: (_a = input.createdSectionId) != null ? _a : null,
      createdCount: input.createdCount,
      replacedSectionCount: input.removedCount,
      skippedCount,
      warningCount,
      warnings,
      missingTemplates,
      missingProperties,
      parseWarnings: warnings.filter((warning2) => warning2.source === "parser"),
      tocExpandedCount: input.tocExpandedCount,
      selectedNodeIds: input.selectedNodeIds.slice(),
      summaryText: createSummaryText({
        createdCount: input.createdCount,
        removedCount: input.removedCount,
        skippedCount,
        warningCount,
        tocExpandedCount: input.tocExpandedCount
      })
    };
  }
  function collectMissingTemplates(input) {
    const missingKinds = [];
    input.skippedPages.forEach((page) => {
      if (page.reason === "missing-template" && !missingKinds.includes(page.kind)) {
        missingKinds.push(page.kind);
      }
    });
    input.warnings.forEach((warning2) => {
      if ((warning2.code === "MISSING_TEMPLATE_SELECTION" || warning2.code === "SELECTED_TEMPLATE_NOT_FOUND" || warning2.code === "PAGE_SKIPPED_MISSING_TEMPLATE") && warning2.pageKind && !missingKinds.includes(warning2.pageKind)) {
        missingKinds.push(warning2.pageKind);
      }
    });
    return missingKinds;
  }
  function collectMissingProperties(warnings) {
    return warnings.filter(hasMissingProperty).map((warning2) => ({
      propertyName: warning2.propertyName,
      pageId: warning2.pageId,
      source: warning2.source
    }));
  }
  function hasMissingProperty(warning2) {
    return warning2.code === "MISSING_PROPERTY" && typeof warning2.propertyName === "string";
  }
  function createSummaryText(input) {
    return [
      "\u751F\u6210\u5B8C\u6210",
      `\u521B\u5EFA\u9875\u9762\uFF1A${String(input.createdCount)}`,
      `\u8986\u76D6\u65E7 Section\uFF1A${String(input.removedCount)}`,
      `\u8DF3\u8FC7\u9875\u9762\uFF1A${String(input.skippedCount)}`,
      `\u8B66\u544A\uFF1A${String(input.warningCount)}`,
      `TOC \u6269\u5C55\uFF1A${String(input.tocExpandedCount)}`
    ].join("\n");
  }

  // src/core/template-mapper.ts
  function mapTemplates(input) {
    const templatesById = new Map(input.templates.map((template) => [template.id, template]));
    const mapping = {};
    const missingKinds = [];
    const warnings = [];
    input.requiredPageKinds.forEach((pageKind) => {
      var _a;
      const selectedId = input.selectedTemplateIds[pageKind];
      const template = selectedId ? (_a = templatesById.get(selectedId)) != null ? _a : null : null;
      mapping[pageKind] = template;
      if (!template) {
        missingKinds.push(pageKind);
        warnings.push({
          source: "template",
          code: selectedId ? "SELECTED_TEMPLATE_NOT_FOUND" : "MISSING_TEMPLATE_SELECTION",
          message: selectedId ? `${pageKind} \u9009\u62E9\u7684\u6A21\u677F\u4E0D\u5B58\u5728\uFF1A${selectedId}\u3002` : `${pageKind} \u7F3A\u5C11\u6A21\u677F\u9009\u62E9\u3002`,
          severity: "warning",
          pageKind,
          details: selectedId ? { selectedTemplateId: selectedId } : void 0
        });
      }
    });
    return { mapping, missingKinds, warnings };
  }

  // src/figma/figma-types.ts
  var MIXED = Symbol("figma.mixed");

  // src/figma/figma-utils.ts
  var TEMPLATE_PREFIXES = ["PAGE_TEMP:", "PAGE_TEMP\uFF1A"];
  var GENERATED_PLUGIN_DATA_KEY = "outline2page.generated";
  var GENERATED_PLUGIN_DATA_VALUE = "true";
  function resolveFigmaRuntime(runtime) {
    if (runtime) return runtime;
    const candidate = globalThis.figma;
    if (!candidate) {
      throw new Error("Figma runtime is not available.");
    }
    return candidate;
  }
  function getChildren(node) {
    return Array.isArray(node.children) ? node.children : [];
  }
  function walkScene(node, includeSelf = true) {
    const result = [];
    const visit = (current) => {
      result.push(current);
      for (const child of getChildren(current)) visit(child);
    };
    if (includeSelf) {
      visit(node);
      return result;
    }
    for (const child of getChildren(node)) visit(child);
    return result;
  }
  function isChildrenNode(node) {
    return Array.isArray(node.children) && typeof node.appendChild === "function";
  }
  function isInstanceNode(node) {
    return node.type === "INSTANCE";
  }
  function isTemplateNodeName(name) {
    return TEMPLATE_PREFIXES.some((prefix) => name.startsWith(prefix));
  }
  function readNodeName(node) {
    var _a;
    try {
      return (_a = node == null ? void 0 : node.name) != null ? _a : "";
    } catch (e) {
      return "";
    }
  }
  function extractTemplateKind(name) {
    var _a, _b;
    const prefix = TEMPLATE_PREFIXES.find((item) => name.startsWith(item));
    if (!prefix) return "";
    const body = name.slice(prefix.length).trim();
    const parts = body.split("/").map((part) => part.trim()).filter((part) => part.length > 0);
    const kind = parts.length > 0 ? parts[parts.length - 1] : body;
    return (_b = (_a = kind.split(/\s+/)[0]) == null ? void 0 : _a.toUpperCase()) != null ? _b : "";
  }
  function normalizeComponentPropertyName(name) {
    return name.split("#", 1)[0].trim();
  }
  function isInjectableTextPropertyName(name) {
    return normalizeComponentPropertyName(name).includes("_TEXT");
  }
  function uniqueSorted(values) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }
  function hasClone(node) {
    return typeof node.clone === "function";
  }
  function canCreateFromTemplate(node) {
    return node.type === "COMPONENT" || hasClone(node);
  }
  function sortByVisualOrder(items) {
    return items.slice().sort((a, b) => {
      var _a, _b, _c, _d;
      const yDiff = ((_a = a.y) != null ? _a : 0) - ((_b = b.y) != null ? _b : 0);
      if (Math.abs(yDiff) > 1) return yDiff;
      return ((_c = a.x) != null ? _c : 0) - ((_d = b.x) != null ? _d : 0);
    });
  }
  function getComponentPropertyValueType(property) {
    return property && typeof property === "object" ? property.type : void 0;
  }
  function isWritableValueForProperty(property, value) {
    const type = getComponentPropertyValueType(property);
    if (!type) return true;
    if (type === "BOOLEAN") return typeof value === "boolean";
    if (type === "TEXT" || type === "VARIANT") return typeof value === "string";
    return typeof value === "string" || typeof value === "boolean";
  }
  function readComponentProperties(instance, warnings) {
    var _a;
    try {
      return (_a = instance.componentProperties) != null ? _a : {};
    } catch (e) {
      warnings == null ? void 0 : warnings.push(warning("COMPONENT_PROPERTIES_READ_FAILED", `\u7EC4\u4EF6\u5C5E\u6027\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u8BE5\u5B9E\u4F8B\uFF1A${readNodeName(instance)}`, instance));
      return {};
    }
  }
  function formatTwoDigit(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return "";
    return String(value).padStart(2, "0");
  }
  function warning(code, message, node, severity = "warning") {
    return {
      code,
      message,
      nodeId: node == null ? void 0 : node.id,
      nodeName: readNodeName(node),
      severity
    };
  }

  // src/figma/template-scanner.ts
  function scanTemplates(input) {
    var _a, _b;
    const currentPage = "currentPage" in input ? input.currentPage : input;
    const templates = [];
    const warnings = [];
    const candidates = findTemplateCandidates(currentPage);
    for (const node of candidates) {
      const propertyWarnings = [];
      const nodeName = readNodeName(node);
      if (!canCreateFromTemplate(node)) {
        warnings.push(warning("TEMPLATE_NOT_CLONEABLE", `\u6A21\u677F\u8282\u70B9\u65E0\u6CD5\u590D\u5236\uFF1A${nodeName}`, node));
      } else if (!["FRAME", "COMPONENT", "INSTANCE"].includes(node.type)) {
        warnings.push(warning("TEMPLATE_UNUSUAL_NODE_TYPE", `\u6A21\u677F\u8282\u70B9\u7C7B\u578B ${node.type} \u5C06\u6309 clone() \u5C1D\u8BD5\u590D\u5236\u3002`, node, "info"));
      }
      templates.push({
        id: node.id,
        name: nodeName,
        kindGuess: extractTemplateKind(nodeName),
        nodeType: node.type,
        width: (_a = node.width) != null ? _a : 0,
        height: (_b = node.height) != null ? _b : 0,
        propertyNames: collectComponentPropertyNames(node, propertyWarnings),
        textLayerNames: []
      });
      pushAll(warnings, propertyWarnings);
    }
    return { templates, warnings };
  }
  function findTemplateCandidates(currentPage) {
    const nodes = typeof currentPage.findAll === "function" ? currentPage.findAll((node) => isTemplateNodeName(readNodeName(node))) : walkScene(currentPage, false).filter((node) => isTemplateNodeName(readNodeName(node)));
    return nodes.filter((node) => node !== currentPage);
  }
  function collectComponentPropertyNames(template, warnings) {
    const names = [];
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
  function pushAll(target, source) {
    for (const item of source) target.push(item);
  }

  // src/figma/generated-section-manager.ts
  var DEFAULT_GENERATED_SECTION_NAME = "Outline2Page_GENERATED";
  var GENERATED_SECTION_PADDING = 200;
  function prepareGeneratedSection(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const runtime = resolveFigmaRuntime(input.figma);
    if (typeof runtime.createSection !== "function") {
      throw new Error("figma.createSection is required to create generated section.");
    }
    const warnings = [];
    let removedCount = 0;
    for (const node of input.currentPage.children.slice()) {
      if (node.type !== "SECTION") continue;
      if (isTemplateNodeName(readNodeName(node))) continue;
      if (((_a = node.getPluginData) == null ? void 0 : _a.call(node, GENERATED_PLUGIN_DATA_KEY)) !== GENERATED_PLUGIN_DATA_VALUE) continue;
      try {
        (_b = node.remove) == null ? void 0 : _b.call(node);
        removedCount += 1;
      } catch (e) {
        warnings.push(warning("GENERATED_SECTION_REMOVE_FAILED", `\u65E7\u751F\u6210 Section \u5220\u9664\u5931\u8D25\uFF1A${readNodeName(node)}`, node));
      }
    }
    const section = runtime.createSection();
    section.name = (_c = input.sectionName) != null ? _c : DEFAULT_GENERATED_SECTION_NAME;
    (_d = section.setPluginData) == null ? void 0 : _d.call(section, GENERATED_PLUGIN_DATA_KEY, GENERATED_PLUGIN_DATA_VALUE);
    (_f = section.setPluginData) == null ? void 0 : _f.call(section, "outline2page.generatedAt", (_e = input.generatedAt) != null ? _e : (/* @__PURE__ */ new Date()).toISOString());
    if (input.sourceHash) (_g = section.setPluginData) == null ? void 0 : _g.call(section, "outline2page.sourceHash", input.sourceHash);
    if (input.version) (_h = section.setPluginData) == null ? void 0 : _h.call(section, "outline2page.version", input.version);
    if (section.parent !== input.currentPage) {
      input.currentPage.appendChild(section);
    }
    return { section, removedCount, warnings };
  }
  function selectGeneratedSection(section, currentPage) {
    var _a;
    const page = currentPage != null ? currentPage : (_a = globalThis.figma) == null ? void 0 : _a.currentPage;
    if (!page) return;
    page.selection = [section];
  }
  function fitSectionToNodes(section, nodes) {
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
    } catch (e) {
      return [warning("GENERATED_SECTION_RESIZE_FAILED", `\u751F\u6210 Section \u5C3A\u5BF8\u8C03\u6574\u5931\u8D25\uFF1A${readNodeName(section)}`, section)];
    }
    return [];
  }
  function calculateNodeBounds(nodes) {
    var _a, _b, _c, _d;
    if (nodes.length === 0) return null;
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const node of nodes) {
      const x = (_a = node.x) != null ? _a : 0;
      const y = (_b = node.y) != null ? _b : 0;
      const width = (_c = node.width) != null ? _c : 0;
      const height = (_d = node.height) != null ? _d : 0;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null;
    return { minX, minY, maxX, maxY };
  }

  // src/figma/component-property-scanner.ts
  function scanFileComponentProperties(figma2) {
    return __async(this, null, function* () {
      var _a;
      const runtime = resolveFigmaRuntime(figma2);
      yield (_a = runtime.loadAllPagesAsync) == null ? void 0 : _a.call(runtime);
      const warnings = [];
      const nodes = collectInspectableNodes(runtime);
      const summaries = /* @__PURE__ */ new Map();
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
        properties: Array.from(summaries.values()).map(toSummary).sort((left, right) => left.name.localeCompare(right.name)),
        warnings
      };
    });
  }
  function collectInspectableNodes(runtime) {
    var _a;
    if ((_a = runtime.root) == null ? void 0 : _a.findAll) return runtime.root.findAll();
    if (runtime.currentPage) return walkScene(runtime.currentPage);
    return [];
  }
  function collectPropertiesFromRecord(properties, nodeName, summaries) {
    var _a;
    for (const [rawName, property] of Object.entries(properties)) {
      const name = normalizeComponentPropertyName(rawName);
      if (!name) continue;
      if (!isInjectableTextPropertyName(name)) continue;
      const summary = (_a = summaries.get(name)) != null ? _a : {
        name,
        count: 0,
        nodeNames: /* @__PURE__ */ new Set(),
        types: /* @__PURE__ */ new Set()
      };
      summary.count += 1;
      summary.nodeNames.add(nodeName);
      if (property.type) summary.types.add(property.type);
      summaries.set(name, summary);
    }
  }
  function readComponentPropertyDefinitions(component, warnings) {
    var _a;
    try {
      return (_a = component.componentPropertyDefinitions) != null ? _a : {};
    } catch (e) {
      warnings.push(warning("COMPONENT_PROPERTY_DEFINITIONS_READ_FAILED", `\u7EC4\u4EF6\u5C5E\u6027\u5B9A\u4E49\u8BFB\u53D6\u5931\u8D25\uFF1A${readNodeName(component)}`, component));
      return {};
    }
  }
  function isComponentNode(node) {
    return node.type === "COMPONENT";
  }
  function isComponentSetNode(node) {
    return node.type === "COMPONENT_SET";
  }
  function isVariantComponentNode(node) {
    var _a;
    return ((_a = node.parent) == null ? void 0 : _a.type) === "COMPONENT_SET";
  }
  function toSummary(summary) {
    return {
      name: summary.name,
      count: summary.count,
      nodeNames: Array.from(summary.nodeNames).sort((left, right) => left.localeCompare(right)).slice(0, 8),
      types: Array.from(summary.types).sort((left, right) => left.localeCompare(right))
    };
  }

  // src/figma/node-factory.ts
  function createNodeFromTemplate(input) {
    var _a, _b, _c, _d;
    const warnings = [];
    const templateNode = (_a = input.templateNode) != null ? _a : resolveTemplateNode(input);
    if (!templateNode) {
      return {
        node: null,
        warnings: [warning("TEMPLATE_NODE_NOT_FOUND", `\u672A\u627E\u5230\u6A21\u677F\u8282\u70B9\uFF1A${input.template.id}`)]
      };
    }
    let node;
    try {
      node = cloneTemplateNode(templateNode);
    } catch (e) {
      return {
        node: null,
        warnings: [warning("TEMPLATE_CLONE_FAILED", `\u6A21\u677F\u590D\u5236\u5931\u8D25\uFF1A${templateNode.name}`, templateNode)]
      };
    }
    node.name = input.page.frameName;
    node.x = input.placement.x;
    node.y = input.placement.y;
    (_b = node.setPluginData) == null ? void 0 : _b.call(node, "outline2page.generatedNode", "true");
    (_c = node.setPluginData) == null ? void 0 : _c.call(node, "outline2page.pageId", input.page.id);
    (_d = node.setPluginData) == null ? void 0 : _d.call(node, "outline2page.pageKind", input.page.kind);
    input.section.appendChild(node);
    return { node, warnings };
  }
  function resolveTemplateNode(input) {
    var _a;
    const runtime = resolveFigmaRuntime(input.figma);
    return (_a = runtime.getNodeById) == null ? void 0 : _a.call(runtime, input.template.id);
  }
  function cloneTemplateNode(templateNode) {
    if (templateNode.type === "COMPONENT") {
      return templateNode.createInstance();
    }
    if (typeof templateNode.clone !== "function") {
      throw new Error(`Node ${templateNode.id} cannot be cloned.`);
    }
    return templateNode.clone();
  }

  // src/figma/property-injector.ts
  var INJECTABLE_PROPERTY_NAMES = [
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
    "TOC_PAGE_RANGE_TEXT"
  ];
  var SEMANTIC_PROPERTY_NAMES = {
    vision: "COVER_VERSION_TEXT",
    chapterTitle: "PAGE_CHAPTER_TEXT",
    titleText: "PAGE_TITLE_TEXT",
    stepText: "PAGE_STEP_TEXT",
    pageNumber: "PAGE_PAGE_TEXT",
    pageNumberText: "PAGE_PAGE_TEXT",
    tocChapter: "TOC_CHAPTER_TEXT",
    tocNumber: "TOC_NUM_TEXT",
    tocPageRange: "TOC_PAGE_RANGE_TEXT",
    tocRange: "TOC_PAGE_RANGE_TEXT"
  };
  function injectProperties(input) {
    return __async(this, null, function* () {
      yield Promise.resolve();
      const values = buildPagePropertyValues(input.page, input.chapterRanges);
      const targets = buildPropertyTargets(values, input.propertyMapping);
      const targetValues = buildTargetValueMap(values, targets);
      const warnings = [];
      const seenTargets = /* @__PURE__ */ new Set();
      const ownedTargets = /* @__PURE__ */ new Set();
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
        } catch (e) {
          warnings.push(warning("NODE_ACCESS_FAILED", `\u8282\u70B9\u540D\u79F0\u8BFB\u53D6\u5931\u8D25\uFF0C\u5DF2\u8DF3\u8FC7\u8BE5\u8282\u70B9\uFF1A${readNodeName(node)}`, node, "info"));
        }
      }
      const missingProperties = buildExpectedTargetNames(values, targets).filter((name) => ownedTargets.has(name) && !seenTargets.has(name));
      for (const propertyName of missingProperties) {
        warnings.push({
          code: "PROPERTY_TARGET_MISSING",
          message: `\u751F\u6210\u8282\u70B9\u7F3A\u5C11\u53EF\u5199\u5165\u76EE\u6807\uFF1A${propertyName}`,
          severity: "info"
        });
      }
      return { writtenCount, missingProperties, warnings };
    });
  }
  function isNavigationInstance(instance) {
    if (hasNavigationName(instance)) return true;
    if (hasNavigationTypeProperty(instance)) return true;
    let parent = instance.parent;
    while (parent) {
      if (hasNavigationName(parent)) return true;
      parent = parent.parent;
    }
    return false;
  }
  function hasNavigationName(node) {
    const name = readNodeName(node);
    return name === "PAGE_NAV_group" || name === "TOC_NAV_group";
  }
  function hasNavigationTypeProperty(instance) {
    return hasNavigationName(instance);
  }
  function buildPagePropertyValues(page, chapterRanges) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const chapterNumber = formatTwoDigit(page.chapterIndex);
    const chapterRange = typeof page.chapterIndex === "number" ? (_b = (_a = readChapterRange(chapterRanges, page.chapterIndex)) != null ? _a : page.tocRange) != null ? _b : "" : (_c = page.tocRange) != null ? _c : "";
    return {
      COVER_VERSION_TEXT: page.kind === "COVER" ? (_d = page.vision) != null ? _d : "" : "",
      PAGE_TITLE_TEXT: (_e = page.titleText) != null ? _e : "",
      PAGE_CHAPTER_TEXT: (_f = page.chapterTitle) != null ? _f : "",
      PAGE_STEP_TEXT: (_g = page.stepText) != null ? _g : "",
      "PAGE_CHAPTER_TEXT (HUGE)": (_h = page.chapterTitle) != null ? _h : "",
      PAGE_PAGE_TEXT: page.pageNumberText,
      PAGE_VERSION_TEXT: (_i = page.vision) != null ? _i : "",
      TOC_TITLE_TEXT: (_j = page.titleText) != null ? _j : "",
      TOC_CHAPTER_TEXT: (_k = page.chapterTitle) != null ? _k : "",
      TOC_NUM_TEXT: chapterNumber,
      TOC_PAGE_RANGE_TEXT: chapterRange
    };
  }
  function readChapterRange(chapterRanges, chapterIndex) {
    const ranges = chapterRanges;
    return ranges[chapterIndex];
  }
  function buildPropertyTargets(values, propertyMapping) {
    const targets = {};
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
  function resolvePropertyMappingKey(name) {
    var _a;
    const normalizedName = normalizeComponentPropertyName(name);
    return (_a = SEMANTIC_PROPERTY_NAMES[normalizedName]) != null ? _a : normalizedName;
  }
  function normalizeMappedTargets(rawTargets) {
    const values = Array.isArray(rawTargets) ? rawTargets : [rawTargets];
    const result = [];
    const seen = /* @__PURE__ */ new Set();
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
  function buildTargetValueMap(values, targets) {
    const result = {};
    for (const [semanticName, targetNames] of Object.entries(targets)) {
      for (const targetName of targetNames) {
        result[targetName] = {
          value: values[semanticName]
        };
      }
    }
    return result;
  }
  function buildExpectedTargetNames(values, targets) {
    var _a;
    const result = [];
    const seen = /* @__PURE__ */ new Set();
    for (const semanticName of INJECTABLE_PROPERTY_NAMES) {
      if (values[semanticName] === "") continue;
      for (const targetName of (_a = targets[semanticName]) != null ? _a : []) {
        if (seen.has(targetName)) continue;
        seen.add(targetName);
        result.push(targetName);
      }
    }
    return result;
  }
  function injectInstanceProperties(instance, targetValues) {
    var _a;
    const patch = {};
    const seenTargets = /* @__PURE__ */ new Set();
    const ownedTargets = /* @__PURE__ */ new Set();
    const warnings = [];
    const properties = readComponentProperties(instance, warnings);
    for (const [rawName, property] of Object.entries(properties)) {
      const name = normalizeComponentPropertyName(rawName);
      if (name === "TYPE") continue;
      const target = targetValues[name];
      if (target === void 0) continue;
      ownedTargets.add(name);
      const value = target.value;
      seenTargets.add(name);
      if (!isWritableValueForProperty(property, value)) {
        warnings.push(warning("PROPERTY_TYPE_MISMATCH", `\u5C5E\u6027 ${name} \u7684\u7C7B\u578B\u4E0E\u5199\u5165\u503C\u4E0D\u5339\u914D\u3002`, instance));
        continue;
      }
      patch[rawName] = value;
    }
    const keys = Object.keys(patch);
    if (keys.length > 0) {
      (_a = instance.setProperties) == null ? void 0 : _a.call(instance, patch);
    }
    return { writtenCount: keys.length, seenTargets, ownedTargets, warnings };
  }

  // src/figma/navigation-injector.ts
  function injectNavigation(input) {
    const warnings = [];
    const navItems = collectNavigationItems(input.node);
    assignLogicalIndexes(navItems);
    warnForMissingNavigationGroups(navItems, input.page, input.document, warnings, input.node);
    const frameContext = resolveFrameNavigationContext(input.node, input.page);
    let showWrittenCount = 0;
    let highlightWrittenCount = 0;
    let textWrittenCount = 0;
    for (const item of navItems) {
      const state = resolveNavigationState(item, input.page, input.document, frameContext);
      const writeResult = writeNavigationItem(item, state, warnings);
      showWrittenCount += writeResult.showWrittenCount;
      highlightWrittenCount += writeResult.highlightWrittenCount;
      textWrittenCount += writeResult.textWrittenCount;
    }
    return { showWrittenCount, highlightWrittenCount, textWrittenCount, warnings };
  }
  function writeNavigationItem(item, state, warnings) {
    var _a;
    let showWrittenCount = 0;
    let highlightWrittenCount = 0;
    let textWrittenCount = 0;
    let hasShowTarget = false;
    let hasHighlightTarget = false;
    for (const target of item.writeTargets) {
      const instance = target.instance;
      const properties = readComponentProperties(instance, warnings);
      const propertyNames = (_a = target.propertyNames) != null ? _a : Object.keys(properties);
      const showKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "SHOW");
      const highlightKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "HIGHLIGHT");
      const textPatch = buildNavigationTextPatch(item, state.label, propertyNames);
      const textWrittenKeys = writePropertiesSafe(instance, textPatch, warnings);
      textWrittenCount += textWrittenKeys.length;
      if (showKey) {
        hasShowTarget = true;
        const showWrittenKeys = writePropertiesSafe(instance, { [showKey]: state.show }, warnings);
        showWrittenCount += showWrittenKeys.length;
      }
      if (highlightKey) {
        hasHighlightTarget = true;
        const highlightValue = resolveHighlightValue(properties[highlightKey].value, state.highlight);
        const highlightWrittenKeys = writePropertiesSafe(instance, { [highlightKey]: highlightValue }, warnings);
        highlightWrittenCount += highlightWrittenKeys.length;
      }
    }
    if (!hasShowTarget) warnings.push(warning("NAV_SHOW_MISSING", `Navigation item is missing SHOW: ${readNodeName(item.node)}`, item.node));
    if (!hasHighlightTarget) {
      warnings.push(warning("NAV_HIGHLIGHT_MISSING", `Navigation item is missing HIGHLIGHT: ${readNodeName(item.node)}`, item.node));
    }
    return { showWrittenCount, highlightWrittenCount, textWrittenCount };
  }
  function resolveHighlightValue(currentValue, active) {
    if (typeof currentValue !== "string") return active ? "on" : "off";
    const normalized = currentValue.trim().toLowerCase();
    if (normalized === "on" || normalized === "off") return active ? preserveVariantCase(currentValue, "on") : preserveVariantCase(currentValue, "off");
    if (normalized === "true" || normalized === "false") {
      return active ? preserveVariantCase(currentValue, "true") : preserveVariantCase(currentValue, "false");
    }
    if (normalized === "yes" || normalized === "no") return active ? preserveVariantCase(currentValue, "yes") : preserveVariantCase(currentValue, "no");
    if (normalized === "active" || normalized === "inactive") {
      return active ? preserveVariantCase(currentValue, "active") : preserveVariantCase(currentValue, "inactive");
    }
    if (normalized === "selected" || normalized === "default") {
      return active ? preserveVariantCase(currentValue, "selected") : preserveVariantCase(currentValue, "default");
    }
    return active ? "on" : currentValue;
  }
  function preserveVariantCase(reference, value) {
    if (reference === reference.toUpperCase()) return value.toUpperCase();
    if (/^[A-Z]/.test(reference)) return value.charAt(0).toUpperCase() + value.slice(1);
    return value;
  }
  function writePropertiesSafe(instance, patch, warnings) {
    var _a, _b;
    const entries = Object.entries(patch);
    if (entries.length === 0) return [];
    const cleanPatch = Object.fromEntries(entries);
    try {
      (_a = instance.setProperties) == null ? void 0 : _a.call(instance, cleanPatch);
      return Object.keys(cleanPatch);
    } catch (e) {
      if (entries.length === 1) {
        const [propertyName, value] = entries[0];
        warnings.push(
          warning(
            "NAV_PROPERTY_WRITE_FAILED",
            `\u5BFC\u822A\u5C5E\u6027\u5199\u5165\u5931\u8D25\uFF1A${normalizeComponentPropertyName(propertyName)}=${String(value)}\u3002\u8BF7\u68C0\u67E5\u7EC4\u4EF6 variant \u662F\u5426\u5B58\u5728\u8BE5\u53D6\u503C\u7EC4\u5408\u3002`,
            instance
          )
        );
        return [];
      }
      const written = [];
      for (const [propertyName, value] of entries) {
        try {
          (_b = instance.setProperties) == null ? void 0 : _b.call(instance, { [propertyName]: value });
          written.push(propertyName);
        } catch (e2) {
          warnings.push(
            warning(
              "NAV_PROPERTY_WRITE_FAILED",
              `\u5BFC\u822A\u5C5E\u6027\u5199\u5165\u5931\u8D25\uFF1A${normalizeComponentPropertyName(propertyName)}=${String(value)}\u3002\u8BF7\u68C0\u67E5\u7EC4\u4EF6 variant \u662F\u5426\u5B58\u5728\u8BE5\u53D6\u503C\u7EC4\u5408\u3002`,
              instance
            )
          );
        }
      }
      return written;
    }
  }
  function collectNavigationItems(root) {
    const items = [];
    for (const node of walkScene(root)) {
      if (!isPageNavigationGroupName(readNodeName(node))) continue;
      if (hasPageNavigationGroupAncestor(node)) continue;
      items.push(...collectNavigationItemsFromGroup(node));
    }
    return items;
  }
  function collectNavigationItemsFromGroup(group) {
    const descendantItems = collectDescendantNavigationItems(group);
    if (descendantItems.length > 0) return descendantItems;
    const exposedItems = collectExposedNavigationItems(group);
    if (exposedItems.length > 0) return exposedItems;
    return collectLegacyNavigationGroupItem(group);
  }
  function isPageNavigationGroupName(name) {
    return name === "PAGE_NAV_group";
  }
  function hasPageNavigationGroupAncestor(node) {
    let parent = node.parent;
    while (parent) {
      if (isPageNavigationGroupName(readNodeName(parent))) return true;
      parent = parent.parent;
    }
    return false;
  }
  function collectExposedNavigationItems(group) {
    var _a;
    if (!isInstanceNode(group)) return [];
    const properties = readComponentProperties(group);
    const propertyNames = Object.keys(properties);
    const slotKeys = propertyNames.filter((name) => isExposedNavItemPropertyName(name));
    if (slotKeys.length === 0) return [];
    const groups = /* @__PURE__ */ new Map();
    for (const key of slotKeys) {
      const groupKey = getExposedNavItemGroupKey(key);
      const keys = (_a = groups.get(groupKey)) != null ? _a : [];
      keys.push(key);
      groups.set(groupKey, keys);
    }
    const result = [];
    for (const keys of groups.values()) {
      const kind = readNavigationKindFromProperties(properties, keys);
      if (!kind) continue;
      result.push({
        node: group,
        writeTargets: [{ instance: group, propertyNames: keys }],
        kind,
        kindCount: 0,
        logicalIndex: 0
      });
    }
    return result;
  }
  function collectDescendantNavigationItems(group) {
    const items = [];
    for (const node of walkScene(group, false)) {
      if (!isInstanceNode(node)) continue;
      if (readNodeName(node) !== "NAV_item" && !hasPageNavigationTextProperty(node)) continue;
      const kind = readNavigationKindFromInstance(node);
      if (!kind) continue;
      items.push({
        node,
        writeTargets: [{ instance: node }],
        kind,
        kindCount: 0,
        logicalIndex: 0
      });
    }
    return items;
  }
  function collectLegacyNavigationGroupItem(group) {
    const writableInstances = collectWritableInstances(group);
    for (const instance of writableInstances) {
      const kind = readNavigationKindFromInstance(instance);
      if (!kind) continue;
      return [
        {
          node: group,
          writeTargets: writableInstances.map((target) => ({ instance: target })),
          kind,
          kindCount: 0,
          logicalIndex: 0
        }
      ];
    }
    return [];
  }
  function readNavigationKindFromInstance(node) {
    var _a;
    const properties = readComponentProperties(node);
    const propertyNames = Object.keys(properties);
    const typeKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "TYPE");
    const value = typeKey ? properties[typeKey].value : void 0;
    return (_a = typeof value === "string" ? parseNavigationKindValue(value) : null) != null ? _a : readNavigationKindFromProperties(properties, propertyNames);
  }
  function readNavigationKindFromProperties(properties, propertyNames) {
    const typeKey = propertyNames.find((name) => normalizeNavigationPropertyName(name) === "TYPE");
    const typeValue = typeKey ? properties[typeKey].value : void 0;
    if (typeof typeValue === "string") {
      const kind = parseNavigationKindValue(typeValue);
      if (kind) return kind;
    }
    const normalizedNames = propertyNames.map((name) => normalizeNavigationPropertyName(name));
    if (normalizedNames.includes("PAGE_CHAPTER_TEXT")) return "CHAPTER";
    if (normalizedNames.includes("PAGE_TITLE_TEXT")) return "TITLE";
    if (normalizedNames.includes("PAGE_STEP_TEXT")) return "STEP";
    return null;
  }
  function parseNavigationKindValue(value) {
    const normalized = value.trim().toUpperCase();
    if (normalized === "CHAPTER" || normalized === "TITLE" || normalized === "STEP") return normalized;
    if (normalized === "PAGE_CHAPTER") return "CHAPTER";
    if (normalized === "PAGE_TITLE") return "TITLE";
    if (normalized === "PAGE_STEP") return "STEP";
    return null;
  }
  function collectWritableInstances(node) {
    const instances = [];
    if (isInstanceNode(node)) instances.push(node);
    for (const child of walkScene(node, false)) {
      if (isInstanceNode(child)) instances.push(child);
    }
    return instances;
  }
  function assignLogicalIndexes(items) {
    for (const kind of ["CHAPTER", "TITLE", "STEP"]) {
      const sameKind = items.filter((item) => item.kind === kind);
      sameKind.forEach((item) => {
        item.kindCount = sameKind.length;
      });
      const orderedNodes = sortByVisualOrder(sameKind.map((item) => item.node));
      orderedNodes.forEach((node, index) => {
        const item = sameKind.find((candidate) => candidate.node === node);
        if (item) item.logicalIndex = index + 1;
      });
    }
  }
  function warnForMissingNavigationGroups(items, page, document, warnings, node) {
    for (const kind of ["CHAPTER", "TITLE", "STEP"]) {
      const actual = items.filter((item) => item.kind === kind).length;
      const expected = expectedNavigationCount(kind, actual, page, document);
      if (actual < expected) {
        warnings.push(
          warning(
            "NAV_GROUP_INSUFFICIENT",
            `NAV_group \u6570\u91CF\u4E0D\u8DB3\uFF1A${kind} \u9700\u8981 ${String(expected)} \u4E2A\uFF0C\u5F53\u524D ${String(actual)} \u4E2A\u3002`,
            node
          )
        );
      }
    }
  }
  function expectedNavigationCount(kind, actual, page, document) {
    var _a, _b;
    const currentChapter = typeof page.chapterIndex === "number" ? getChapter(document, page.chapterIndex) : void 0;
    const currentTitle = currentChapter && typeof page.titleIndex === "number" ? getTitle(currentChapter, page.titleIndex) : void 0;
    if (kind === "CHAPTER") {
      if (typeof page.chapterIndex !== "number") return 0;
      return actual <= 1 ? 1 : document.chapters.length;
    }
    if (kind === "TITLE") {
      if (typeof page.titleIndex !== "number") return 0;
      return actual <= 1 ? 1 : (_a = currentChapter == null ? void 0 : currentChapter.titles.length) != null ? _a : 0;
    }
    if (typeof page.stepIndex !== "number") return 0;
    return actual <= 1 ? 1 : (_b = currentTitle == null ? void 0 : currentTitle.steps.length) != null ? _b : 0;
  }
  function resolveFrameNavigationContext(node, page) {
    var _a, _b;
    return (_b = (_a = parseFrameNavigationContext(readNodeName(node))) != null ? _a : parseFrameNavigationContext(page.frameName)) != null ? _b : { kind: null };
  }
  function parseFrameNavigationContext(frameName) {
    const match = /^\s*\d+\.(.+?)\s*$/.exec(frameName);
    if (!match) return null;
    const suffix = match[1].trim();
    const legacyKind = parseLegacyFrameKind(suffix);
    if (legacyKind) return { kind: legacyKind };
    const segments = suffix.split("/").map((segment) => segment.trim());
    if (segments[2]) return { kind: "STEP" };
    if (segments[1]) return { kind: "TITLE" };
    if (segments[0]) return { kind: "CHAPTER" };
    return null;
  }
  function parseLegacyFrameKind(suffix) {
    const normalized = suffix.toUpperCase();
    if (normalized === "CHAPTER" || normalized === "TITLE" || normalized === "STEP") return normalized;
    return null;
  }
  function resolveNavigationState(item, page, document, frameContext) {
    var _a, _b, _c, _d;
    const currentKind = (_a = frameContext.kind) != null ? _a : normalizePageKind(page.kind);
    if (item.kind === "CHAPTER") {
      const chapterIndex = item.kindCount === 1 && typeof page.chapterIndex === "number" ? page.chapterIndex : item.logicalIndex;
      const chapter2 = getChapter(document, chapterIndex);
      return {
        show: Boolean(chapter2),
        highlight: Boolean(currentKind) && page.chapterIndex === chapterIndex,
        label: (_b = chapter2 == null ? void 0 : chapter2.title) != null ? _b : ""
      };
    }
    const chapter = typeof page.chapterIndex === "number" ? getChapter(document, page.chapterIndex) : void 0;
    if (item.kind === "TITLE") {
      const titleIndex = item.kindCount === 1 && typeof page.titleIndex === "number" ? page.titleIndex : item.logicalIndex;
      const title2 = chapter ? getTitle(chapter, titleIndex) : void 0;
      return {
        show: Boolean(title2),
        highlight: (currentKind === "TITLE" || currentKind === "STEP") && page.titleIndex === titleIndex,
        label: (_c = title2 == null ? void 0 : title2.title) != null ? _c : ""
      };
    }
    const title = chapter && typeof page.titleIndex === "number" ? getTitle(chapter, page.titleIndex) : void 0;
    const stepIndex = item.kindCount === 1 && typeof page.stepIndex === "number" ? page.stepIndex : item.logicalIndex;
    const step = title ? getStep(title, stepIndex) : void 0;
    return {
      show: Boolean(step),
      highlight: currentKind === "STEP" && page.stepIndex === stepIndex,
      label: (_d = step == null ? void 0 : step.title) != null ? _d : ""
    };
  }
  function normalizePageKind(kind) {
    const normalized = String(kind).trim().toUpperCase();
    if (normalized === "CHAPTER" || normalized === "TITLE" || normalized === "STEP") return normalized;
    return null;
  }
  function getChapter(document, index) {
    if (index < 1 || index > document.chapters.length) return void 0;
    return document.chapters[index - 1];
  }
  function getTitle(chapter, index) {
    if (index < 1 || index > chapter.titles.length) return void 0;
    return chapter.titles[index - 1];
  }
  function getStep(title, index) {
    if (index < 1 || index > title.steps.length) return void 0;
    return title.steps[index - 1];
  }
  function buildNavigationTextPatch(item, label, propertyNames) {
    const targetsByKind = {
      CHAPTER: ["PAGE_CHAPTER_TEXT", "PAGE_CHAPTER_TEXT (HUGE)", "TOC_CHAPTER_TEXT"],
      TITLE: ["PAGE_TITLE_TEXT", "TOC_TITLE_TEXT"],
      STEP: ["PAGE_STEP_TEXT"]
    };
    const patch = {};
    for (const rawName of propertyNames) {
      const name = normalizeNavigationPropertyName(rawName);
      if (targetsByKind[item.kind].includes(name)) patch[rawName] = label;
      if (name === "TOC_NUM_TEXT" && item.kind === "CHAPTER") patch[rawName] = formatTwoDigit(item.logicalIndex);
    }
    return patch;
  }
  function hasPageNavigationTextProperty(instance) {
    return Object.keys(readComponentProperties(instance)).some(
      (name) => ["PAGE_CHAPTER_TEXT", "PAGE_CHAPTER_TEXT (HUGE)", "PAGE_TITLE_TEXT", "PAGE_STEP_TEXT"].includes(normalizeNavigationPropertyName(name))
    );
  }
  function isExposedNavItemPropertyName(name) {
    const normalized = normalizeComponentPropertyName(name);
    return normalized.includes("/") && normalized.split(/[/.]/).some((part) => part.trim() === "NAV_item");
  }
  function getExposedNavItemGroupKey(name) {
    const normalized = normalizeComponentPropertyName(name);
    const slashIndex = normalized.lastIndexOf("/");
    if (slashIndex < 0) return normalized;
    return normalized.slice(0, slashIndex);
  }
  function normalizeNavigationPropertyName(name) {
    var _a, _b;
    const normalized = normalizeComponentPropertyName(name);
    return (_b = (_a = normalized.split(/[/.]/).pop()) == null ? void 0 : _a.trim()) != null ? _b : normalized;
  }

  // src/figma/toc-expander.ts
  function expandAndInjectToc(input) {
    const warnings = [];
    const rows = buildTocRows(input.document, input.chapterRanges);
    const navGroups = collectTocNavGroups(input.tocNode);
    if (navGroups.length === 0) {
      return {
        expandedCount: 0,
        writtenCount: 0,
        warnings: [warning("TOC_NAV_GROUP_MISSING", "TOC \u8282\u70B9\u4E2D\u7F3A\u5C11 TOC_NAV_group\uFF0C\u65E0\u6CD5\u6269\u5C55\u76EE\u5F55\u884C\u3002", input.tocNode)]
      };
    }
    const expandedCount = ensureRowCapacity(navGroups, rows.length, warnings);
    const availableRows = collectTocNavGroups(input.tocNode);
    let writtenCount = 0;
    for (let index = 0; index < availableRows.length; index += 1) {
      writtenCount += index < rows.length ? injectTocRow(availableRows[index], rows[index], warnings) : hideTocGroup(availableRows[index], warnings);
    }
    return { expandedCount, writtenCount, warnings };
  }
  function collectTocNavGroups(root) {
    return sortByVisualOrder(walkScene(root).filter((node) => isTocNavigationGroupName(readNodeName(node))));
  }
  function isTocNavigationGroupName(name) {
    return name === "TOC_NAV_group";
  }
  function buildTocRows(document, chapterRanges) {
    return document.chapters.map((chapter) => {
      var _a;
      return {
        chapterIndex: chapter.index,
        chapterTitle: chapter.title,
        titles: chapter.titles.map((title) => title.title),
        numText: String(chapter.index).padStart(2, "0"),
        pageRangeText: (_a = chapterRanges[chapter.index]) != null ? _a : ""
      };
    });
  }
  function ensureRowCapacity(navGroups, requiredCount, warnings) {
    var _a, _b, _c;
    if (requiredCount <= navGroups.length) return 0;
    const source = navGroups[navGroups.length - 1];
    if (typeof source.clone !== "function") {
      warnings.push(warning("TOC_NAV_GROUP_CLONE_FAILED", "TOC_NAV_group \u4E0D\u652F\u6301 clone()\uFF0C\u65E0\u6CD5\u81EA\u52A8\u6269\u5C55\u76EE\u5F55\u3002", source));
      return 0;
    }
    const parent = source.parent;
    if (!parent || typeof parent.appendChild !== "function") {
      warnings.push(warning("TOC_NAV_GROUP_PARENT_MISSING", "TOC_NAV_group \u7F3A\u5C11\u53EF\u8FFD\u52A0\u5B50\u8282\u70B9\u7684\u7236\u7EA7\uFF0C\u65E0\u6CD5\u81EA\u52A8\u6269\u5C55\u76EE\u5F55\u3002", source));
      return 0;
    }
    const offset = calculateCloneOffset(navGroups, { x: 0, y: ((_a = source.height) != null ? _a : 24) + 8 });
    let expandedCount = 0;
    let lastRow = source;
    while (navGroups.length < requiredCount) {
      try {
        const clone = source.clone();
        clone.name = readNodeName(source);
        clone.x = (_b = source.x) != null ? _b : 0;
        clone.y = ((_c = lastRow.y) != null ? _c : 0) + offset.y;
        parent.appendChild(clone);
        navGroups.push(clone);
        lastRow = clone;
        expandedCount += 1;
      } catch (e) {
        warnings.push(warning("TOC_NAV_GROUP_CLONE_FAILED", "TOC_NAV_group \u590D\u5236\u5931\u8D25\uFF0C\u76EE\u5F55\u6269\u5C55\u5DF2\u505C\u6B62\u3002", source));
        break;
      }
    }
    return expandedCount;
  }
  function injectTocRow(rowNode, row, warnings) {
    var _a;
    let writtenCount = 0;
    for (const node of walkScene(rowNode)) {
      if (!isInstanceNode(node)) continue;
      const properties = readComponentProperties(node, warnings);
      const patch = {};
      const hasRowMetadata = hasAnyProperty(node, ["TOC_CHAPTER_TEXT", "TOC_NUM_TEXT", "TOC_PAGE_RANGE_TEXT"]);
      for (const rawName of Object.keys(properties)) {
        const name = normalizeTocPropertyName(rawName);
        if (name === "TOC_CHAPTER_TEXT") patch[rawName] = row.chapterTitle;
        if (name === "TOC_NUM_TEXT") patch[rawName] = row.numText;
        if (name === "TOC_PAGE_RANGE_TEXT") patch[rawName] = row.pageRangeText;
        if (name === "SHOW" && (hasRowMetadata || !hasProperty(node, "TOC_TITLE_TEXT"))) patch[rawName] = true;
      }
      writtenCount += writeInstancePatch(node, patch, warnings);
    }
    const initialTitleTargets = collectTitleTargets(rowNode);
    ensureTitleTargetCapacity(initialTitleTargets, row.titles.length, warnings);
    const titleTargets = collectTitleTargets(rowNode);
    for (let index = 0; index < titleTargets.length; index += 1) {
      const title = (_a = row.titles[index]) != null ? _a : "";
      writtenCount += writeTitleTarget(titleTargets[index], title, index < row.titles.length, warnings);
    }
    return writtenCount;
  }
  function collectTitleTargets(rowNode) {
    const instances = sortByVisualOrder(walkScene(rowNode).filter((node) => isInstanceNode(node)));
    const dedicatedInstances = instances.filter(
      (node) => hasProperty(node, "TOC_TITLE_TEXT") && !hasAnyProperty(node, ["TOC_CHAPTER_TEXT", "TOC_NUM_TEXT", "TOC_PAGE_RANGE_TEXT"])
    );
    const targetInstances = dedicatedInstances.length > 0 ? dedicatedInstances : instances.filter((node) => hasProperty(node, "TOC_TITLE_TEXT"));
    return targetInstances.flatMap((instance) => {
      const properties = readComponentProperties(instance);
      const hasRowMetadata = hasAnyProperty(instance, ["TOC_CHAPTER_TEXT", "TOC_NUM_TEXT", "TOC_PAGE_RANGE_TEXT"]);
      const showKey = hasRowMetadata ? void 0 : Object.keys(properties).find((name) => normalizeTocPropertyName(name) === "SHOW");
      return Object.keys(properties).filter((name) => normalizeTocPropertyName(name) === "TOC_TITLE_TEXT").map((textKey) => ({ instance, textKey, showKey }));
    });
  }
  function ensureTitleTargetCapacity(targets, requiredCount, warnings) {
    if (requiredCount <= targets.length) return 0;
    if (targets.length === 0) {
      if (requiredCount > 0) warnings.push(warning("TOC_TITLE_SLOT_MISSING", "TOC_NAV_group \u4E2D\u7F3A\u5C11 TOC_TITLE_TEXT \u6807\u9898\u69FD\u4F4D\u3002"));
      return 0;
    }
    const source = targets[targets.length - 1];
    const candidates = findTitleCloneCandidates(source.instance);
    if (candidates.length === 0) {
      warnings.push(warning("TOC_TITLE_SLOT_CLONE_FAILED", "TOC_TITLE_TEXT \u6807\u9898\u69FD\u4F4D\u7F3A\u5C11\u53EF\u590D\u5236\u5BB9\u5668\uFF0C\u65E0\u6CD5\u81EA\u52A8\u6269\u5C55\u3002", source.instance));
      return 0;
    }
    for (const candidate of candidates) {
      const expandedCount = expandTitleTargetsWithCandidate(targets, requiredCount, candidate);
      if (targets.length >= requiredCount) return expandedCount;
    }
    warnings.push(warning("TOC_TITLE_SLOT_CLONE_FAILED", "TOC_TITLE_TEXT \u6807\u9898\u69FD\u4F4D\u590D\u5236\u5931\u8D25\uFF0C\u76EE\u5F55\u6807\u9898\u6269\u5C55\u5DF2\u505C\u6B62\u3002", source.instance));
    return 0;
  }
  function findTitleCloneCandidates(instance) {
    const candidates = [];
    let current = instance;
    while (current) {
      const parent = getParent(current);
      if (typeof current.clone === "function" && parent && isChildrenNode(parent)) {
        candidates.push({ node: current, parent });
      }
      current = parent;
    }
    return candidates;
  }
  function getParent(node) {
    var _a;
    return (_a = node.parent) != null ? _a : null;
  }
  function expandTitleTargetsWithCandidate(targets, requiredCount, candidate) {
    var _a, _b, _c, _d, _e;
    const candidateTargets = targets.map((target) => getCloneCandidateNode(target.instance, candidate.node)).filter((node) => node !== null);
    const offset = calculateCloneOffset(candidateTargets, { x: ((_a = candidate.node.width) != null ? _a : 80) + 24, y: 0 });
    let expandedCount = 0;
    let lastSlot = candidate.node;
    while (targets.length < requiredCount) {
      try {
        const clone = (_c = (_b = candidate.node).clone) == null ? void 0 : _c.call(_b);
        if (!clone) throw new Error("clone unavailable");
        clone.name = readNodeName(candidate.node);
        clone.x = ((_d = lastSlot.x) != null ? _d : 0) + offset.x;
        clone.y = ((_e = lastSlot.y) != null ? _e : 0) + offset.y;
        candidate.parent.appendChild(clone);
        targets.push(...collectTitleTargets(clone));
        lastSlot = clone;
        expandedCount += 1;
      } catch (e) {
        return expandedCount;
      }
    }
    return expandedCount;
  }
  function getCloneCandidateNode(instance, reference) {
    let current = instance;
    while (current) {
      if (current.parent === reference.parent && readNodeName(current) === readNodeName(reference)) return current;
      current = current.parent;
    }
    return null;
  }
  function writeTitleTarget(target, title, visible, warnings) {
    const patch = {};
    patch[target.textKey] = title;
    if (target.showKey) patch[target.showKey] = visible;
    return writeInstancePatch(target.instance, patch, warnings);
  }
  function hideTocGroup(rowNode, warnings) {
    let writtenCount = 0;
    for (const node of walkScene(rowNode)) {
      if (!isInstanceNode(node)) continue;
      const properties = readComponentProperties(node, warnings);
      const patch = {};
      for (const rawName of Object.keys(properties)) {
        const name = normalizeTocPropertyName(rawName);
        if (name === "SHOW") patch[rawName] = false;
        if (name === "TOC_CHAPTER_TEXT" || name === "TOC_TITLE_TEXT" || name === "TOC_NUM_TEXT" || name === "TOC_PAGE_RANGE_TEXT") {
          patch[rawName] = "";
        }
      }
      writtenCount += writeInstancePatch(node, patch, warnings);
    }
    return writtenCount;
  }
  function hasProperty(instance, wantedName) {
    return Object.keys(readComponentProperties(instance)).some((name) => normalizeTocPropertyName(name) === wantedName);
  }
  function hasAnyProperty(instance, wantedNames) {
    return wantedNames.some((name) => hasProperty(instance, name));
  }
  function normalizeTocPropertyName(name) {
    var _a, _b;
    const normalized = normalizeComponentPropertyName(name);
    return (_b = (_a = normalized.split(/[/.]/).pop()) == null ? void 0 : _a.trim()) != null ? _b : normalized;
  }
  function calculateCloneOffset(nodes, fallback) {
    var _a, _b, _c, _d;
    if (nodes.length >= 2) {
      const sorted = sortByVisualOrder(nodes);
      const first = sorted[sorted.length - 2];
      const second = sorted[sorted.length - 1];
      const x = ((_a = second.x) != null ? _a : 0) - ((_b = first.x) != null ? _b : 0);
      const y = ((_c = second.y) != null ? _c : 0) - ((_d = first.y) != null ? _d : 0);
      if (x !== 0 || y !== 0) return { x, y };
    }
    return fallback;
  }
  function writeInstancePatch(instance, patch, warnings) {
    var _a;
    if (Object.keys(patch).length === 0) return 0;
    try {
      (_a = instance.setProperties) == null ? void 0 : _a.call(instance, patch);
      return Object.keys(patch).length;
    } catch (e) {
      warnings.push(warning("TOC_ROW_WRITE_FAILED", `TOC \u884C\u5199\u5165\u5931\u8D25\uFF1A${readNodeName(instance)}`, instance));
      return 0;
    }
  }

  // src/main.ts
  figma.showUI(__html__, { width: 520, height: 700, themeColors: true });
  figma.ui.onmessage = (message) => {
    void handleUiMessage(message);
  };
  function handleUiMessage(message) {
    return __async(this, null, function* () {
      try {
        if (message.type === "RESIZE_UI") {
          figma.ui.resize(clampUiSize(message.width, 380, 1200), clampUiSize(message.height, 460, 1e3));
          return;
        }
        if (message.type === "SCAN_TEMPLATES") {
          const result = yield scanCurrentPageTemplates();
          postToUi({ type: "TEMPLATES_SCANNED", templates: result.templates, warnings: result.warnings });
          return;
        }
        if (message.type === "SCAN_FILE_COMPONENT_PROPERTIES") {
          const result = yield scanCurrentFileComponentProperties();
          postToUi({ type: "FILE_COMPONENT_PROPERTIES_SCANNED", properties: result.properties, warnings: result.warnings });
          return;
        }
        if (message.type === "PARSE_OUTLINE") {
          const parsed = parseOutline(message.markdown);
          postToUi({
            type: "OUTLINE_PARSED",
            document: parsed.document,
            summary: analyzeOutline(parsed.document)
          });
          return;
        }
        const report = yield generateFromOutline(message.markdown, message.templateMapping, message.propertyMapping);
        postToUi({ type: "GENERATION_DONE", report });
      } catch (error) {
        postToUi({
          type: "ERROR",
          message: error instanceof Error ? error.message : "\u63D2\u4EF6\u6267\u884C\u5931\u8D25",
          details: error instanceof Error ? error.stack : String(error)
        });
      }
    });
  }
  function postToUi(message) {
    figma.ui.postMessage(message);
  }
  function clampUiSize(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, Math.round(value)));
  }
  function scanCurrentPageTemplates() {
    return __async(this, null, function* () {
      yield loadCurrentPageIfNeeded();
      const result = scanTemplates({ currentPage: getCurrentPage() });
      return {
        templates: result.templates,
        warnings: result.warnings.map((item) => toAppWarning("template", item))
      };
    });
  }
  function scanCurrentFileComponentProperties() {
    return __async(this, null, function* () {
      const result = yield scanFileComponentProperties(createRuntime(getCurrentPage()));
      return {
        properties: result.properties,
        warnings: result.warnings.map((item) => toAppWarning("template", item))
      };
    });
  }
  function generateFromOutline(markdown, selectedTemplateIds, propertyMapping) {
    return __async(this, null, function* () {
      var _a, _b;
      yield loadCurrentPageIfNeeded();
      const parsed = parseOutline(markdown);
      const summary = analyzeOutline(parsed.document);
      const scan = yield scanCurrentPageTemplates();
      const templateMapping = mapTemplates({
        requiredPageKinds: summary.requiredPageKinds,
        templates: scan.templates,
        selectedTemplateIds: withKindDefaults(summary.requiredPageKinds, scan.templates, selectedTemplateIds)
      });
      const plan = createPagePlan({
        document: parsed.document,
        templateMapping: templateMapping.mapping
      });
      const pagination = applyPagination(plan.pages);
      const pages = pagination.pages.map((page) => Object.assign({}, page, { frameName: createFrameName(page) }));
      const layout = calculateLayout({
        pages,
        templateSizes: Object.fromEntries(scan.templates.map((template) => [template.id, template]))
      });
      const warnings = [];
      pushAll2(warnings, parsed.warnings);
      pushAll2(warnings, scan.warnings);
      pushAll2(warnings, templateMapping.warnings);
      pushAll2(warnings, plan.warnings);
      pushAll2(warnings, layout.warnings);
      if (pages.length === 0) {
        return withCreatedByKind(
          buildGenerationReport({
            createdSectionId: null,
            createdCount: 0,
            removedCount: 0,
            skippedPages: plan.skippedPages,
            warnings,
            tocExpandedCount: 0,
            selectedNodeIds: []
          }),
          []
        );
      }
      const currentPage = getCurrentPage();
      const runtime = createRuntime(currentPage);
      const sectionResult = prepareGeneratedSection({
        currentPage,
        sectionName: DEFAULT_GENERATED_SECTION_NAME,
        figma: runtime
      });
      pushAll2(warnings, sectionResult.warnings.map((item) => toAppWarning("generation", item)));
      const createdPages = [];
      const createdNodes = [];
      let tocExpandedCount = 0;
      for (const page of pages) {
        const template = templateMapping.mapping[page.kind];
        if (!template) continue;
        const templateNode = (_a = runtime.getNodeById) == null ? void 0 : _a.call(runtime, template.id);
        const placement = (_b = layout.placements[page.id]) != null ? _b : { x: 0, y: 0 };
        const nodeResult = createNodeFromTemplate({
          page,
          template,
          section: sectionResult.section,
          placement,
          templateNode: templateNode != null ? templateNode : void 0,
          figma: runtime
        });
        pushAll2(warnings, nodeResult.warnings.map((item) => toAppWarning("generation", item, page)));
        if (!nodeResult.node) continue;
        createdPages.push(page);
        createdNodes.push(nodeResult.node);
        const injection = yield injectProperties({
          node: nodeResult.node,
          page,
          chapterRanges: pagination.chapterRanges,
          propertyMapping,
          figma: runtime
        });
        pushAll2(warnings, injection.warnings.map((item) => toAppWarning("injection", item, page)));
        pushAll2(
          warnings,
          injection.missingProperties.map((propertyName) => ({
            source: "injection",
            code: "MISSING_PROPERTY",
            message: `${page.frameName} \u7F3A\u5C11\u53EF\u6CE8\u5165\u5C5E\u6027\uFF1A${propertyName}`,
            severity: "info",
            pageKind: page.kind,
            pageId: page.id,
            propertyName
          }))
        );
        const navigation = injectNavigation({ node: nodeResult.node, page, document: parsed.document });
        pushAll2(warnings, navigation.warnings.map((item) => toAppWarning("navigation", item, page)));
        if (page.kind === "TOC") {
          const toc = expandAndInjectToc({
            tocNode: nodeResult.node,
            document: parsed.document,
            chapterRanges: pagination.chapterRanges
          });
          tocExpandedCount += toc.expandedCount;
          pushAll2(warnings, toc.warnings.map((item) => toAppWarning("toc", item, page)));
        }
      }
      pushAll2(warnings, fitSectionToNodes(sectionResult.section, createdNodes).map((item) => toAppWarning("generation", item)));
      selectGeneratedSection(sectionResult.section, currentPage);
      scrollToGeneratedSection(sectionResult.section);
      return withCreatedByKind(
        buildGenerationReport({
          createdSectionId: sectionResult.section.id,
          createdCount: createdNodes.length,
          removedCount: sectionResult.removedCount,
          skippedPages: plan.skippedPages.concat(
            pages.filter((page) => !createdPages.includes(page)).map((page) => ({
              id: page.id,
              kind: page.kind,
              reason: "generation-failed",
              chapterIndex: page.chapterIndex,
              titleIndex: page.titleIndex,
              stepIndex: page.stepIndex
            }))
          ),
          warnings,
          tocExpandedCount,
          selectedNodeIds: [sectionResult.section.id]
        }),
        createdPages
      );
    });
  }
  function withKindDefaults(requiredKinds, templates, selectedTemplateIds) {
    var _a, _b;
    const mapping = Object.assign({}, selectedTemplateIds);
    for (const kind of requiredKinds) {
      mapping[kind] = (_b = mapping[kind]) != null ? _b : (_a = templates.find((template) => template.kindGuess === kind)) == null ? void 0 : _a.id;
    }
    return mapping;
  }
  function withCreatedByKind(report, pages) {
    return Object.assign({}, report, {
      createdByKind: pages.reduce((counts, page) => {
        var _a;
        counts[page.kind] = ((_a = counts[page.kind]) != null ? _a : 0) + 1;
        return counts;
      }, {})
    });
  }
  function toAppWarning(source, warning2, page) {
    var _a;
    return {
      source,
      code: warning2.code,
      message: warning2.message,
      severity: (_a = warning2.severity) != null ? _a : "warning",
      pageKind: page == null ? void 0 : page.kind,
      pageId: page == null ? void 0 : page.id,
      details: {
        nodeId: warning2.nodeId,
        nodeName: warning2.nodeName
      }
    };
  }
  function getCurrentPage() {
    return figma.currentPage;
  }
  function createRuntime(currentPage) {
    return {
      currentPage,
      root: figma.root,
      createSection: () => figma.createSection(),
      getNodeById: (id) => findNodeById(currentPage, id),
      loadFontAsync: (fontName) => figma.loadFontAsync(fontName),
      loadAllPagesAsync: () => figma.loadAllPagesAsync()
    };
  }
  function findNodeById(currentPage, id) {
    var _a, _b;
    return (_b = (_a = currentPage.findAll) == null ? void 0 : _a.call(currentPage, (node) => node.id === id)[0]) != null ? _b : null;
  }
  function pushAll2(target, source) {
    for (const item of source) target.push(item);
  }
  function loadCurrentPageIfNeeded() {
    return __async(this, null, function* () {
      const maybeLoadablePage = figma.currentPage;
      if (typeof maybeLoadablePage.loadAsync === "function") {
        yield maybeLoadablePage.loadAsync();
      }
    });
  }
  function scrollToGeneratedSection(section) {
    const node = section;
    figma.viewport.scrollAndZoomIntoView([node]);
  }
})();
