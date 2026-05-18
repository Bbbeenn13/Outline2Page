# v8.0 修复复盘

## 本轮问题根因

- `TOC_NAV_group` 的实现没有像 `PAGE_NAV_group` 那样稳定按暴露出的 `NAV_item` 对位写入。
- v7.0 仍按 raw key 前缀合并暴露属性；当 Figma API 给多个 `NAV_item` 暴露属性使用同一前缀时，多个槽位被合成一个槽位，`TOC_CHAPTER` 和 `TOC_TITLE` 对位混乱。
- 最新截图中的表现是章节写入成功，但 title 槽为空，说明数据存在，失败点在暴露属性槽位分配。

## 有效判断

- 用户指出 `PAGE_NAV_group` 正确，是最关键的校准：TOC 不需要复杂新模型，只需要沿用“收集 `NAV_item` + 按 `HIGHLIGHT` 角色写入”的模式。
- 以每个 `HIGHLIGHT` 作为槽位边界，比按 raw key 前缀合并更符合 Figma 面板中多组 `NAV_item` 的实际含义。

## 走偏判断

- v5/v6 过度聚焦 clone。
- v7 虽然开始看 `HIGHLIGHT`，但仍把 raw key 分组想复杂了，没彻底回到 PAGE_NAV 的实现范式。

## 有效测试或检查

- 新增 repeated `NAV_item` 前缀测试，覆盖多个 `HIGHLIGHT` 在同一前缀下时不能合并槽位。
- 完整验证覆盖 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 下次同类问题操作准则

- 已有正确实现时，优先对齐既有实现的抽象，不要另起一套推断模型。
- Figma 面板重复显示同名嵌套实例时，`HIGHLIGHT` 这种角色属性可以作为槽位边界。
- TOC 写入必须明确保证：`TOC_CHAPTER_TEXT` 只写章节，`TOC_TITLE_TEXT` 只写标题。

## 剩余风险

- 如果真实 raw key 顺序不是 `HIGHLIGHT -> TEXT -> SHOW`，仍可能需要按属性 id 再补兼容。
