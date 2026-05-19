<div align="center">

# Outline2Page

Turn structured Markdown outlines into reusable Figma pages.

[English](README.en.md) · [中文](README.zh-CN.md)

![Project overview](docs/outline2page-architecture.svg)

</div>

## What It Is

Outline2Page is a Figma plugin for turning content outlines into page structures.

It parses Markdown hierarchy, matches `PAGE_TEMP` templates, clones frames, injects content, updates navigation state, and returns a generation report.

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
<Title>
# TOC
## Chapter 1
### Key issue
##### Current state
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

## 中文

完整中文说明见 [README.zh-CN.md](README.zh-CN.md)。

## License

UNLICENSED
