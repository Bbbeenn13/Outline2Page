# Outline2Page

Outline2Page 是一个 Figma 插件项目，用来把结构化 Markdown 大纲转换成一组可复用、可覆盖、可报告的 Figma 页面 Frame。

它面向的不是插件开发者，而是需要快速把内容大纲落成页面结构的设计师：用户只需要准备大纲和 `PAGE_TEMP` 模板，插件负责解析结构、匹配模板、复制 Frame、写入内容、同步导航状态，并在生成后返回报告。

![Outline2Page 项目理解图](docs/outline2page-architecture.svg)

## 核心能力

- 将 Markdown 大纲解析为 `COVER / TOC / CHAPTER / TITLE / STEP` 页面结构。
- 扫描当前 Figma 页面中的 `PAGE_TEMP:` 或 `PAGE_TEMP：` 模板。
- 根据大纲实际层级显示需要绑定的模板类型。
- 按页面计划复制模板 Frame，并自动命名、分页、布局。
- 向组件属性写入章节、标题、小节、页码、目录等内容。
- 控制导航项的显示状态与高亮状态。
- 支持 TOC 目录行扩展，目录内容超过模板容量时自动补足。
- 再次生成时覆盖旧的 Outline2Page 生成 Section，避免画布堆积。
- 在插件 UI 中展示解析预览、结构树、警告和生成报告。

## 使用方式

### 1. 准备大纲

插件支持的基础大纲结构如下：

```md
《产品演示》
# TOC
## 第一章
### 关键问题
##### 现状洞察
```

层级含义：

| Markdown | 页面类型 | 说明 |
| --- | --- | --- |
| `《主题》` | `COVER` | 封面主题 |
| `# TOC` | `TOC` | 目录页 |
| `## 章节` | `CHAPTER` | 章节页 |
| `### 标题` | `TITLE` | 标题页 |
| `##### 小节` | `STEP` | 小节页 |

### 2. 准备 Figma 模板

在当前 Figma 页面中创建模板 Frame、Component 或 Instance，并使用以下命名方式：

```text
PAGE_TEMP:COVER
PAGE_TEMP:TOC
PAGE_TEMP:CHAPTER
PAGE_TEMP:TITLE
PAGE_TEMP:STEP
```

中文冒号也支持：

```text
PAGE_TEMP：COVER
```

插件会扫描这些模板，并按页面类型提供模板选择。

### 3. 配置可写组件属性

模板内部可以通过组件属性暴露可写文本或状态。当前常用属性包括：

| 属性名 | 用途 |
| --- | --- |
| `PAGE_CHAPTER_TEXT` | 当前章节名 |
| `PAGE_TITLE_TEXT` | 当前标题名 |
| `PAGE_STEP_TEXT` | 当前小节名 |
| `PAGE_PAGE_TEXT` | 当前页码 |
| `PAGE_CHAPTER_TEXT (HUGE)` | 章节大标题备用字段 |
| `TOC_CHAPTER_TEXT` | 目录章节名 |
| `TOC_TITLE_TEXT` | 目录标题名 |
| `TOC_NUM_TEXT` | 目录序号 |
| `TOC_PAGE_RANGE_TEXT` | 章节页码范围 |
| `SHOW` | 导航或目录项显示状态 |
| `HIGHLIGHT` | 导航高亮状态 |
| `TYPE` | 组件变体类型 |

插件 UI 支持字段映射，可以把一个语义字段写入多个属性名，例如：

```text
PAGE_CHAPTER_TEXT + PAGE_CHAPTER_TEXT (HUGE)
```

### 4. 生成页面

在插件 UI 中完成以下操作：

1. 粘贴 Markdown 大纲。
2. 查看解析统计和结构树。
3. 扫描并选择模板。
4. 检查属性映射和警告。
5. 点击生成。

生成完成后，插件会选中生成 Section，并在报告中显示生成数量、覆盖数量、跳过数量、警告数量和 TOC 扩展数量。

## 项目结构

```text
Outline2Page
├─ src/
│  ├─ main.ts                 # Figma 插件入口，连接 UI、核心引擎和 Figma 适配层
│  ├─ ui.html                 # 插件 UI 页面
│  ├─ core/                   # 纯逻辑模块，可独立测试
│  │  ├─ outline-parser.ts    # Markdown 大纲解析
│  │  ├─ outline-analyzer.ts  # 页面需求统计
│  │  ├─ template-mapper.ts   # 模板映射
│  │  ├─ page-planner.ts      # 页面计划
│  │  ├─ pagination-service.ts
│  │  ├─ layout-engine.ts
│  │  ├─ naming-service.ts
│  │  └─ report-builder.ts
│  ├─ figma/                  # Figma API 适配层
│  │  ├─ template-scanner.ts
│  │  ├─ node-factory.ts
│  │  ├─ property-injector.ts
│  │  ├─ navigation-injector.ts
│  │  ├─ toc-expander.ts
│  │  └─ generated-section-manager.ts
│  └─ types/
├─ tests/                     # core、figma、integration 测试
├─ docs/
│  └─ outline2page-architecture.svg
├─ manifest.json              # Figma 插件清单
├─ code.js                    # 构建后的插件入口
└─ package.json
```

## 本地开发

安装依赖：

```bash
npm install
```

构建插件入口：

```bash
npm run build
```

在 Figma 中加载：

1. 打开 Figma Desktop。
2. 进入 `Plugins -> Development -> Import plugin from manifest...`。
3. 选择本项目的 `manifest.json`。
4. 运行 `Outline2Page` 插件。

## 验证命令

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

当前测试覆盖包括：

- Markdown 大纲解析与异常警告。
- 页面类型统计、分页、命名和布局。
- 模板扫描、模板映射和缺失模板处理。
- 组件属性注入、导航显示与高亮。
- TOC 目录扩展。
- 生成 Section 覆盖与报告汇总。
- UI 与插件消息桥接。

## 设计原则

- 内容结构由 Markdown 驱动，视觉样式留在 Figma 模板中。
- 核心生成逻辑保持纯函数化，便于测试和回归。
- Figma 适配层只负责扫描、复制、写入、选择和画布操作。
- 允许有警告的生成，尽量不中断用户主流程。
- 重复生成默认覆盖旧的插件产物，不删除用户手工创建的普通 Frame。

## 技术栈

- TypeScript
- Figma Plugin API
- esbuild
- Vitest
- ESLint

## License

UNLICENSED
