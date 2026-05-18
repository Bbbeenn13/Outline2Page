# v10.0 TOC 旧 HIGHLIGHT 兼容移除方案

## 背景

用户确认最新 TOC 模板已经简化为 `TOC_NAV_item/TYPE + 对应 TEXT`，不需要继续兼容旧的 `HIGHLIGHT` 角色表达。

## 当前问题

- `toc-expander` 仍保留 `HIGHLIGHT` 作为 TOC item 角色来源。
- 旧兼容路径会增加判断复杂度，并可能在后续模板调整中再次干扰 `TYPE` 对位。
- 相关测试仍覆盖旧 `HIGHLIGHT` 场景，会误导后续维护。
- `navigation-injector` 里还残留 PAGE_NAV 写入 `TOC_*_TEXT` 的旧混用映射，属于 PAGE_NAV/TOC 边界污染。

## 目标方案

- TOC 只按 `TOC_NAV_item/TYPE` 识别角色。
- 移除 TOC 中 `HIGHLIGHT` 角色解析与槽位边界逻辑。
- 移除 HIGHLIGHT 旧兼容测试，保留 `TYPE` 对位测试。
- 移除 PAGE_NAV 写入器中的 `TOC_*_TEXT` 映射，TOC 字段只由 TOC 专属注入器处理。
- 不影响 `PAGE_NAV_group` 的 HIGHLIGHT 使用。

## 不做范围

- 不修改 PAGE_NAV_group。
- 不改 Markdown 解析、分页、布局。
- 不删除任何文件。

## 待确认问题

无。用户已明确不需要 HIGHLIGHT 旧兼容。

## 验收标准

- TOC role 仅来自 `TYPE=TOC_NUM/TOC_CHAPTER/TOC_PAGE_RANGE/TOC_TITLE`。
- TOC 单测和完整验证通过。
- `code.js` 同步更新。

## 已知风险

- 旧 HIGHLIGHT 模板不再被支持；这是本轮有意收敛。
