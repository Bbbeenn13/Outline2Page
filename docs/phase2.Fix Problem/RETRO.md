# Phase 2 Fix 历史索引

这份文档是 `docs/phase2.Fix Problem/*/debrief.md` 的历史索引，用于追溯旧版本根因和判断变化。

后续进入 fix 时优先阅读 `docs/phase2.Fix Problem/FIX_GUIDE.md` 和当前最高版本目录的 `progress.md`、`debrief.md`。只有问题线索指向旧版本、旧模板、旧兼容路径或历史决策时，再按需阅读本文件和具体版本目录。

## 最高优先级原则

1. 不清楚用户意图时必须先问，不要替用户脑补业务含义、交互细节或验收标准。
2. Figma 模板结构以扫描结果和用户确认为准，不根据组件名或字段名猜测真实语义。
3. 每轮 fix 使用独立目录：`docs/phase2.Fix Problem/<version>/`，必须包含 `proposal.md`、`task.md`、`progress.md`、`debrief.md`。
4. 源码修复后必须同步验证 `code.js`，不能只跑单元测试。

## 已沉淀的避坑规则

- 字段写入不要继续堆硬编码属性名；优先走 `propertyMapping`，保留默认映射作为兼容兜底。
- `setProperties` 必须使用完整 raw key；归一化只用于业务匹配，不能破坏嵌套路径或 `#id` 后缀。
- 多属性批量写入失败后必须逐属性 fallback，避免一个 `SHOW` / variant 失败拖死文本写入。
- UI 展示给用户的字段必须是业务语言，例如“封面主题”“章节标题”“小节文字”，不要暴露内部类型术语。
- 新增或修改 UI 到主线程的消息结构时，必须补集成测试，防止 payload 漏字段。
- `NAV_group`、`PAGE_NAV_group`、`TOC_NAV_group` 先按容器理解，不要默认它们就是文本槽位。
- `PAGE_NAV_group` 的角色与高亮继续来自内部 `NAV_item` 及其暴露的 `_TEXT`、`SHOW`、`HIGHLIGHT` 属性。
- `TOC_NAV_group` 当前只支持扁平 item 协议：内部独立 item instance 自身 `TYPE + 对应 TOC_*_TEXT + SHOW`；不要再按旧 `HIGHLIGHT`、外层 `TOC_NAV_item/...`、旧 `NAV_item/TOC_*` 或 row-level `TOC_*_TEXT` 补兼容。
- PAGE_NAV 写入器只负责 `PAGE_*` 文本；`TOC_*_TEXT` 不再作为 PAGE_NAV 的兼容字段。
- 外层 `TYPE` 通常可能是样式变体，不要直接当作 `CHAPTER` / `TITLE` / `STEP` 业务语义；TOC 例外仅限内部扁平 item 自身的 `TYPE`。
- Figma component properties 要做归一化后缀匹配；PAGE_NAV 继续兼容 `NAV_item/PAGE_TITLE_TEXT#...` 这类嵌套 key，TOC 不再扩大到旧 `NAV_item/TOC_*` 结构。
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
- ~~内部 `NAV_item` 才是导航语义和写入槽位所在。~~ v10 修正：一度只适用于 PAGE_NAV；v12 再次收敛为 PAGE_NAV/TOC_NAV 统一扁平 item 协议。
- `PAGE_CHAPTER_TEXT`、`PAGE_TITLE_TEXT`、`PAGE_STEP_TEXT` 等 PAGE_NAV 属性要支持嵌套属性 key；TOC 当前只支持内部扁平 item 自身的 `TOC_*_TEXT`。
- 单槽位是当前页面面包屑语义，多槽位才是列表语义。

### v4.0 PAGE_CHAPTER_TEXT (HUGE)

根因：`PAGE_CHAPTER_TEXT (HUGE)` 已接入普通属性注入，但 `PAGE_NAV_group` 由导航注入器独立写入；导航注入器漏掉 huge 版本 chapter 文本目标，导致普通注入跳过导航后保留模板默认文案。

沉淀：
- 同一个业务语义如果有多个视觉尺寸属性，普通注入和专属注入都要覆盖。
- 导航专属注入器必须同步支持普通属性注入里已有的同语义尺寸变体，例如 `PAGE_CHAPTER_TEXT (HUGE)`。
- 回归测试要使用真实 Figma 暴露 key 形态，例如 `NAV_item/PAGE_CHAPTER_TEXT (HUGE)#text`，避免只测简化属性名。

### v5.0 目录标题扩展与导航属性误报（v7.0 修正：仅局部有效）

根因：TOC 标题扩展只 clone 内部 `TOC_TITLE_TEXT` 实例，遇到嵌套组件实例 clone 失败时不会回退到标题行容器；普通属性注入器跳过导航容器后仍按全量目标报告缺失，造成导航属性误报。

沉淀（历史记录，仅解释旧模板问题，不是当前 TOC 支持目标）：
- ~~嵌套 Figma 槽位扩展应沿父级链寻找可复制的最小容器，并测试 clone 抛错后的回退路径。~~ v10 修正：TOC 不再为旧嵌套 `NAV_item/TOC_*` 结构保留扩展策略。
- 导航/目录专属属性由专属注入器负责时，普通属性注入器不要把这些跳过的目标计入缺失属性。
- ~~TOC 回归测试要覆盖 `NAV_item/TOC_TITLE_TEXT#...` 嵌套 key、槽位不足、内部实例不可 clone、父级容器可 clone 的组合。~~ 当前 TOC 测试只覆盖扁平 item `TYPE` 对位、title item clone、槽位不足 warning、旧值清空隐藏。
- ~~v7.0 追加修正：该结论不能解释 row-level 暴露多组 `NAV_item` 属性时的 title 旧值残留，后续不要只沿 clone 策略继续补丁。~~ v10 修正：不再支持 row-level 旧 TOC 暴露结构。

### v6.0 TOC 标题槽越界 clone（v7.0 修正：仅局部有效）

根因：TOC 标题槽位不足时，clone 候选沿父级一路上探；当 `TOC_TITLE_TEXT` 暴露在外层 `TOC_NAV_group` 自身时，代码把整张目录章节卡片当成标题槽位复制，造成重复章节卡片和数量不一致。

沉淀（历史记录，仅解释旧模板问题，不是当前 TOC 支持目标）：
- 子槽位扩展必须限制在当前业务容器内部，不能为了补内部标题槽位复制外层 `TOC_NAV_group`。
- ~~外层实例暴露嵌套属性不代表外层实例就是可复制的最小业务槽位。~~ 当前 TOC 不再支持外层暴露旧 `TOC_TITLE_TEXT` 作为兼容入口。
- 报告显示没有章节行扩展但画布多出目录节点时，应优先检查标题/导航等二级扩展逻辑是否越界 clone。
- ~~v7.0 追加修正：禁止越界 clone 只能避免重复目录行，不能解决 title 槽不随大纲变化；真实修复还必须按 `HIGHLIGHT` 角色分组写入并关闭多余槽位。~~ v12 修正：真实修复是按内部扁平 item 自身 `TYPE` 写入，并清空隐藏多余 title 槽。

### v7.0 TOC 暴露 NAV_item 分组与旧结果残留

根因：真实 TOC 模板把多个 `NAV_item` 的属性暴露在同一个 `TOC_NAV_group` 实例上，角色由 `HIGHLIGHT=TOC_NUM/TOC_CHAPTER/TOC_PAGE/TOC_TITLE` 区分；旧逻辑按整个实例判断元数据，导致 title 槽拿不到独立 `SHOW`，多余 title 槽旧值残留。同时旧版本默认命名生成 Section 若缺少 pluginData，也可能不被清理。

沉淀（历史记录，仅解释旧模板问题，不是当前 TOC 支持目标）：
- ~~旧 TOC 曾按暴露属性的 `NAV_item` 分组写入。~~ 当前模板已改为内部扁平 item 自身 `TYPE`，不要回加旧分组路径。
- ~~旧 TOC 曾把 `HIGHLIGHT` 当槽位角色。~~ 当前 TOC 已废弃这条路径，`HIGHLIGHT` 只保留在 PAGE_NAV 语义里。
- 多余 title 槽必须同时清空文本并写入 `SHOW=false`，否则会表现得像缓存旧值。
- 清理旧输出时除了 pluginData，也要兼容默认命名的历史生成 Section。
- ~~v8.0 追加修正：v7.0 仍按 raw key 前缀合并槽位，不足以覆盖多个暴露 `NAV_item` 使用同一前缀的情况。~~ v10 修正：不再解析旧 `NAV_item` 分组。

### v8.0 TOC 对齐 PAGE_NAV_group 的暴露属性对位

根因：`TOC_NAV_group` 没有完全沿用 `PAGE_NAV_group` 的正确抽象；当多个暴露 `NAV_item` 在 API raw key 中共享前缀时，代码按前缀合并，导致 `TOC_CHAPTER` 和 `TOC_TITLE` 对位混乱，章节被写入主槽，标题槽为空。

沉淀（历史记录，仅解释旧模板问题，不是当前 TOC 支持目标）：
- ~~旧 TOC 曾尝试复用 PAGE_NAV 的 `NAV_item + HIGHLIGHT` 心智。~~ 当前模板已确认不再走这条路径。
- 当前 TOC 的角色边界只来自内部扁平 item 自身 `TYPE`，不是 `HIGHLIGHT`。
- `TOC_CHAPTER_TEXT` 只写章节，`TOC_TITLE_TEXT` 只写标题；测试必须同时断言这两者不串位。
- ~~v9.0 追加修正：当前模板已经移除 `HIGHLIGHT` 主路径，TOC 应优先按 `TOC_NAV_item/TYPE` 对位。~~ v10 曾修正为唯一支持路径；v12 再次修正为内部扁平 item 自身 `TYPE`。

### v9.0 简化 TOC_NAV_item TYPE 对位

根因：简化模板使用 `TOC_NAV_item/TYPE` 表达角色，代码却只识别旧 `NAV_item`，导致落回全实例通用写入路径，所有 `SHOW` 被置为 true，title 槽位无法按大纲控制。

沉淀（v12 已再次收敛为历史）：
- ~~当前 TOC 主路径：识别 `TOC_NAV_item`，按 `TYPE=TOC_NUM/TOC_CHAPTER/TOC_PAGE_RANGE/TOC_TITLE` 对位写对应文本。~~ v12 修正：当前 TOC 主路径是识别内部独立 item instance 自身 `TYPE`，写 item 自身 `TOC_*_TEXT`。
- TOC 不再依赖 `HIGHLIGHT`；v10 已删除旧模板兼容，不再作为支持路径。
- 多个 `TYPE` 连续出现时，每个 `TYPE` 都是一个 item 边界。
- `HIGHLIGHT` 旧模板兼容已删除，不再作为 TOC 支持路径。

### v10.0 TOC 历史结构减负

根因：TOC 在连续修复中累积了多条历史兼容路径，包括 `HIGHLIGHT` 角色、旧 `NAV_item/TOC_*`、row-level `TOC_*_TEXT`、按文本名猜角色。这些路径与当前简化模板冲突，增加维护成本。

沉淀：
- ~~TOC 当前只支持 `TOC_NAV_item/TYPE + 对应 TEXT`。~~ v12 修正：TOC 当前只支持内部扁平 item 自身 `TYPE + 对应 TOC_*_TEXT + SHOW`。
- `TYPE` 是 TOC item 的唯一角色来源；支持值为 `TOC_NUM`、`TOC_CHAPTER`、`TOC_PAGE_RANGE`、`TOC_TITLE`。
- `PAGE_NAV_group` 的 `HIGHLIGHT` 是当前正确实现，不属于 TOC 历史冗余，不要误删。
- `PAGE_NAV_group` 不再写入 `TOC_CHAPTER_TEXT`、`TOC_TITLE_TEXT`、`TOC_NUM_TEXT`，避免 PAGE_NAV/TOC 边界再次混淆。
- 安全兜底如布局 fallback、旧生成 Section 清理，不等同于模板历史结构兼容。

### v11.0 TOC_NAV_group 文字写入失败

根因：TOC 写入器把文本和 `SHOW` 放在同一次 `setProperties`；任一属性失败会拖死整包文本写入。同时旧归一化在第一个 `#` 截断，会破坏嵌套 raw key。

沉淀：
- TOC 写入批量失败后必须逐属性 fallback，`SHOW` 失败不能阻断 `TOC_*_TEXT`。
- 归一化只移除路径段里的 `#id`，实际写入仍使用完整 raw key。
- ~~新增测试覆盖 `SHOW` 失败和 `TOC_NAV_item#.../TOC_*#...` 嵌套路径。~~ v12 修正：`SHOW` 失败仍必测，但外层嵌套 `TOC_NAV_item#...` 不再作为当前协议测试目标。

### v12.0 扁平导航协议收敛

根因：外层 `TOC_NAV_group` 暴露 `TOC_NAV_item/...` 的嵌套属性协议仍然让 Figma raw key 形态成为插件协议核心；PAGE_NAV 与 TOC_NAV 心智不一致。

沉淀：
- TOC/PAGE_NAV 底层协议统一为 container + 内部独立 item instance + item 自身 `TYPE` + item 自身 text + 可选 `SHOW`。
- TOC 当前识别内部 item 自身 `TYPE=TOC_NUM/TOC_CHAPTER/TOC_PAGE_RANGE/TOC_PAGE/TOC_TITLE`。
- 外层 `TOC_NAV_item/...` 嵌套暴露属性不再作为 TOC 当前支持目标。

## 必测清单

每次相关 fix 至少考虑这些测试：

- `plugin-ui-bridge`：UI 消息是否携带完整映射数据。
- `property-injector`：默认映射、用户映射、warning 不中断。
- `naming-service`：frame 命名和旧格式兼容。
- `navigation-injector`：导航项收集、写入、高亮、frame 名回退、chapter huge 变体。
- `navigation-injector`：PAGE_NAV 不写 `TOC_*_TEXT`，TOC 字段只由 TOC 专属注入器处理。
- `toc-expander`：扁平 TOC item 自身 `TYPE` 对位，不依赖 `HIGHLIGHT` 或外层 `TOC_NAV_item/...`。
- `toc-expander`：`TOC_NUM`、`TOC_CHAPTER`、`TOC_PAGE_RANGE`、`TOC_TITLE` 必须分别写入对应 TEXT，不允许 chapter/title 串位。
- `toc-expander`：`TOC_PAGE` / `TOC_PAGE_TEXT` 页码范围别名。
- `toc-expander`：TOC 行数必须随大纲章节变化扩展；多余 title 槽必须清空并隐藏，避免旧值残留表现得像缓存。
- `toc-expander`：title 槽不足时 clone 内部 `TOC_TITLE` item，不复制整行。
- `toc-expander`：标题槽不足、可复制行不足或写入失败时必须 warning，不回退到旧 `HIGHLIGHT` / `NAV_item/TOC_*` / row-level TOC_TEXT 兼容。
- `toc-expander`：`SHOW` 写入失败不能阻断 `TOC_*_TEXT`。
- `generated-section-manager`：旧版本默认命名生成 Section 即使缺少 pluginData，也要清理。
- 完整命令：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 长期风险

- 真实 Figma 属性名可能带大小写差异、中文括号、斜杠、组件名前缀或 `#` 后缀；新增模板前先扫描或补 fixture。
- 同名章节、同名标题、同名小节会让纯文本 frame 名无法可靠反查索引。
- 如果未来需要自动 clone 导航槽位，必须另开版本设计 clone 策略。
- 如果未来要持久化字段映射，需要单独设计 `figma.clientStorage`，不要混入当前临时映射逻辑。
- 如果模板同时有面包屑槽位和列表槽位，仅靠同类槽位数量可能不够，需要更明确的组件命名或结构规则。
- 如果当前 TOC 模板缺少内部扁平 item 自身 `TYPE` 或对应 TEXT 槽位，代码只能 warning，模板侧需要按最新结构修正。
- 只暴露外层 `TOC_NAV_item/...` 嵌套属性、内部 item 不可遍历的 TOC 模板不再作为当前支持目标。
- 旧 TOC 模板已不再作为支持目标；后续不要为了旧 `HIGHLIGHT`、旧 `NAV_item/TOC_*` 或 row-level TOC_TEXT 结构回加兼容。

## 更新规则

每完成一个新 fix 版本：

1. 先写该版本自己的 `debrief.md`。
2. 再把可复用教训合并到本文件。
3. 本文件只保留跨版本有价值的结论，不复制完整过程。
