# Vibe Coding 起始 Prompt：Outline2Page

你是 Outline2Page 项目的主 Agent。你的目标是从当前空工程开始，完整实现一个 Figma 插件：用户粘贴 Markdown 大纲，插件扫描当前 Figma Page 中的 `PAGE_TEMP：` 模板，自动生成对应层级的页面 Section，并完成属性注入、导航状态、TOC 扩展、旧结果覆盖和生成报告。

整个过程不需要人工参与。你必须主动阅读文档、拆解任务、派发子 Agent、跟踪进度、实现代码、补齐测试、修复失败，并最终交付可运行、可验证的工程。

## 1. 必读输入文档

开始前必须阅读并理解以下文件：

1. `需求文档.md`
2. `docs/01-详细设计文档.md`
3. `docs/02-模块设计文档.md`
4. `doc/tasks/progress.md`
5. `doc/tasks/*.md`

如果文档之间存在冲突，以最新确认的详细设计和模块任务为准：

1. 技术栈是 TypeScript + 原生 HTML/CSS/JS。
2. 这是 Figma 插件工程，不是 Python 工程。
3. 不使用 pytest / mypy / ruff。
4. 质量门禁改为 TypeScript 生态：单元测试、`tsc --noEmit`、lint 或等价静态检查。

## 2. 核心产品目标

实现一个 Figma 插件 Outline2Page：

1. 用户在插件 UI 中直接粘贴 Markdown 大纲。
2. 插件解析 `《Vision》`、`# TOC`、`## CHAPTER`、`### TITLE`、`##### STEP`。
3. 插件只扫描当前 Figma Page 中名称以 `PAGE_TEMP：` 开头的模板。
4. 插件根据大纲实际层级展示模板选择。
5. 插件根据选择的模板生成页面节点。
6. 生成结果放入一个新的 Section：`Outline2Page_GENERATED`。
7. 生成完成后选中新 Section。
8. 再次生成时只覆盖旧的插件生成 Section。
9. 模板节点必须保留不动，不改名、不隐藏、不移动。
10. 插件同时写组件属性和普通 Text Layer。
11. 插件处理导航 `SHOW` 和 `HIGHLIGHT`。
12. 插件扩展 TOC 内的 `NAV_group`。
13. 插件输出完整生成报告。

## 3. 已确认关键规则

### 3.1 技术栈

使用：

1. TypeScript
2. 原生 HTML/CSS/JS UI
3. Figma Plugin API
4. TypeScript 单元测试框架，优先使用 Vitest
5. TypeScript 类型检查，必须通过 `tsc --noEmit`
6. 静态检查，优先使用 ESLint；如果工程最终未引入 ESLint，必须至少通过 TypeScript 严格类型检查和测试

禁止把项目改成 Python 工程。

### 3.2 Figma 范围

1. 只扫描 `figma.currentPage`。
2. 只在当前 Page 生成结果。
3. 生成结果放在 Section 中。
4. 生成后选中新 Section。
5. Section 通过 pluginData 标记：

```text
outline2page.generated = true
```

### 3.3 模板复制策略

1. Frame 模板：`clone()`
2. Component 模板：`createInstance()`
3. Instance 模板：`clone()`
4. 其他可复制节点：尝试 `clone()`，失败则警告

### 3.4 属性注入

必须完全匹配属性名，不做包含匹配。

必须支持：

```text
PAGE_TITLE_TEXT
PAGE_CHAPTER_TEXT
PAGE_STEP_TEXT
PAGE_CHAPTER_TEXT (HUGE)
PAGE_PAGE_TEXT
PAGE_VERSION_TEXT
TOC_TITLE_TEXT
TOC_CHAPTER_TEXT
TOC_NUM_TEXT
TOC_PAGE_RANGE_TEXT
SHOW
HIGHLIGHT
```

不要主动设置 `TYPE`。`TYPE` 由用户在模板中定义，用于决定暴露哪些属性。

写入规则：

1. `PAGE_VERSION_TEXT` 写入 Vision 主题。
2. `PAGE_PAGE_TEXT` 写入格式化实际页码，例如 `01`、`02`。
3. `TOC_NUM_TEXT` 写入章节号。
4. `TOC_PAGE_RANGE_TEXT` 写入章节跨度，例如 `03-08`。
5. `SHOW` 写入布尔值 `true / false`。
6. `HIGHLIGHT` 写入字符串 `on / off`。

### 3.5 导航识别

导航项名称：

```text
NAV_CHAPTER
NAV_TITLE
NAV_STEP
```

也支持显式后缀：

```text
NAV_CHAPTER_01
NAV_TITLE_01
NAV_STEP_01
```

如果没有后缀，按视觉顺序自动赋序号：

1. y 从小到大
2. y 接近时 x 从小到大

### 3.6 TOC 扩展

TOC 或导航中可复制行容器命名为：

```text
NAV_group
```

当 TOC 内容超过现有行数时，复制最后一个 `NAV_group`，重新定位并注入目录数据。

### 3.7 错误策略

继续生成并警告：

1. Markdown 层级异常
2. 缺少部分模板
3. 缺少部分属性
4. 字体加载失败
5. TOC 行不足但可扩展

跳过对应页面：

1. 当前页面类型没有选择模板
2. 选择的模板节点不存在
3. 模板复制失败

只有在没有任何可生成页面时才阻止生成。

## 4. 主 Agent 职责

你是主 Agent，必须负责整体推进：

1. 阅读所有输入文档。
2. 检查 `doc/tasks/progress.md`。
3. 按任务文件拆分子 Agent 工作。
4. 每个子 Agent 负责一个或少数低耦合模块。
5. 确保不同子 Agent 写入范围不冲突。
6. 合并子 Agent 结果。
7. 运行测试、类型检查、静态检查。
8. 修复所有失败。
9. 更新 `doc/tasks/*.md` checklist。
10. 更新 `doc/tasks/progress.md` checklist。
11. 最终给出完成报告。

主 Agent 不能只写计划。必须推进到工程可运行、测试通过。

## 5. 子 Agent 分工建议

可以按以下方式派发子 Agent：

### 5.1 Core Agent

负责纯逻辑模块：

1. `OutlineParser`
2. `OutlineAnalyzer`
3. `TemplateMapper`
4. `PagePlanner`
5. `PaginationService`
6. `NamingService`
7. `LayoutEngine`
8. `ReportBuilder`

写入范围：

```text
src/core/**
src/types/**
tests/core/**
```

### 5.2 Figma Adapter Agent

负责 Figma API 适配模块：

1. `TemplateScanner`
2. `GeneratedSectionManager`
3. `NodeFactory`
4. `PropertyInjector`
5. `NavigationInjector`
6. `TocExpander`

写入范围：

```text
src/figma/**
tests/figma/**
```

### 5.3 UI Agent

负责插件 UI 和主线程通信：

1. `PluginUiBridge`
2. `src/main.ts`
3. `src/ui.html`
4. `src/ui/ui-controller.ts`

写入范围：

```text
src/main.ts
src/ui.html
src/ui/**
tests/integration/**
```

### 5.4 Tooling Agent

负责工程初始化和质量门禁：

1. `package.json`
2. `manifest.json`
3. `tsconfig.json`
4. 测试配置
5. lint 配置
6. Figma typings
7. 构建脚本

写入范围：

```text
package.json
package-lock.json
manifest.json
tsconfig.json
vitest.config.*
eslint.config.*
tests/setup/**
```

## 6. 推荐执行顺序

主 Agent 应按以下顺序推进：

1. 工程初始化
2. 类型定义
3. 纯逻辑模块
4. 纯逻辑单元测试
5. Figma Mock 基础设施
6. Figma API 适配模块
7. Figma 适配模块测试
8. UI 和主线程通信
9. 集成测试或手动验证脚本
10. 质量门禁
11. 更新任务 checklist
12. 最终报告

不要先做 UI 再补逻辑。先把可测试核心做稳。

## 7. 必须实现的模块

必须实现 `doc/tasks` 中的全部模块：

1. `outline-parser.md`
2. `outline-analyzer.md`
3. `template-scanner.md`
4. `template-mapper.md`
5. `page-planner.md`
6. `pagination-service.md`
7. `naming-service.md`
8. `layout-engine.md`
9. `generated-section-manager.md`
10. `node-factory.md`
11. `property-injector.md`
12. `navigation-injector.md`
13. `toc-expander.md`
14. `report-builder.md`
15. `plugin-ui-bridge.md`

每个模块必须：

1. 有实现代码。
2. 有对应测试。
3. 更新对应任务文件 checklist。
4. 在 `progress.md` 中更新模块状态。

## 8. 测试要求

必须有完整的 TypeScript 单元测试。

测试范围：

1. 纯逻辑模块必须有单元测试。
2. Figma API 模块必须有 Mock 测试。
3. UI 通信必须有集成测试或可重复的手动验证说明。
4. 边界和异常必须测试：
   - 缺 Vision
   - 缺 TOC
   - 未定义层级 `####`
   - TITLE 缺 CHAPTER
   - STEP 缺 TITLE
   - 缺模板
   - 缺属性
   - Text Layer 字体加载失败
   - 无后缀导航项排序
   - TOC `NAV_group` 扩展
   - 旧 Section 覆盖

## 9. 质量门禁

最终必须通过以下命令或等价命令：

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

如果项目最终没有引入 lint 工具，必须明确说明原因，并至少保证：

```bash
npm test
npm run typecheck
npm run build
```

不得声称通过未实际运行的命令。

## 10. checklist 更新规则

每完成一个最小任务，更新对应任务文件中的 checkbox：

```md
- [x] 已完成任务
```

每完成一个模块，更新：

```text
doc/tasks/progress.md
```

规则：

1. 不要提前勾选未完成项。
2. 测试未写完不能勾选模块完成。
3. 测试未通过不能勾选阶段完成。
4. 质量门禁未通过不能勾选总体完成。

## 11. 不允许做的事

1. 不要把工程改成 Python。
2. 不要使用 pytest / mypy / ruff 作为本项目主质量门禁。
3. 不要跳过测试。
4. 不要只生成文档不写代码。
5. 不要删除用户未要求删除的文件。
6. 不要批量删除文件或目录。
7. 不要修改模板设计规则的产品语义。
8. 不要主动设置 `TYPE`。
9. 不要扫描非当前 Figma Page。
10. 不要删除非插件生成节点。

## 12. 完成定义

任务完成必须同时满足：

1. Figma 插件工程已创建。
2. `manifest.json` 可用于加载插件。
3. Markdown 可解析并显示预览。
4. 当前 Page 的 `PAGE_TEMP：` 模板可扫描。
5. 用户可为页面类型选择模板。
6. 插件可生成 `Outline2Page_GENERATED` Section。
7. 插件可覆盖旧生成 Section。
8. 模板节点保持不变。
9. 属性和 Text Layer 可注入。
10. 导航 SHOW / HIGHLIGHT 可写入。
11. TOC `NAV_group` 可扩展。
12. 生成报告完整。
13. 所有模块任务 checklist 已更新。
14. `doc/tasks/progress.md` 已更新。
15. `npm test` 通过。
16. `npm run typecheck` 通过。
17. `npm run build` 通过。
18. `npm run lint` 通过，或明确说明未引入 lint 且其他门禁通过。

## 13. 最终回复格式

完成后输出：

1. 实现摘要。
2. 测试和质量门禁结果。
3. 已更新的任务进度文件。
4. 任何仍需用户在 Figma 中人工验证的事项。
5. 明确说明未完成项，不能粉饰。

最终回复必须简洁，但要包含真实验证结果。
