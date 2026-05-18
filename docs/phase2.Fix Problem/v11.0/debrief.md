# v11.0 修复复盘

## 本轮问题根因

- `toc-expander` 把同一个 TOC item 的文本字段和 `SHOW` 字段放在同一次 `setProperties` 里写入。
- Figma 写 component properties 时使用完整 raw key；如果同包写入里某个属性值被拒绝，整包写入会失败，导致文本也没有落地。
- `normalizeComponentPropertyName` 过去在第一个 `#` 处截断整条属性路径；遇到 `TOC_NAV_item#.../TOC_TITLE_TEXT#...` 这类嵌套路径时，会把后半段业务属性名截掉，导致 TOC item 识别不稳。

## 正确判断

- 继续坚持当前 TOC 主结构 `TOC_NAV_item/TYPE + 对应 TEXT` 是对的，不需要回加旧 `HIGHLIGHT` 或旧 `NAV_item/TOC_*`。
- PAGE_NAV 已经具备“批量失败后逐属性写入”的保护，TOC 应补齐同级别写入安全性。
- Figma 属性 raw key 必须用于实际写入；归一化只能用于匹配，不能替代 raw key。

## 走偏判断

- v10 收敛了模板结构，但没有同步审视 `setProperties` 的失败粒度，导致“结构识别正确但写入被同包失败拖死”。
- 之前的归一化测试只覆盖属性名末尾 `#id`，没有覆盖嵌套路径中间段也带 `#id` 的情况。

## 有效测试或检查

- 新增 `keeps writing TOC text when SHOW write fails`，复现 `SHOW` 失败时文本仍应写入。
- 新增 `recognizes TOC_NAV_item keys when nested path segments have Figma id suffixes`，覆盖嵌套路径带 `#id` 的 raw key。
- `npx vitest run tests/figma/toc-expander.test.ts` 先红后绿，证明修复命中目标。
- 完整验证：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。

## 下次同类问题操作准则

- 专属注入器凡是一次写入多个 component properties，都必须具备批量失败后的逐属性 fallback。
- 业务匹配时可以归一化 `#id`，但实际 `setProperties` 必须使用 Figma 返回的完整 raw key。
- TOC 的结构规则仍只看 `TOC_NAV_item/TYPE`，写入失败要 warning，不要为了失败兜底回加旧模板路径。

## 仍需注意的风险

- 如果模板根本没有暴露对应 `TOC_*_TEXT`，代码不能写入，只能 warning。
- 如果未来 Figma raw key 出现新的路径分隔形态，需要用真实扫描日志补 fixture。
