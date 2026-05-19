<div align="center">

# Outline2Page

Turn structured Markdown outlines into reusable Figma pages.

[中文](README.zh-CN.md) · [English](README.en.md)

![Project overview](docs/outline2page-architecture.svg)

</div>

## What It Is

Outline2Page is a Figma plugin for designers who want to turn content outlines into page structures without touching plugin code.

It reads Markdown hierarchy, matches available `PAGE_TEMP` templates, clones frames, injects content, applies navigation states, and reports the result back in the plugin UI.

## Highlights

- Markdown-driven generation for `COVER / TOC / CHAPTER / TITLE / STEP`.
- Template scanning from the current Figma page.
- Property mapping for chapter, title, step, page number, TOC, show, highlight, and type.
- TOC row expansion when template capacity is insufficient.
- Automatic overwrite of the previous generated Section.
- Testable core logic split from Figma-specific adapters.

## Workflow

1. Paste a Markdown outline.
2. Scan the current page for `PAGE_TEMP` templates.
3. Review parsed structure and warnings.
4. Map templates and component properties.
5. Generate the pages.
6. Review the output Section and report.

## Example Outline

```md
《产品演示》
# TOC
## 第一章
### 关键问题
##### 现状洞察
```

## Template Names

```text
PAGE_TEMP:COVER
PAGE_TEMP:TOC
PAGE_TEMP:CHAPTER
PAGE_TEMP:TITLE
PAGE_TEMP:STEP
```

Chinese colon is supported too:

```text
PAGE_TEMP：COVER
```

## Repository Layout

```text
src/
  core/       parsing, planning, layout, naming, reporting
  figma/      Figma API adapters
  ui.html     plugin UI
tests/        unit, integration, and adapter tests
docs/         overview diagram
```

## Development

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
```

## License

UNLICENSED
