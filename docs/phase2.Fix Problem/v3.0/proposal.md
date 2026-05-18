# Outline2Page Fix Proposal 3.0

## 背景

Fix 2.0 已完成完整 frame 命名与导航高亮解析兼容。本轮 3.0 聚焦 Figma 导航组件真实结构与注入逻辑不一致的问题。

用户确认当前 Figma 导航组件只有两个外层组件：

- `PAGE_NAV_group`
- `TOC_NAV_group`

它们的外层 `TYPE` 只是样式变体，例如 `01`、`02`、`03`，不能用来判断 `CHAPTER`、`TITLE`、`STEP`。真正需要写入的是内部 `NAV_item` 暴露出来的 `_TEXT`、`SHOW`、`HIGHLIGHT` 等属性。

## 当前问题

1. 旧逻辑曾把 `PAGE_NAV_group` 或泛化的 `NAV_group` 当作导航项本身。
2. 旧逻辑依赖外层或错误命名的 `TYPE`，导致写入目标和用户真实组件结构错位。
3. `PAGE_NAV_group` 内部的 `NAV_item.TYPE` 实际是：
   - `PAGE_CHAPTER`
   - `PAGE_TITLE`
   - `PAGE_STEP`
4. Figma 会把嵌套组件属性暴露成类似 `NAV_item/PAGE_TITLE_TEXT#...` 的 key，旧逻辑只按裸属性名匹配，容易漏写。
5. 单个 `PAGE_CHAPTER` 或 `PAGE_TITLE` 槽位实际是当前页面面包屑，不应该永远写文档第一个章节或当前章节第一个标题。
6. `TOC_NAV_group` 同样不能依赖外层 `TYPE` 语义，目录标题应按 `_TEXT` 属性槽位写入。

## 修复原则

1. 不再新增或依赖 `FRONT_NAVGROUP_TYPE`、`PAGE_NAVGROUP_TYPE` 等外层语义判断。
2. 外层 `PAGE_NAV_group` / `TOC_NAV_group` 只作为导航容器识别。
3. 页面导航优先遍历内部 `NAV_item`。
4. 只有内部 `NAV_item` 不可写时，才回退到外层实例暴露的嵌套属性。
5. 导航项语义来源优先级：
   - 内部 `NAV_item.TYPE = PAGE_CHAPTER/PAGE_TITLE/PAGE_STEP`
   - 属性名后缀：`PAGE_CHAPTER_TEXT/PAGE_TITLE_TEXT/PAGE_STEP_TEXT`
6. 文本写入使用属性名后缀匹配，兼容 `NAV_item/PAGE_TITLE_TEXT#...`。
7. 同类导航槽位只有一个时，将其视为当前 frame/page 的面包屑槽位。
8. 同类导航槽位有多个时，将其视为当前层级下的列表槽位，按视觉顺序写入。

## 目标设计

### PAGE 导航

`PAGE_NAV_group` 下的内部 `NAV_item` 应按如下规则处理：

- `TYPE=PAGE_CHAPTER` 写入 `PAGE_CHAPTER_TEXT`
- `TYPE=PAGE_TITLE` 写入 `PAGE_TITLE_TEXT`
- `TYPE=PAGE_STEP` 写入 `PAGE_STEP_TEXT`
- `SHOW` 控制是否显示
- `HIGHLIGHT` 控制当前项高亮

单槽语义：

- 只有 1 个 `PAGE_CHAPTER`：写当前页面所属章节。
- 只有 1 个 `PAGE_TITLE`：写当前页面所属标题。
- 只有 1 个 `PAGE_STEP`：写当前页面所属小节。

多槽语义：

- 多个 `PAGE_CHAPTER`：按全文章节列表写入。
- 多个 `PAGE_TITLE`：按当前章节下的标题列表写入。
- 多个 `PAGE_STEP`：按当前标题下的小节列表写入。

### TOC 导航

`TOC_NAV_group` 仍作为目录行容器。写入时不把外层 `TYPE` 当作章节/标题语义，而是按暴露的 `_TEXT` 属性名写：

- `TOC_NUM_TEXT`
- `TOC_CHAPTER_TEXT`
- `TOC_PAGE_RANGE_TEXT`
- `TOC_TITLE_TEXT`

对于多个 `TOC_TITLE_TEXT#...` 或 `NAV_item/TOC_TITLE_TEXT#...`，按槽位顺序逐个写入当前章节下的标题。

## 不做范围

- 不改 Figma 组件库结构。
- 不改外层 `TYPE` 的样式变体用途。
- 不新增新的导航组件类型。
- 不引入新依赖。
- 不自动 clone 不足的 `PAGE_NAV_group` 导航槽，除非后续用户明确要求。

## 验收标准

1. `PAGE_NAV_group` 内部 `NAV_item` 可以正确写入真实章节、标题、小节文本。
2. `PAGE_NAV_group` 中单个 `PAGE_TITLE` 槽位和 frame 命名里的 title 对齐。
3. `PAGE_NAV_group` 中单个 `PAGE_CHAPTER` 槽位和当前 frame 所属 chapter 对齐。
4. 多个 title 槽位仍按当前章节下的 title 列表写入并正确高亮。
5. `TOC_NAV_group` 能识别嵌套前缀的 `TOC_TITLE_TEXT` 属性。
6. `code.js` 重新构建。
7. `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。

## 复盘结论

这次问题的核心不是 Figma 不支持写入，而是代码错误理解了组件边界：`PAGE_NAV_group` / `TOC_NAV_group` 是容器，内部 `NAV_item` 才是语义和文本槽位所在。后续处理类似组件时，必须先确认 Figma 组件结构和属性暴露路径，不能把外层变体属性当作业务语义。
