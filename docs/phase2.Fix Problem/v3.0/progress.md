# Outline2Page Fix 3.0 Progress

## 当前状态

- 阶段：实现完成，已验证
- 本轮范围：修复 `PAGE_NAV_group` / `TOC_NAV_group` 的真实组件结构识别、内部 `NAV_item` 文本写入、单槽面包屑语义
- 关键用户确认：
  - Figma 导航 component 只有 `PAGE_NAV_group` 和 `TOC_NAV_group`
  - 外层 `TYPE` 只是样式变体，例如 `01/02/03`
  - 真正要写入的是内部 `NAV_item` 暴露出的 `_TEXT` 属性

## 进度

- [x] 确认 `PAGE_NAV_group` / `TOC_NAV_group` 是容器，不是文本槽位本身
- [x] 移除对错误外层语义属性的依赖
- [x] `PAGE_NAV_group` 优先遍历内部 `NAV_item`
- [x] 支持 `PAGE_CHAPTER/PAGE_TITLE/PAGE_STEP` 类型值
- [x] 支持 `NAV_item/PAGE_TITLE_TEXT#...` 这类嵌套属性 key
- [x] 支持外层实例暴露嵌套属性时的回退写入
- [x] `TOC_NAV_group` 按 `_TEXT` 属性名识别标题槽
- [x] 支持一个 TOC 实例上多个 `TOC_TITLE_TEXT#...` 槽位
- [x] 修复单个 `PAGE_CHAPTER` 槽位永远写第一个章节的问题
- [x] 修复单个 `PAGE_TITLE` 槽位和 frame 命名 title 不对应的问题
- [x] 补充导航回归测试
- [x] 补充 TOC 回归测试
- [x] 更新 `code.js`
- [x] 完整验证

## 关键结果

### PAGE_NAV_group

当前行为：

- `PAGE_NAV_group` 只用于识别页面导航容器。
- 内部 `NAV_item` 才被收集为导航项。
- `NAV_item.TYPE = PAGE_CHAPTER` -> 写 `PAGE_CHAPTER_TEXT`
- `NAV_item.TYPE = PAGE_TITLE` -> 写 `PAGE_TITLE_TEXT`
- `NAV_item.TYPE = PAGE_STEP` -> 写 `PAGE_STEP_TEXT`

单槽规则：

- 只有一个 `PAGE_CHAPTER` 时写当前章节。
- 只有一个 `PAGE_TITLE` 时写当前标题。
- 只有一个 `PAGE_STEP` 时写当前小节。

多槽规则：

- 多个 `PAGE_TITLE` 时写当前章节下的 title 列表。
- 多个 `PAGE_STEP` 时写当前 title 下的 step 列表。

### TOC_NAV_group

当前行为：

- `TOC_NAV_group` 作为目录行容器。
- 按 `TOC_NUM_TEXT`、`TOC_CHAPTER_TEXT`、`TOC_PAGE_RANGE_TEXT`、`TOC_TITLE_TEXT` 写入。
- 支持 `NAV_item/TOC_TITLE_TEXT#...` 这类嵌套 key。
- 不依赖外层 `TYPE` 判断目录语义。

## 修改文件

- `src/figma/navigation-injector.ts`
- `src/figma/toc-expander.ts`
- `tests/figma/navigation-injector.test.ts`
- `tests/figma/toc-expander.test.ts`
- `code.js`
- `docs/2.Fix Problem/v3.0/proposal.md`
- `docs/2.Fix Problem/v3.0/task.md`
- `docs/2.Fix Problem/v3.0/progress.md`

## 验证记录

- `npm test -- navigation-injector`：通过，12 tests
- `npm test`：通过，16 files / 85 tests
- `npm run typecheck`：通过
- `npm run lint`：通过
- `npm run build`：通过，已更新 `code.js`

## 风险与后续注意

1. Figma 对嵌套实例属性的暴露 key 可能包含组件名、斜杠和 `#` 后缀。后续新增组件时，应继续使用“归一化后缀匹配”，不要只匹配裸属性名。
2. 外层 `PAGE_NAV_group.TYPE` / `TOC_NAV_group.TYPE` 是样式选择，不应进入业务语义判断。
3. 如果未来需要自动增减 `PAGE_NAV_group` 中的导航槽，需要单独设计 clone 策略；本轮只写已有槽位。
4. 如果一个页面模板同时存在“当前面包屑槽位”和“列表槽位”，需要通过组件结构或命名进一步区分；当前规则以同类槽位数量作为判断依据。

## 复盘

这轮问题暴露出一个重要教训：组件名称相似不等于职责相同。`NAV_group`、`PAGE_NAV_group`、`TOC_NAV_group` 在 Figma 里承担的是容器职责，而真正的文本和状态槽位在内部 `NAV_item` 上。修复时必须先对齐用户的组件语义，再写代码规则；遇到不明确的变体属性用途时，应先确认它是“样式变体”还是“业务语义”。
