# Outline2Page Fix 3.0 Task

## Task 1：还原导航组件真实语义

目标：

- 明确导航组件只有 `PAGE_NAV_group` 和 `TOC_NAV_group`。
- 撤销对不存在或误用属性的依赖，例如 `FRONT_NAVGROUP_TYPE`。
- 不把外层 `TYPE` 当作 `CHAPTER/TITLE/STEP` 业务语义。

涉及文件：

- `src/figma/navigation-injector.ts`
- `src/figma/toc-expander.ts`
- `tests/figma/navigation-injector.test.ts`
- `tests/figma/toc-expander.test.ts`

完成标准：

- 页面导航不依赖外层 `PAGE_NAVGROUP_TYPE`。
- 目录导航不依赖外层 `TOC_NAV_group.TYPE` 判断标题语义。
- 测试覆盖错误结构的回归场景。

## Task 2：PAGE_NAV_group 内部 NAV_item 写入

目标：

- `PAGE_NAV_group` 作为容器。
- 内部 `NAV_item` 作为真实导航槽位。
- 支持 `NAV_item.TYPE = PAGE_CHAPTER/PAGE_TITLE/PAGE_STEP`。
- 支持嵌套暴露属性名，例如 `NAV_item/PAGE_TITLE_TEXT#...`。

涉及文件：

- `src/figma/navigation-injector.ts`
- `tests/figma/navigation-injector.test.ts`

完成标准：

- `PAGE_CHAPTER_TEXT` 写当前章节或章节列表。
- `PAGE_TITLE_TEXT` 写当前标题或当前章节标题列表。
- `PAGE_STEP_TEXT` 写当前小节或当前标题小节列表。
- `SHOW` 和 `HIGHLIGHT` 继续可写。
- 写入失败时保留警告，不中断其它文本写入。

## Task 3：单槽面包屑语义

目标：

- 修复“导航器里的 Title 和 frame 命名里的 title 不能对应”的问题。
- 同类导航项只有一个时，按当前页面上下文写入，不按列表第一个写入。

涉及文件：

- `src/figma/navigation-injector.ts`
- `tests/figma/navigation-injector.test.ts`

完成标准：

- 单个 `PAGE_CHAPTER` 写 `page.chapterIndex` 对应章节。
- 单个 `PAGE_TITLE` 写 `page.titleIndex` 对应标题。
- 单个 `PAGE_STEP` 写 `page.stepIndex` 对应小节。
- 多个同类槽位仍按视觉顺序写同级列表。

## Task 4：TOC_NAV_group 标题槽识别

目标：

- 目录页 `TOC_NAV_group` 按 `_TEXT` 属性名写内容。
- 支持多个 `TOC_TITLE_TEXT` 槽位。
- 兼容嵌套前缀属性名。

涉及文件：

- `src/figma/toc-expander.ts`
- `tests/figma/toc-expander.test.ts`

完成标准：

- `TOC_TITLE_TEXT` 不因前缀 `NAV_item/` 漏识别。
- 一个实例上多个 `TOC_TITLE_TEXT#...` 可以逐个写入。
- 外层样式 `TYPE` 不参与章节/标题判定。

## Task 5：构建与验证

目标：

- 保证源码、测试和插件入口文件同步。
- 用完整命令验证修复没有破坏其它模块。

涉及文件：

- `code.js`
- `docs/2.Fix Problem/v3.0/proposal.md`
- `docs/2.Fix Problem/v3.0/task.md`
- `docs/2.Fix Problem/v3.0/progress.md`

完成标准：

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

全部通过，并确认 `code.js` 已更新。
