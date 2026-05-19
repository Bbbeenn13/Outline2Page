# Outline2Page

Outline2Page is a Figma plugin that turns structured Markdown outlines into reusable, overwriteable, and reportable Figma page frames.

It is built for designers who want to turn content outlines into page structures without touching plugin code. The user prepares an outline and `PAGE_TEMP` templates, and the plugin handles parsing, template matching, frame cloning, content injection, navigation state updates, and generation reporting.

![Project overview](docs/outline2page-architecture.svg)

## Core capabilities

- Parse Markdown outlines into `COVER / TOC / CHAPTER / TITLE / STEP` page structure.
- Scan `PAGE_TEMP:` or `PAGE_TEMP：` templates from the active Figma page.
- Show template choices based on the actual outline hierarchy.
- Clone template frames, then name, paginate, and lay them out automatically.
- Write chapter, title, step, page number, and TOC content into component properties.
- Control visibility and highlight state for navigation items.
- Expand TOC rows when the template capacity is not enough.
- Overwrite the previous Outline2Page generated Section on each run.
- Show parse preview, outline tree, warnings, and generation report in the UI.

## How to use

### 1. Prepare an outline

Supported base structure:

```md
<Title>
# TOC
## Chapter 1
### Key issue
##### Current state
```

Hierarchy mapping:

| Markdown | Page kind | Meaning |
| --- | --- | --- |
| `《Theme》` | `COVER` | Cover title |
| `# TOC` | `TOC` | Table of contents |
| `## Chapter` | `CHAPTER` | Chapter page |
| `### Title` | `TITLE` | Title page |
| `##### Step` | `STEP` | Step page |

### 2. Prepare Figma templates

Create template frames, components, or instances on the current Figma page and name them like this:

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

The plugin scans these templates and exposes them by page kind.

### 3. Configure writable component properties

Templates can expose writable text or state through component properties. Common properties include:

| Property | Purpose |
| --- | --- |
| `PAGE_CHAPTER_TEXT` | Current chapter name |
| `PAGE_TITLE_TEXT` | Current title name |
| `PAGE_STEP_TEXT` | Current step name |
| `PAGE_PAGE_TEXT` | Current page number |
| `PAGE_CHAPTER_TEXT (HUGE)` | Large chapter title fallback |
| `TOC_CHAPTER_TEXT` | TOC chapter name |
| `TOC_TITLE_TEXT` | TOC title name |
| `TOC_NUM_TEXT` | TOC serial number |
| `TOC_PAGE_RANGE_TEXT` | Chapter page range |
| `SHOW` | Visibility state |
| `HIGHLIGHT` | Highlight state |
| `TYPE` | Component variant type |

The UI supports field mapping, so one semantic field can target multiple property names:

```text
PAGE_CHAPTER_TEXT + PAGE_CHAPTER_TEXT (HUGE)
```

### 4. Generate pages

In the plugin UI:

1. Paste the Markdown outline.
2. Review parsing stats and the outline tree.
3. Scan and select templates.
4. Check property mappings and warnings.
5. Click Generate.

After generation, the plugin selects the generated Section and reports created count, replaced count, skipped count, warning count, and TOC expansion count.

## Project structure

```text
Outline2Page
├─ src/
│  ├─ main.ts                 # Plugin entry, connects UI, core engine, and Figma adapters
│  ├─ ui.html                 # Plugin UI
│  ├─ core/                   # Pure logic modules with unit tests
│  │  ├─ outline-parser.ts    # Markdown outline parsing
│  │  ├─ outline-analyzer.ts  # Page demand analysis
│  │  ├─ template-mapper.ts   # Template mapping
│  │  ├─ page-planner.ts      # Page planning
│  │  ├─ pagination-service.ts
│  │  ├─ layout-engine.ts
│  │  ├─ naming-service.ts
│  │  └─ report-builder.ts
│  ├─ figma/                  # Figma API adapters
│  │  ├─ template-scanner.ts
│  │  ├─ node-factory.ts
│  │  ├─ property-injector.ts
│  │  ├─ navigation-injector.ts
│  │  ├─ toc-expander.ts
│  │  └─ generated-section-manager.ts
│  └─ types/
├─ tests/                     # core, figma, and integration tests
├─ docs/
│  └─ outline2page-architecture.svg
├─ manifest.json              # Figma manifest
├─ code.js                    # Bundled plugin entry
└─ package.json
```

## Local development

Install dependencies:

```bash
npm install
```

Build the plugin bundle:

```bash
npm run build
```

Load into Figma:

1. Open Figma Desktop.
2. Go to `Plugins -> Development -> Import plugin from manifest...`.
3. Select this repository's `manifest.json`.
4. Run the `Outline2Page` plugin.

## Verification commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Test coverage includes:

- Markdown outline parsing and warning handling.
- Page kind analysis, pagination, naming, and layout.
- Template scanning, mapping, and missing template handling.
- Component property injection, navigation visibility, and highlight state.
- TOC expansion.
- Generated Section replacement and reporting.
- UI-to-plugin message bridge.

## Design principles

- Markdown drives the content structure, while Figma templates own the visual style.
- Core generation logic stays functional and testable.
- The Figma adapter layer only scans, clones, writes, selects, and manipulates the canvas.
- Generation is warning-friendly and should not interrupt the main workflow.
- Repeated generation overwrites the plugin's previous output, but does not delete user-made frames.

## Tech stack

- TypeScript
- Figma Plugin API
- esbuild
- Vitest
- ESLint

## License

UNLICENSED
