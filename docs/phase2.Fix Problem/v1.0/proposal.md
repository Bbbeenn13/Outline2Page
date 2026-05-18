# Outline2Page Fix Proposal 1.0

## 背景

当前版本已经完成一次基线备份提交：

- Commit: `164056d`
- Message: `chore: backup outline2page 1.0 baseline`
- 范围：`PROJECT/Outline2Page` 源码、测试、文档、构建产物 `code.js`

本轮只进入“需求确认 + 任务拆分”阶段。确认前不改实现代码。

## 已知问题

1. 大纲文字不能稳定写入目标文字属性。
   - 示例：封面中的 `《XXX》` 需要写入某个封面文字属性。
   - 当前代码只内置一组固定属性名，例如 `PAGE_VERSION_TEXT`、`PAGE_TITLE_TEXT`、`PAGE_CHAPTER_TEXT`。
   - 面板目前只选择“页面类型 -> 模板”，没有选择“大纲字段 -> 组件文字属性”的能力。

2. 导航栏模板结构与当前注入逻辑不一致。
   - 当前代码递归寻找实例名 `NAV_CHAPTER` / `NAV_TITLE` / `NAV_STEP`。
   - 用户说明导航栏组件叫 `NAV_group`。
   - 当前 TOC 扩展逻辑也使用 `NAV_group`，需要避免和导航栏注入职责混淆。

3. Frame 命名规则需要调整。
   - 当前命名类似 `04_STEP_章节_标题_步骤`。
   - 目标方向是使用 `PAGE_CHAPTER` / `PAGE_TITLE` / `PAGE_STEP` 作为命名识别基础。
   - 高亮判断希望基于 frame 命名，而不是只基于内部 page plan。

## 目标设计

### 目标 1：面板支持“大纲层级 -> 文字属性”的映射

新增一个字段映射模型，让 UI 面板可以识别大纲字段，并让用户选择它们写入哪个模板属性。

建议先支持这些大纲字段：

- `coverTitle`：来自 `《XXX》`
- `chapterTitle`：章节标题
- `titleText`：标题/小节标题
- `stepText`：步骤标题
- `pageNumberText`：页码
- `tocRange`：目录页码范围

建议 UI 呈现方式：

- 扫描模板后汇总所有可写组件属性和 Text Layer 名称。
- 按页面类型显示字段映射：
  - `COVER.coverTitle -> 选择属性`
  - `CHAPTER.chapterTitle -> 选择属性`
  - `TITLE.chapterTitle -> 选择属性`
  - `TITLE.titleText -> 选择属性`
  - `STEP.chapterTitle -> 选择属性`
  - `STEP.titleText -> 选择属性`
  - `STEP.stepText -> 选择属性`
- 生成时 UI 把 `templateMapping` 和 `propertyMapping` 一起发给插件主线程。

### 目标 2：属性注入改成配置驱动

当前 `property-injector` 依赖固定属性名。修复后应：

- 保留默认映射，兼容旧模板。
- 若 UI 提供映射，则优先按用户选择的属性写入。
- 同时支持组件属性和普通 Text Layer。
- 写入失败需要进入 warnings，不中断整次生成。

### 目标 3：导航栏按大纲顺序填充并高亮

建议把导航注入拆成两个步骤：

1. 收集当前生成 frame 中的导航行。
   - 找 `NAV_group`。
   - 按视觉顺序排序。
   - 若数量不足，按最后一行 clone 扩展。

2. 写入导航数据并高亮。
   - 章节导航：按章节顺序写入。
   - 小节/标题/步骤导航：按当前页面所属章节或全局结构写入，这一点需要确认。
   - 高亮判断从 frame 命名解析当前页类型与索引。
   - 写入 `SHOW` / `HIGHLIGHT` 或用户确认的等价属性。

### 目标 4：Frame 命名规则改为可解析的稳定格式

建议采用机器可解析、同时保留可读标题的格式：

- `PAGE_COVER__<coverTitle>`
- `PAGE_TOC`
- `PAGE_CHAPTER__C01__<chapterTitle>`
- `PAGE_TITLE__C01_T01__<titleText>`
- `PAGE_STEP__C01_T01_S01__<stepText>`

如果你希望严格只有 `PAGE_CHAPTER` / `PAGE_TITLE` / `PAGE_STEP`，实现会更简单，但会丢失从 frame 名直接判断具体第几个章节/标题/步骤的能力。这里必须确认。

## 需要确认的问题

1. `COVER_CERSION_TEXT` 是不是准确属性名？
   - 你写的是 `CERSION`。
   - 是否其实想写 `COVER_VERSION_TEXT`、`COVER_TITLE_TEXT`，还是模板里真实属性就叫 `COVER_CERSION_TEXT`？

2. `《XXX》` 在大纲语义上叫什么？
   - 当前代码把它当 `vision`。
   - 修复后是否改名为 `coverTitle` / `deckTitle` / `vision`？

3. 面板里的属性映射粒度要到哪里？
   - 方案 A：按全局字段映射，例如所有 `titleText` 都写入同一个属性名。
   - 方案 B：按页面类型 + 字段映射，例如 `TITLE.titleText` 和 `STEP.titleText` 可以写入不同属性。
   - 我建议方案 B。

4. 导航栏 `NAV_group` 的真实结构是什么？
   - `NAV_group` 是 Frame，里面有组件实例吗？
   - 还是 `NAV_group` 本身就是 Instance？
   - 它包含哪些可写属性名？例如 `TITLE_TEXT`、`STEP_TEXT`、`HIGHLIGHT`、`SHOW`？

5. “大纲有多少章节/小节”里的“小节”对应哪一层？
   - 当前大纲模型是 `chapter -> title -> step`。
   - 这里的小节是 `title`，还是 `step`，还是二者都要进导航？

6. 导航高亮的判定来源是什么？
   - 只根据 frame 名解析当前页？
   - 还是 frame 名解析失败时回退到 `PagePlanItem` 的 `chapterIndex/titleIndex/stepIndex`？
   - 我建议“frame 名优先，page plan 回退”。

7. `NAV_group` 数量不足时是否允许自动 clone？
   - 如果允许：按最后一个 `NAV_group` 复制并追加。
   - 如果不允许：只写已有行，多出的导航项 warning。

8. 属性映射是否需要持久化？
   - 只在本次 UI 打开期间有效。
   - 或保存到 `figma.clientStorage`，下次打开自动恢复。

## 用户确认结论

1. 封面 `《XXX》` 写入属性名为 `COVER_VERSION_TEXT`。
2. `《XXX》` 的字段语义继续使用 `vision`。
3. 面板不展示技术概念，改为展示中文大纲字段：
   - 封面主题
   - 章节标题
   - 标题文字
   - 小节文字
   - 页码
   - 目录编号
   - 目录页码范围
   用户可为这些字段选择目标属性。实现上仍按页面类型和字段保存映射，避免不同页面类型互相污染。
4. `NAV_group` 是 Instance，当前可写属性名包括：
   - `COVER_VERSION_TEXT`
   - `HIGHLIGHT`
   - `PAGE_CHAPTER_TEXT`
   - `PAGE_CHAPTER_TEXT（HUGE）`
   - `PAGE_NAVGROUP_TYPE`
   - `PAGE_PAGE_TEXT`
   - `PAGE_STEP_TEXT`
   - `PAGE_TITLE_TEXT`
   - `PAGE_VERSION_TEXT`
   - `SHOW`
   - `TOC_CHAPTER_TEXT`
   - `TOC_NUM_TEXT`
   - `TOC_PAGE_RANGE_TEXT`
   - `TOC_TITLE_TEXT`
   - `TYPE`
5. “小节”对应当前模型里的 `step`。旧称“步骤”，本轮统一改成“小节”。
6. 导航高亮按 frame 命名优先，解析失败时允许用 page plan 回退。
7. `NAV_group` 一般不会数量不足。若 title 或 step 数量不足，不自动 clone，提示警告，由用户做增减调整。
8. 属性映射每次初始化时重新扫描和计算，不做持久化。

## 确认后的 Frame 命名规则

格式：`页数.chapter/title/step`

建议具体化为：

- `00.cover`
- `01.toc`
- `02.chapter`
- `03.title`
- `04.step`

为了支持高亮判断，生成逻辑内部仍保留 `chapterIndex/titleIndex/stepIndex`，并在解析 frame 名无法得到索引时回退到 page plan。

## 建议验收标准

1. 面板能展示大纲层级字段，并能为每个字段选择目标属性。
2. `《XXX》` 能写入用户选择的封面属性。
3. 章节、标题、步骤页的文字能写入对应模板属性。
4. Frame 名符合确认后的规则。
5. 导航栏按大纲顺序填充，数量不足时按确认策略处理。
6. 当前页面对应导航项能高亮。
7. `npm test`、`npm run typecheck`、`npm run build` 全部通过。
