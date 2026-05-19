<div align="center">

# Outline2Page

Turn structured Markdown outlines into reusable Figma pages.

[中文](README.zh-CN.md) · [English](README.en.md)

![Project overview](docs/outline2page-architecture.svg)

</div>

## Overview

Outline2Page is a Figma plugin for turning content outlines into page structures.

It parses Markdown hierarchy, matches `PAGE_TEMP` templates, clones frames, injects content, updates navigation state, and returns a generation report.

## Features

- Supports `COVER / TOC / CHAPTER / TITLE / STEP`.
- Scans templates from the active Figma page.
- Exposes template selection based on outline hierarchy.
- Writes chapter, title, step, page number, TOC, show, highlight, and type values.
- Expands TOC rows when the template is too small.
- Overwrites the previous generated Section on subsequent runs.

## Usage

1. Prepare a Markdown outline.
2. Create `PAGE_TEMP` templates on the current Figma page.
3. Open the plugin and paste the outline.
4. Review parsed structure, template mapping, and warnings.
5. Generate the pages.
6. Inspect the output Section and report.

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

## License

UNLICENSED
