# Figma 插件需求文档：Outline2Page

## 1. 项目背景

设计者希望通过一份结构化 Markdown 大纲，自动在 Figma 中生成对应层级的页面 Frame，并将章节、标题、小节、页码、目录、导航栏状态等信息注入到预先设计好的 `PAGE_TEMP：` 模板中。

插件面向不了解插件开发代码的设计者，目标是把「大纲 → 页面结构 → 模板选择 → 自动生成 Frame」这个流程做成可视化、可预览、可重复覆盖生成的 Figma 原生风格工具。

## 2. 产品目标

1. 用户在插件 UI 中直接粘贴 Markdown 大纲。
2. 插件自动解析大纲层级，识别需要生成哪些页面类型。
3. 插件扫描当前 Figma 文件中所有以 `PAGE_TEMP：` 命名的模板 Frame。
4. 插件根据大纲中实际出现的层级结构，提供对应模板下拉选择。
5. 插件复制选定模板，自动生成对应 Frame。
6. 插件根据模板组件属性注入内容，并控制导航栏高亮、显示状态、页码、目录页范围。
7. 插件重复生成时，自动覆盖旧生成结果，并在生成报告中说明覆盖情况。

## 3. 目标用户

主要用户为 Figma 设计者、产品设计师、内容型页面设计者。

用户不需要理解 Figma 插件开发，也不需要手动改代码。插件应通过清晰 UI 引导用户完成输入、检查、模板选择、生成和结果确认。

## 4. 输入规范

用户在插件 UI 中直接粘贴 Markdown。

基础层级规则：

```md
《Vision》= 主题

# TOC = 目录

## CHAPTER = 章节

### TITLE = 标题

##### STEP = 小节
```

层级含义：

| Markdown 层级 | 页面含义 | 是否生成页面 |
| --- | --- | --- |
| `《Vision》` | 主题 / 封面标题 | 是，生成封面页 |
| `# TOC` | 目录 | 是，生成目录页 |
| `## CHAPTER` | 章节 | 是，生成章节页 |
| `### TITLE` | 标题 | 是，生成标题页 |
| `##### STEP` | 小节 | 是，生成小节页 |

如果后续出现更多子层级，插件应以输入大纲中实际存在的层级组合为准，生成对应的模板选择项。

## 5. 模板识别规则

插件扫描当前 Figma 文件中所有名称以 `PAGE_TEMP：` 开头的 Frame 或组件实例模板。

当前基础模板命名包括：

```text
PAGE_TEMP：COVER
PAGE_TEMP：TOC
PAGE_TEMP：CHAPTER
PAGE_TEMP：TITLE
PAGE_TEMP：STEP
```

插件不固定写死模板数量，而是基于扫描结果提供可选模板。

模板选择 UI 根据大纲层级自动生成：

| 大纲实际结构 | UI 中需要选择的模板 |
| --- | --- |
| 仅封面 + 目录 + 章节 | COVER、TOC、CHAPTER |
| 章节 + 标题 | COVER、TOC、CHAPTER、TITLE |
| 章节 + 标题 + 小节 | COVER、TOC、CHAPTER、TITLE、STEP |
| 后续新增层级 | 根据解析结果追加对应模板选择 |

用户必须为每一种即将生成的页面类型选择模板。缺失模板时，插件应提示警告，但允许用户返回补选或继续处理可生成部分。

## 6. 页面生成规则

插件根据 Markdown 大纲生成 Frame。

生成原则：

1. `《Vision》` 生成封面页。
2. `# TOC` 生成目录页。
3. 每个 `## CHAPTER` 生成章节页。
4. 每个 `### TITLE` 生成标题页。
5. 每个 `##### STEP` 生成小节页。
6. 如果某个 `TITLE` 下没有 `STEP`，只生成 `TITLE` 页。
7. 如果某个 `CHAPTER` 下没有 `TITLE`，只生成 `CHAPTER` 页。

标题页作为标题概览页；小节页作为具体小节页。

## 7. Frame 命名规则

生成后的 Frame 命名必须呼应大纲结构，使用户仅通过 Frame 名称即可理解页面所属层级，并让导航栏注入逻辑可以识别当前页面上下文。

建议命名格式：

```text
00_COVER_主题名
01_TOC
02_CHAPTER_章节名
02-01_TITLE_标题名
02-01-01_STEP_小节名
```

命名要求：

1. 名称包含页面类型：`COVER`、`TOC`、`CHAPTER`、`TITLE`、`STEP`。
2. 名称包含对应大纲文本。
3. 标题和小节页面应保留上级编号关系。
4. 页码从 TOC 算第一页；封面可独立为 `00`。

## 8. 画布布局规则

生成结果放在当前 Figma 页面中。

布局规则：

1. 同一章节放在同一行。
2. 每行从左到右排列：`CHAPTER → TITLE → STEP`。
3. 不同章节之间垂直间距为 `100px`。
4. 同一标题下的多个 STEP 横向间距为 `100px`。
5. 同一章节内，不同标题小队之间横向间距为 `200px`。
6. STEP 跟随所属 TITLE 形成一个小队。

布局示意：

```text
CHAPTER  TITLE  STEP  STEP    TITLE  STEP

CHAPTER  TITLE  STEP          TITLE  STEP  STEP
```

## 9. 属性识别与注入规则

插件需要扫描模板中所有组件实例的属性接口，并根据属性名完全匹配注入内容或切换状态。

属性匹配规则：

1. 必须完全等于属性名。
2. 不做包含匹配。
3. 属性名前后存在空格时，应在 UI 报告中提示用户检查命名。
4. 插件需要支持未来新增或删除属性，不应把属性列表写死为不可变逻辑。

当前已知属性：

```text
TYPE
HIGHLIGHT
SHOW
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
```

## 10. 文本注入规则

| 属性名 | 注入内容 |
| --- | --- |
| `PAGE_TITLE_TEXT` | 当前 TITLE 名称 |
| `PAGE_CHAPTER_TEXT` | 当前 CHAPTER 名称 |
| `PAGE_STEP_TEXT` | 当前 STEP 名称 |
| `PAGE_CHAPTER_TEXT (HUGE)` | 当前 CHAPTER 名称，用于大标题样式 |
| `PAGE_PAGE_TEXT` | 章节号，格式为 `00`、`01`、`02` |
| `PAGE_VERSION_TEXT` | 版本信息，由插件 UI 输入或使用模板默认值 |
| `TOC_TITLE_TEXT` | TOC 中的 TITLE 名称 |
| `TOC_CHAPTER_TEXT` | TOC 中的 CHAPTER 名称 |
| `TOC_NUM_TEXT` | TOC 序号，格式为 `01/20` |
| `TOC_PAGE_RANGE_TEXT` | 章节页码范围，格式为 `03-08` |

## 11. TYPE 变体规则

`TYPE` 是组件变体类型选择属性，用于切换不同设计变体。

命名原则：

1. `TYPE` 的可选值应与文字属性前缀保持一致。
2. 例如属性前缀为 `PAGE_TITLE_TEXT`，对应变体可使用 `PAGE_TITLE` 或设计系统中约定的同名类型。
3. 插件应优先根据当前页面类型选择匹配的 `TYPE`。
4. 如果没有匹配的 `TYPE`，保留模板默认值，并在生成报告中提示。

## 12. 导航栏状态规则

导航栏通过组件属性控制显示与高亮。

### 12.1 SHOW

`SHOW` 使用布尔值：

```text
true / false
```

规则：

1. 当前页面存在对应导航项时，`SHOW=true`。
2. 当前页面不存在对应导航项时，`SHOW=false`。
3. 插件不直接删除组件中的导航项。
4. 数量调整优先通过 `SHOW` 控制。

### 12.2 HIGHLIGHT

`HIGHLIGHT` 使用字符串：

```text
on / off
```

规则：

1. 无 STEP 的页面，高亮当前 TITLE。
2. 有 STEP 的页面，同时判断当前 TITLE 和当前 STEP。
3. 当前页面对应的 STEP：`HIGHLIGHT=on`。
4. 非当前 STEP：`HIGHLIGHT=off`。
5. 当前页面对应的 TITLE：`HIGHLIGHT=on`。
6. 非当前 TITLE：`HIGHLIGHT=off`。

## 13. TOC 目录页规则

TOC 页列出：

```text
CHAPTER + TITLE
```

目录视觉结构由 TOC 模板内部组件属性决定，插件只负责注入对应数据。

TOC 数据规则：

1. `TOC_CHAPTER_TEXT` 注入章节名。
2. `TOC_TITLE_TEXT` 注入标题名。
3. `TOC_NUM_TEXT` 注入序号，格式为 `01/20`。
4. `TOC_PAGE_RANGE_TEXT` 注入章节页码范围，格式为 `03-08`。
5. TOC 算全文第一页。

如果 TOC 内容超过模板容器容量，插件应：

1. 检测模板中的可复制容器。
2. 自动复制更多目录项或更多 TOC 容器。
3. 生成后在报告中明确提示：TOC 内容超过原始模板容量，已自动扩展。

## 14. 旧结果覆盖规则

插件再次生成时，需要自动覆盖旧生成的 Frame。

覆盖规则：

1. 插件需要能识别上一次由 Outline2Page 生成的 Frame。
2. 再次生成时自动移除旧生成结果，并创建新结果。
3. 不删除用户手动创建的模板。
4. 不删除非插件生成的普通 Frame。
5. 生成完成后报告覆盖数量。

## 15. 插件 UI 需求

UI 风格为 Figma 原生风格，浅色、简洁、紧凑。

核心界面模块：

1. Markdown 输入区：用于直接粘贴大纲。
2. 解析预览区：显示章节数、标题数、小节数、预计总页数。
3. 结构树预览：展示解析后的 `CHAPTER / TITLE / STEP` 层级。
4. 模板选择区：根据大纲层级自动显示对应模板下拉栏。
5. 属性检测区：显示当前模板中识别到的可注入属性。
6. 警告提示区：展示层级异常、模板缺失、属性未匹配、TOC 扩展等提示。
7. 生成按钮：执行页面生成。
8. 生成报告区：显示生成数量、覆盖数量、警告数量、最终页数。

## 16. 解析预览需求

用户粘贴 Markdown 后，插件需要在生成前展示预览。

预览内容：

```text
主题：Vision 名称
章节数：N
标题数：N
小节数：N
预计总页数：N
需要模板：COVER / TOC / CHAPTER / TITLE / STEP
```

结构树示例：

```text
CHAPTER 01：章节名
  TITLE 01：标题名
    STEP 01：小节名
    STEP 02：小节名
  TITLE 02：标题名
```

## 17. 异常与警告规则

Markdown 层级错误时，插件给出警告但允许生成。

常见警告：

1. 缺少 `《Vision》`。
2. 缺少 `# TOC`。
3. 出现未定义层级，例如 `####`。
4. `TITLE` 没有上级 `CHAPTER`。
5. `STEP` 没有上级 `TITLE`。
6. 模板未选择。
7. 模板中缺少对应属性。
8. TOC 内容超过模板容量并触发自动扩展。

警告需要明确指出问题位置和处理方式。

## 18. 生成报告

生成结束后，插件展示报告。

报告内容：

```text
生成完成
封面页：1
TOC 页：1
章节页：N
标题页：N
小节页：N
总页数：N
覆盖旧 Frame：N
警告：N
```

如果存在警告，需要逐条列出。

## 19. 验收标准

### 19.1 输入解析

1. 能正确解析 `《Vision》`、`# TOC`、`## CHAPTER`、`### TITLE`、`##### STEP`。
2. 能统计章节数、标题数、小节数和预计总页数。
3. 层级异常时给出警告但允许继续。

### 19.2 模板识别

1. 能扫描当前 Figma 文件中的 `PAGE_TEMP：` 模板。
2. 能根据大纲实际层级显示对应模板下拉栏。
3. 模板缺失时给出明确提示。

### 19.3 页面生成

1. 能生成封面页、TOC 页、章节页、标题页、小节页。
2. Frame 命名能反映大纲层级。
3. Frame 排列符合横向与纵向间距规则。
4. 重新生成时能覆盖旧结果并报告覆盖数量。

### 19.4 属性注入

1. 能完全匹配组件属性名。
2. 能注入章节名、标题名、小节名、页码、TOC 信息。
3. 能正确设置 `SHOW=true/false`。
4. 能正确设置 `HIGHLIGHT=on/off`。
5. 能根据页面类型尝试匹配 `TYPE` 变体。

### 19.5 TOC

1. TOC 能展示 `CHAPTER + TITLE`。
2. TOC 页码从第一页开始计算。
3. `TOC_NUM_TEXT` 格式为 `01/20`。
4. `TOC_PAGE_RANGE_TEXT` 格式为 `03-08`。
5. TOC 超出容量时能自动扩展并报告。

## 20. 参考资料

Figma 插件实现时应参考官方 Plugin API，尤其是组件属性、文本节点、字体加载和节点复制相关能力。

参考链接：

1. [Figma Plugin API - ComponentProperties](https://www.figma.com/plugin-docs/api/ComponentProperties/)
2. [Figma Plugin API - componentPropertyDefinitions](https://www.figma.com/plugin-docs/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/)
3. [Figma Plugin API - TextNode](https://www.figma.com/plugin-docs/api/TextNode/)
