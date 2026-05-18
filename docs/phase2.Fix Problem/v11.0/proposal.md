# v11.0 TOC_NAV_group 文字写入修复方案

## 背景

用户复测最新模板后反馈：`TOC_NAV_group` 仍无法注入文字。截图显示当前模板结构为 `TOC_NAV_group` 内暴露多个 `TOC_NAV_item`，每个 item 通过 `TYPE` 表达角色，并暴露对应文本字段。

## 当前问题

- `toc-expander` 会把同一个 TOC item 的文本字段和 `SHOW` 字段放入同一次 `setProperties` 调用。
- Figma 的 `setProperties` 是原子写入：如果同包中的某个属性值被拒绝，整包会失败。
- 因此当 `SHOW` 或同组某个属性写入失败时，对应文本也不会落地，表现为 `TOC_NUM_TEXT`、`TOC_CHAPTER_TEXT`、`TOC_PAGE_RANGE_TEXT`、`TOC_TITLE_TEXT` 都停留在模板默认值。
- `PAGE_NAV` 已有逐属性 fallback，TOC 写入器还没有同等级保护。

## 目标方案

- TOC 写入先尝试批量写入，失败后自动降级为逐属性写入。
- 某个 `SHOW` 或其它属性失败时，只记录 warning，不阻断同组文本属性写入。
- 保持当前 TOC 结构规则不变：只支持 `TOC_NAV_item/TYPE + 对应 TEXT`。
- 增加回归测试，复现 `SHOW` 写入失败但文字仍必须写入。
- 同步更新构建产物 `code.js`。

## 不做范围

- 不回加旧 `HIGHLIGHT`、旧 `NAV_item/TOC_*`、row-level `TOC_*_TEXT` 兼容路径。
- 不改变 PAGE_NAV 的 `HIGHLIGHT` 行为。
- 不修改 Markdown 解析、分页和模板扫描业务规则。
- 不删除任何文件。

## 待确认问题

无。当前目标是修复已确认模板结构下的写入失败。

## 验收标准

- `TOC_NAV_item/TYPE` 对位仍正确写入四类 TOC 文本。
- 当 `SHOW` 写入失败时，文本字段仍然成功写入，并输出明确 warning。
- TOC 单测覆盖该失败模式。
- `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 通过。

## 风险

- 如果真实模板中的文本属性本身不存在或文本属性值类型不是 `TEXT`，代码只能输出 warning，仍需要模板侧修正。
- 如果 Figma 暴露属性 raw key 格式与现有测试差异很大，后续还需要基于扫描日志继续收敛 key 分组规则。
