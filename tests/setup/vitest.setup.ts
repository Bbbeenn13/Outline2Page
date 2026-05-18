import { vi } from "vitest";

const figmaMock = {
  currentPage: {
    findAll: vi.fn(() => []),
    selection: []
  },
  createSection: vi.fn(() => ({
    id: "section-mock",
    name: "Outline2Page_GENERATED",
    setPluginData: vi.fn(),
    getPluginData: vi.fn(() => ""),
    appendChild: vi.fn()
  })),
  loadFontAsync: vi.fn(() => Promise.resolve(undefined)),
  notify: vi.fn(),
  showUI: vi.fn(),
  ui: {
    onmessage: undefined,
    postMessage: vi.fn()
  }
};

vi.stubGlobal("figma", figmaMock);
