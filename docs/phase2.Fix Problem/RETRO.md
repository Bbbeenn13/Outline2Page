# Phase 2 Fix 复盘速读

这份文档是 `docs/phase2.Fix Problem/*/debrief.md` 的浓缩版。以后进入 fix 前先读这里；只有需要追溯细节时，再读具体版本目录。

## 最高优先级原则

1. 不清楚用户意图时必须先问，不要替用户脑补业务含义、交互细节或验收标准。
2. Figma 模板结构以扫描结果和用户确认为准，不根据组件名或字段名猜测真实语义。
3. 每轮 fix 使用独立目录：`docs/phase2.Fix Problem/<version>/`，必须包含 `proposal.md`、`task.md`、`progress.md`、`debrief.md`。
4. 源码修复后必须同步验证 `code.js`，不能只跑单元测试。

## 已沉淀的避坑规则

- 字段写入不要继续堆硬编码属性名；优先走 `propertyMapping`，保留默认映射作为兼容兜底。
- UI 展示给用户的字段必须是业务语言，例如“封面主题”“章节标题”“小节文字”，不要暴露内部类型术语。
- 新增或修改 UI 到主线程的消息结构时，必须补集成测试，防止 payload 漏字段。
- `NAV_group`、`PAGE_NAV_group`、`TOC_NAV_group` 先按容器理解，不要默认它们就是文本槽位。
- 外层 `TYPE` 通常可能是样式变体，不要直接当作 `CHAPTER` / `TITLE` / `STEP` 业务语义。
- 真正可写的导航文本和状态通常在内部 `NAV_item` 及其暴露的 `_TEXT`、`SHOW`、`HIGHLIGHT` 属性上。
- Figma component properties 要做归一化后缀匹配，兼容 `NAV_item/PAGE_TITLE_TEXT#...` 这类嵌套 key。
- 同类导航槽位只有一个时，按当前页面上下文写入；同类槽位有多个时，再按列表语义写入。
- 导航槽位数量不足时默认 warning，让用户调整模板；除非用户明确要求，不要自动 clone。
- frame 命名规则变更时，必须同步检查所有依赖 frame 名的解析逻辑，尤其是导航高亮。
- frame 名可用于判断页面层级，但精确 chapter/title/step 索引应优先来自结构化 page plan，避免同名文本歧义。

## 版本教训

### v1.0 字段映射与 NAV_group

根因：生成链路缺少“用户可配置的大纲字段 -> 模板写入目标”的桥梁，同时导航逻辑寻找了不存在的 `NAV_CHAPTER` / `NAV_TITLE` / `NAV_STEP`。

沉淀：
- 字段映射应由 UI 显式传给主线程。
- 属性注入要支持默认映射 + 用户映射覆盖。
- 写入失败进入 warning，不中断整页生成。
- 模板属性必须来自扫描结果和用户确认。

### v2.0 frame 完整命名

根因：`02.chapter`、`03.title`、`04.step` 只能表达页面类型，不能表达完整大纲路径。

沉淀：
- 用户要“完整层级”时，必须保留真实文本路径：`<page>.<chapter>/<title>/<step>`。
- `00.cover` 和 `01.toc` 保持短名即可。
- 新命名上线时至少兼容一轮旧格式。
- `/` 在 Figma 图层名里可用，但未来接导出链路时要重新评估转义风险。

### v3.0 PAGE_NAV_group / TOC_NAV_group

根因：代码混淆了 Figma 导航组件的容器职责和导航项职责，把外层容器或外层 `TYPE` 当成业务语义。

沉淀：
- `PAGE_NAV_group` / `TOC_NAV_group` 是容器。
- 内部 `NAV_item` 才是导航语义和写入槽位所在。
- `PAGE_CHAPTER_TEXT`、`PAGE_TITLE_TEXT`、`PAGE_STEP_TEXT`、`TOC_TITLE_TEXT` 等要支持嵌套属性 key。
- 单槽位是当前页面面包屑语义，多槽位才是列表语义。

### v4.0 PAGE_CHAPTER_TEXT (HUGE)

根因：`PAGE_CHAPTER_TEXT (HUGE)` 已接入普通属性注入，但 `PAGE_NAV_group` 由导航注入器独立写入；导航注入器漏掉 huge 版本 chapter 文本目标，导致普通注入跳过导航后保留模板默认文案。

沉淀：
- 同一个业务语义如果有多个视觉尺寸属性，普通注入和专属注入都要覆盖。
- 导航专属注入器必须同步支持普通属性注入里已有的同语义尺寸变体，例如 `PAGE_CHAPTER_TEXT (HUGE)`。
- 回归测试要使用真实 Figma 暴露 key 形态，例如 `NAV_item/PAGE_CHAPTER_TEXT (HUGE)#text`，避免只测简化属性名。

### v5.0 目录标题扩展与导航属性误报

根因：TOC 标题扩展只 clone 内部 `TOC_TITLE_TEXT` 实例，遇到嵌套组件实例 clone 失败时不会回退到标题行容器；普通属性注入器跳过导航容器后仍按全量目标报告缺失，造成导航属性误报。

沉淀：
- 嵌套 Figma 槽位扩展应沿父级链寻找可复制的最小容器，并测试 clone 抛错后的回退路径。
- 导航/目录专属属性由专属注入器负责时，普通属性注入器不要把这些跳过的目标计入缺失属性。
- TOC 回归测试要覆盖 `NAV_item/TOC_TITLE_TEXT#...` 嵌套 key、槽位不足、内部实例不可 clone、父级容器可 clone 的组合。

## 必测清单

每次相关 fix 至少考虑这些测试：

- `plugin-ui-bridge`：UI 消息是否携带完整映射数据。
- `property-injector`：默认映射、用户映射、warning 不中断。
- `naming-service`：frame 命名和旧格式兼容。
- `navigation-injector`：导航项收集、写入、高亮、frame 名回退、chapter huge 变体。
- `toc-expander`：嵌套 `TOC_*_TEXT` 属性 key、标题槽位不足、clone 失败回退。
- 完整命令：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 长期风险

- 真实 Figma 属性名可能带大小写差异、中文括号、斜杠、组件名前缀或 `#` 后缀；新增模板前先扫描或补 fixture。
- 同名章节、同名标题、同名小节会让纯文本 frame 名无法可靠反查索引。
- 如果未来需要自动 clone 导航槽位，必须另开版本设计 clone 策略。
- 如果未来要持久化字段映射，需要单独设计 `figma.clientStorage`，不要混入当前临时映射逻辑。
- 如果模板同时有面包屑槽位和列表槽位，仅靠同类槽位数量可能不够，需要更明确的组件命名或结构规则。
- 如果 TOC 标题槽位和其父级容器都不可 clone，代码只能 warning，模板侧需要提供可复制容器。

## 更新规则

每完成一个新 fix 版本：

1. 先写该版本自己的 `debrief.md`。
2. 再把可复用教训合并到本文件。
3. 本文件只保留跨版本有价值的结论，不复制完整过程。
