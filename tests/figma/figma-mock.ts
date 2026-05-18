import type {
  ChildrenNode,
  ComponentPropertyValue,
  FigmaRuntime,
  FontName,
  FigmaNode,
  InstanceNode,
  PageNode,
  SceneNode,
  SectionNode,
} from "../../src/figma/figma-types";

let idCounter = 0;

type MockOptions = {
  id?: string;
  name: string;
  type: SceneNode["type"];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  componentProperties?: Record<string, ComponentPropertyValue>;
  componentPropertyDefinitions?: Record<string, ComponentPropertyValue>;
  fontName?: FontName;
};

export type MockNode = FigmaNode &
  ChildrenNode & {
  pluginData: Record<string, string>;
  parent: MockNode | null;
  children: MockNode[];
  componentProperties?: Record<string, ComponentPropertyValue>;
  componentPropertyDefinitions?: Record<string, ComponentPropertyValue>;
  characters: string;
  fontName?: FontName;
  setPropertiesCalls: Record<string, string | boolean>[];
  createInstanceCalls?: number;
  appendChild: (node: SceneNode) => void;
  clone?: () => MockNode;
  createInstance?: () => InstanceNode;
  getPluginData: (key: string) => string;
  setPluginData: (key: string, value: string) => void;
  setProperties: (properties: Record<string, string | boolean>) => void;
  getRangeAllFontNames: (start: number, end: number) => FontName[];
  findAll?: (callback?: (node: SceneNode) => boolean) => SceneNode[];
  cloneDisabled?: boolean;
};

export function resetMockIds(): void {
  idCounter = 0;
}

export function createMockNode(options: MockOptions, children: MockNode[] = []): MockNode {
  const node: MockNode = {
    id: options.id ?? `node-${String(++idCounter)}`,
    name: options.name,
    type: options.type,
    x: options.x ?? 0,
    y: options.y ?? 0,
    width: options.width ?? 100,
    height: options.height ?? 50,
    children: [],
    parent: null,
    removed: false,
    pluginData: {},
    componentProperties: options.componentProperties,
    componentPropertyDefinitions: options.componentPropertyDefinitions,
    characters: "",
    fontName: options.fontName,
    setPropertiesCalls: [],
    appendChild(child: SceneNode): void {
      const mockChild = child as MockNode;
      mockChild.parent = node;
      node.children.push(mockChild);
    },
    remove(): void {
      node.removed = true;
      if (!node.parent) return;
      const index = node.parent.children.indexOf(node);
      if (index >= 0) node.parent.children.splice(index, 1);
      node.parent = null;
    },
    clone(): MockNode {
      if (node.cloneDisabled) throw new Error("clone disabled");
      return cloneMockNode(node);
    },
    createInstance(): InstanceNode {
      node.createInstanceCalls = (node.createInstanceCalls ?? 0) + 1;
      const instance = cloneMockNode(node);
      instance.type = "INSTANCE";
      return instance as InstanceNode;
    },
    getPluginData(key: string): string {
      return node.pluginData[key] ?? "";
    },
    setPluginData(key: string, value: string): void {
      node.pluginData[key] = value;
    },
    setProperties(properties: Record<string, string | boolean>): void {
      node.setPropertiesCalls.push(properties);
      const componentProperties: Record<string, ComponentPropertyValue | undefined> | undefined = node.componentProperties;
      for (const [key, value] of Object.entries(properties)) {
        const property = componentProperties?.[key];
        if (property) property.value = value;
      }
    },
    getRangeAllFontNames(): FontName[] {
      return options.fontName ? [options.fontName] : [];
    },
  };

  for (const child of children) node.appendChild(child);
  return node;
}

export function createPage(children: MockNode[] = []): PageNode {
  const page = createMockNode({ name: "Page 1", type: "PAGE", width: 0, height: 0 }, children) as MockNode & PageNode;
  page.selection = [];
  page.findAll = (callback?: (node: SceneNode) => boolean): SceneNode[] => {
    const result: SceneNode[] = [];
    const visit = (node: SceneNode): void => {
      for (const child of node.children ?? []) {
        if (!callback || callback(child)) result.push(child);
        visit(child);
      }
    };
    visit(page);
    return result;
  };
  return page;
}

export function createRoot(children: MockNode[] = []): MockNode & { findAll: (callback?: (node: SceneNode) => boolean) => SceneNode[] } {
  const root = createMockNode({ name: "Root", type: "DOCUMENT", width: 0, height: 0 }, children) as MockNode & {
    findAll: (callback?: (node: SceneNode) => boolean) => SceneNode[];
  };
  root.findAll = (callback?: (node: SceneNode) => boolean): SceneNode[] => {
    const result: SceneNode[] = [];
    const visit = (node: SceneNode): void => {
      for (const child of node.children ?? []) {
        if (!callback || callback(child)) result.push(child);
        visit(child);
      }
    };
    visit(root);
    return result;
  };
  return root;
}

export function createRuntime(page?: PageNode): FigmaRuntime & { loadFontCalls: FontName[] } {
  const runtime = {
    currentPage: page,
    loadFontCalls: [] as FontName[],
    root: undefined,
    loadAllPagesAsync(): Promise<void> {
      return Promise.resolve();
    },
    createSection(): SectionNode {
      return createMockNode({ name: "Section", type: "SECTION" }) as MockNode & SectionNode;
    },
    getNodeById(id: string): SceneNode | null {
      if (!page) return null;
      return page.findAll?.((node) => node.id === id)[0] ?? null;
    },
    loadFontAsync(fontName: FontName): Promise<void> {
      runtime.loadFontCalls.push(fontName);
      return Promise.resolve();
    },
  };
  return runtime;
}

export function textProperty(value = ""): ComponentPropertyValue {
  return { type: "TEXT", value };
}

export function boolProperty(value = false): ComponentPropertyValue {
  return { type: "BOOLEAN", value };
}

export function variantProperty(value = "off"): ComponentPropertyValue {
  return { type: "VARIANT", value };
}

function cloneMockNode(source: MockNode): MockNode {
  const cloned = createMockNode({
    name: source.name,
    type: source.type,
    x: source.x,
    y: source.y,
    width: source.width,
    height: source.height,
    componentProperties: cloneComponentProperties(source.componentProperties),
    componentPropertyDefinitions: cloneComponentProperties(source.componentPropertyDefinitions),
    fontName: source.fontName,
  });
  cloned.characters = source.characters;
  for (const child of source.children) {
    cloned.appendChild(cloneMockNode(child));
  }
  return cloned;
}

function cloneComponentProperties(
  properties?: Record<string, ComponentPropertyValue>,
): Record<string, ComponentPropertyValue> | undefined {
  if (!properties) return undefined;
  return Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, { ...value }]));
}
