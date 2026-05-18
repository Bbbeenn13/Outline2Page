import { describe, expect, it } from "vitest";
import { createFrameName } from "../../src/core/naming-service";
import type { PagePlanItem } from "../../src/types";

describe("NamingService", () => {
  it("generates frame names as complete page hierarchy paths", () => {
    expect(createFrameName(page("COVER", { pageNumberText: "00" }))).toBe("00.cover");
    expect(createFrameName(page("TOC", { pageNumberText: "01" }))).toBe("01.toc");
    expect(createFrameName(page("CHAPTER", { pageNumberText: "02", chapterTitle: "第一章" }))).toBe("02.第一章");
    expect(
      createFrameName(
        page("TITLE", {
          pageNumberText: "03",
          chapterTitle: "第一章",
          titleText: "门店洞察",
        }),
      ),
    ).toBe("03.第一章/门店洞察");
    expect(
      createFrameName(
        page("STEP", {
          pageNumberText: "04",
          chapterTitle: "第一章",
          titleText: "门店洞察",
          stepText: "重点小节",
        }),
      ),
    ).toBe("04.第一章/门店洞察/重点小节");
  });

  it("pads numeric page text and ignores descriptive content", () => {
    expect(
      createFrameName(
        page("TITLE", {
          pageNumberText: "5",
          chapterTitle: "第一章",
          titleText: "门店洞察",
        }),
      ),
    ).toBe("05.第一章/门店洞察");
  });

  it("falls back to numeric pageNumber when pageNumberText is empty", () => {
    expect(
      createFrameName(
        page("STEP", {
          pageNumber: 8,
          pageNumberText: "",
          chapterTitle: "第一章",
          titleText: "门店洞察",
          stepText: "重点小节",
        }),
      ),
    ).toBe("08.第一章/门店洞察/重点小节");
  });
});

function page(kind: PagePlanItem["kind"], patch: Partial<PagePlanItem>): PagePlanItem {
  return {
    id: `${kind}-id`,
    kind,
    frameName: "",
    pageNumber: 0,
    pageNumberText: "",
    vision: null,
    ...patch,
  };
}
