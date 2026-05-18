/* eslint-disable @typescript-eslint/no-confusing-void-expression, @typescript-eslint/prefer-regexp-exec */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOutline2PageUiController } from "../../src/ui/ui-controller";

type FakeEvent = {
  target: FakeElement | { dataset: { action: string } };
  clientX: number;
  clientY: number;
  preventDefault: () => void;
};

type Listener = (event: FakeEvent) => void;

class FakeElement {
  textContent = "";
  innerHTML = "";
  value = "";
  disabled = false;
  hidden = false;
  private listeners = new Map<string, Listener[]>();

  addEventListener(eventName: string, listener: Listener) {
    this.listeners.set(eventName, [...(this.listeners.get(eventName) ?? []), listener]);
  }

  dispatch(eventName: string) {
    (this.listeners.get(eventName) ?? []).forEach((listener) =>
      listener({ target: this, clientX: 0, clientY: 0, preventDefault: vi.fn() }),
    );
  }

  dispatchMouse(eventName: string, clientX: number, clientY: number) {
    (this.listeners.get(eventName) ?? []).forEach((listener) =>
      listener({ target: this, clientX, clientY, preventDefault: vi.fn() }),
    );
  }

  click() {
    this.dispatch("click");
  }

  clickWithDatasetAction(action: string) {
    const target = { dataset: { action } } as unknown as FakeElement;
    (this.listeners.get("click") ?? []).forEach((listener) =>
      listener({ target, clientX: 0, clientY: 0, preventDefault: vi.fn() }),
    );
  }

  querySelector(selector: string): FakeElement | null {
    const kindMatch = selector.match(/select\[data-kind="(.+?)"\]/);
    if (kindMatch) return this.findSelectedValue("kind", kindMatch[1]);

    const fieldMatch = selector.match(/input\[data-field="(.+?)"\]/);
    if (fieldMatch) return this.findInputValue(fieldMatch[1]);

    return null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    const checkedFieldMatch = selector.match(/input\[data-field="(.+?)"\]:checked/);
    if (!checkedFieldMatch) return [];

    const field = checkedFieldMatch[1];
    const inputMatches = this.innerHTML.matchAll(
      new RegExp(`<input[^>]+data-field="${escapeRegExp(field)}"[^>]+value="([^"]+)"[^>]*checked`, "g"),
    );
    return Array.from(inputMatches).map((match) => {
      const element = new FakeElement();
      element.value = match[1];
      return element;
    });
  }

  private findSelectedValue(dataName: "kind", value: string): FakeElement | null {
    const selectMatch = this.innerHTML.match(
      new RegExp(`<select data-${dataName}="${escapeRegExp(value)}">([\\s\\S]*?)<\\/select>`),
    );
    if (!selectMatch) return null;

    const selectedOption =
      selectMatch[1].match(/<option value="([^"]+)" selected>/) ?? selectMatch[1].match(/<option value="([^"]*)">/);
    const element = new FakeElement();
    element.value = selectedOption?.[1] ?? "";
    return element;
  }

  private findInputValue(field: string): FakeElement | null {
    const inputMatch = this.innerHTML.match(new RegExp(`<input[^>]+data-field="${escapeRegExp(field)}"[^>]+>`));
    if (!inputMatch) return null;

    const valueMatch = inputMatch[0].match(/value="([^"]*)"/);
    const element = new FakeElement();
    element.value = valueMatch?.[1] ?? "";
    return element;
  }
}

class FakeWindow {
  innerWidth = 520;
  innerHeight = 700;
  private listeners = new Map<string, Listener[]>();

  addEventListener(eventName: string, listener: Listener) {
    this.listeners.set(eventName, [...(this.listeners.get(eventName) ?? []), listener]);
  }

  removeEventListener(eventName: string, listener: Listener) {
    this.listeners.set(
      eventName,
      (this.listeners.get(eventName) ?? []).filter((item) => item !== listener),
    );
  }

  dispatchMouse(eventName: string, clientX: number, clientY: number) {
    (this.listeners.get(eventName) ?? []).forEach((listener) =>
      listener({ target: new FakeElement(), clientX, clientY, preventDefault: vi.fn() }),
    );
  }
}

class FakeDocument {
  private elements = new Map<string, FakeElement>();
  defaultView = new FakeWindow();

  constructor() {
    [
      "#markdown",
      "#scanButton",
      "#generateButton",
      "#templateCount",
      "#parseStatus",
      "#stats",
      "#tree",
      "#selectors",
      "#properties",
      "#fileProperties",
      "#warnings",
      "#report",
      "#error",
      "#resizeHandle",
    ].forEach((selector) => this.elements.set(selector, new FakeElement()));
  }

  querySelector(selector: string): FakeElement | null {
    return this.elements.get(selector) ?? null;
  }

  get(selector: string): FakeElement {
    const element = this.elements.get(selector);
    if (!element) throw new Error(`缺少测试节点：${selector}`);
    return element;
  }
}

function mountUi() {
  return new FakeDocument();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const templates = [
  {
    id: "cover-template",
    name: "PAGE_TEMP：COVER",
    kindGuess: "COVER",
    nodeType: "FRAME",
    width: 1440,
    height: 900,
    propertyNames: ["COVER_VERSION_TEXT", "PAGE_VERSION_TEXT"],
    textLayerNames: ["COVER_VERSION_TEXT"],
  },
  {
    id: "chapter-template",
    name: "PAGE_TEMP：CHAPTER",
    kindGuess: "CHAPTER",
    nodeType: "FRAME",
    width: 1440,
    height: 900,
    propertyNames: [
      "PAGE_CHAPTER_TEXT",
      "PAGE_CHAPTER_TEXT (HUGE)",
      "PAGE_PAGE_TEXT",
      "PAGE_TITLE_TEXT",
      "PAGE_STEP_TEXT",
      "TOC_NUM_TEXT",
      "TOC_PAGE_RANGE_TEXT",
    ],
    textLayerNames: ["Page_Chapter", "Page_Title", "Page_page"],
  },
];

describe("Plugin UI bridge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("打开 UI 时自动请求扫描模板", () => {
    const sent: unknown[] = [];
    const fakeDocument = mountUi();

    createOutline2PageUiController({
      root: fakeDocument as unknown as Document,
      postMessage: (message) => sent.push(message),
    });

    expect(sent).toEqual([{ type: "SCAN_TEMPLATES" }]);
  });

  it("粘贴 Markdown 后发送解析请求并渲染预览", () => {
    const sent: unknown[] = [];
    const fakeDocument = mountUi();
    const controller = createOutline2PageUiController({
      root: fakeDocument as unknown as Document,
      postMessage: (message) => sent.push(message),
      debounceMs: 10,
    });

    const markdown = "《演示》\n# TOC\n## 第一章";
    const textarea = fakeDocument.get("#markdown");
    textarea.value = markdown;
    textarea.dispatch("input");
    vi.advanceTimersByTime(10);

    expect(sent).toContainEqual({ type: "PARSE_OUTLINE", markdown });

    controller.receive({
      type: "OUTLINE_PARSED",
      document: {
        vision: "演示",
        hasToc: true,
        warnings: [],
        chapters: [{ id: "chapter-1", index: 1, title: "第一章", sourceLine: 3, titles: [] }],
      },
      summary: {
        vision: "演示",
        chapterCount: 1,
        titleCount: 0,
        stepCount: 0,
        estimatedPageCount: 3,
        requiredPageKinds: ["COVER", "CHAPTER"],
      },
    });

    expect(fakeDocument.get("#parseStatus").textContent).toBe("3 页待生成");
    expect(fakeDocument.get("#tree").innerHTML).toContain("CHAPTER 01");
  });

  it("根据 requiredPageKinds 和模板扫描结果发送生成消息", () => {
    const sent: unknown[] = [];
    const fakeDocument = mountUi();
    const controller = createOutline2PageUiController({
      root: fakeDocument as unknown as Document,
      postMessage: (message) => sent.push(message),
    });

    controller.receive({ type: "TEMPLATES_SCANNED", templates, warnings: [] });
    controller.receive({
      type: "OUTLINE_PARSED",
      document: {
        vision: "演示",
        hasToc: false,
        warnings: [],
        chapters: [{ id: "chapter-1", index: 1, title: "第一章", sourceLine: 2, titles: [] }],
      },
      summary: {
        vision: "演示",
        chapterCount: 1,
        titleCount: 0,
        stepCount: 0,
        estimatedPageCount: 2,
        requiredPageKinds: ["COVER", "CHAPTER"],
      },
    });

    const textarea = fakeDocument.get("#markdown");
    textarea.value = "《演示》\n## 第一章";
    fakeDocument.get("#generateButton").click();

    expect(sent).toContainEqual({
      type: "GENERATE",
      markdown: "《演示》\n## 第一章",
      templateMapping: {
        COVER: "cover-template",
        CHAPTER: "chapter-template",
      },
      propertyMapping: {
        vision: ["COVER_VERSION_TEXT", "PAGE_VERSION_TEXT"],
        chapterTitle: ["PAGE_CHAPTER_TEXT", "PAGE_CHAPTER_TEXT (HUGE)"],
        titleText: ["PAGE_TITLE_TEXT"],
        stepText: ["PAGE_STEP_TEXT"],
        pageNumber: ["PAGE_PAGE_TEXT"],
        tocNumber: ["TOC_NUM_TEXT"],
        tocPageRange: ["TOC_PAGE_RANGE_TEXT"],
      },
    });
    expect(fakeDocument.get("#generateButton").disabled).toBe(true);
  });

  it("用中文字段渲染字段映射下拉，并从扫描结果收集映射", () => {
    const fakeDocument = mountUi();
    const controller = createOutline2PageUiController({
      root: fakeDocument as unknown as Document,
      postMessage: vi.fn(),
    });

    controller.receive({ type: "TEMPLATES_SCANNED", templates, warnings: [] });

    expect(fakeDocument.get("#properties").innerHTML).toContain("封面主题");
    expect(fakeDocument.get("#properties").innerHTML).toContain("目录页码范围");
    expect(fakeDocument.get("#properties").innerHTML).toContain('data-field="vision"');
    expect(fakeDocument.get("#properties").innerHTML).toContain('type="text"');
    expect(fakeDocument.get("#properties").innerHTML).toContain("PAGE_CHAPTER_TEXT + PAGE_CHAPTER_TEXT (HUGE)");
    expect(fakeDocument.get("#properties").innerHTML).toContain("COVER_VERSION_TEXT");
    expect(fakeDocument.get("#properties").innerHTML).toContain(">COVER_<");
    expect(fakeDocument.get("#properties").innerHTML).toContain(">PAGE_<");
    expect(fakeDocument.get("#properties").innerHTML).toContain(">TOC_<");
    expect(fakeDocument.get("#properties").innerHTML.indexOf(">COVER_<")).toBeLessThan(
      fakeDocument.get("#properties").innerHTML.indexOf(">TOC_<"),
    );
    expect(fakeDocument.get("#properties").innerHTML.indexOf(">TOC_<")).toBeLessThan(
      fakeDocument.get("#properties").innerHTML.indexOf(">PAGE_<"),
    );
    expect(fakeDocument.get("#properties").innerHTML).not.toContain("Page_Chapter");
  });

  it("可以请求扫描当前文件全部组件属性并渲染结果", () => {
    const sent: unknown[] = [];
    const fakeDocument = mountUi();
    const controller = createOutline2PageUiController({
      root: fakeDocument as unknown as Document,
      postMessage: (message) => sent.push(message),
    });

    fakeDocument.get("#fileProperties").clickWithDatasetAction("scan-file-properties");

    expect(sent).toContainEqual({ type: "SCAN_FILE_COMPONENT_PROPERTIES" });

    controller.receive({
      type: "FILE_COMPONENT_PROPERTIES_SCANNED",
      properties: [{ name: "PAGE_TITLE_TEXT", count: 3, nodeNames: ["Card"], types: ["TEXT"] }],
      warnings: [],
    });

    expect(fakeDocument.get("#fileProperties").innerHTML).toContain("PAGE_TITLE_TEXT");
    expect(fakeDocument.get("#fileProperties").innerHTML).toContain("3 处");
  });

  it("拖拽右下角手柄时发送面板尺寸调整消息", () => {
    const sent: unknown[] = [];
    const fakeDocument = mountUi();
    createOutline2PageUiController({
      root: fakeDocument as unknown as Document,
      postMessage: (message) => sent.push(message),
    });

    fakeDocument.get("#resizeHandle").dispatchMouse("mousedown", 520, 700);
    fakeDocument.defaultView.dispatchMouse("mousemove", 580, 740);

    expect(sent).toContainEqual({ type: "RESIZE_UI", width: 580, height: 740 });
  });

  it("主线程异常时展示错误并恢复生成按钮", () => {
    const fakeDocument = mountUi();
    const controller = createOutline2PageUiController({
      root: fakeDocument as unknown as Document,
      postMessage: vi.fn(),
    });

    controller.receive({
      type: "OUTLINE_PARSED",
      document: { vision: "演示", hasToc: false, warnings: [], chapters: [] },
      summary: {
        vision: "演示",
        chapterCount: 0,
        titleCount: 0,
        stepCount: 0,
        estimatedPageCount: 1,
        requiredPageKinds: ["COVER"],
      },
    });

    fakeDocument.get("#generateButton").click();
    controller.receive({ type: "ERROR", message: "生成失败", details: "模板不存在" });

    expect(fakeDocument.get("#error").textContent).toContain("生成失败");
    expect(fakeDocument.get("#generateButton").disabled).toBe(false);
  });
});
