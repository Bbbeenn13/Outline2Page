# v7.0 修复复盘

## 本轮问题根因

- v5.0/v6.0 把问题过早收敛到 clone 策略，忽略了真实模板中 `TOC_NAV_group` 暴露的是多组 `NAV_item` 属性。
- 真实 TOC 行里每个 `NAV_item` 的业务角色由 `HIGHLIGHT` 变体值区分，例如 `TOC_NUM`、`TOC_CHAPTER`、`TOC_PAGE`、`TOC_TITLE`。
- 旧逻辑按整个实例判断“是否有元数据”，导致同一 `TOC_NAV_group` 实例里的 title 槽位拿不到自己的 `SHOW` 控制；多余 title 槽不会被隐藏，旧 override 或旧默认值看起来像缓存。
- 旧版本遗留的默认命名生成 Section 如果没有 pluginData 标记，也不会被清理，可能让用户看到旧结果叠在新结果里。

## 有效判断

- 用户提到“像读缓存、不会随大纲变化”是关键线索，说明不能只检查 title 文本是否写入，还要检查旧槽位是否被隐藏、旧生成结果是否被清理。
- 按 `NAV_item` 暴露属性分组，并用 `HIGHLIGHT` 解析 TOC 角色，能更贴近真实 Figma 面板结构。

## 走偏判断

- v5.0 的“沿父级 clone 可复制容器”只能解决部分嵌套槽位不足，不等于解决真实 title 注入。
- v6.0 的“禁止越界 clone `TOC_NAV_group`”能避免一种重复行，但仍未处理 row-level 多组 `NAV_item` 暴露属性和旧值残留。
- RETRO 中关于 v5/v6 的沉淀不能继续作为完整结论，只能保留为局部边界经验。

## 有效测试或检查

- 新增 `writes exposed NAV_item groups by HIGHLIGHT role and hides stale surplus title slots`，复现并修复旧 title 槽 `SHOW` 不关闭的问题。
- 新增旧版本默认命名生成 Section 清理测试，防止旧输出叠在新输出下。
- 完整验证覆盖 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 下次同类问题操作准则

- Figma 面板显示分组属性时，必须按 raw key 的分组前缀建模，不能只做全实例级别的属性名匹配。
- `HIGHLIGHT` 在不同组件里可能不是“是否高亮”，也可能是业务角色选择；写入前必须先判断它的取值语义。
- 用户描述“像缓存”时，要同时检查旧生成结果清理、旧 override 清空、隐藏状态写入，而不是只查新文本值。

## 剩余风险

- 如果真实 raw key 与当前模拟的 `NAV_item n/TOC_TITLE_TEXT#...` 形态仍不同，需要继续根据扫描输出补兼容。
- 如果模板没有暴露 `SHOW`，代码只能清空多余 title 文本，无法强制隐藏对应视觉槽。
