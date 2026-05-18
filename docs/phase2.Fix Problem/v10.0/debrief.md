# v10.0 修复复盘

## 本轮问题根因

- TOC 在 v5-v9 中累积了多条历史结构兼容路径：`HIGHLIGHT` 角色、旧 `NAV_item/TOC_*` 前缀、row-level `TOC_*_TEXT`、按文本属性名猜角色。
- 用户当前模板已经明确收敛为 `TOC_NAV_item/TYPE + 对应 TEXT`，旧路径继续存在会增加复杂度并干扰判断。
- PAGE_NAV 写入器里仍残留 `TOC_*_TEXT` 写入映射，这是早期 PAGE_NAV/TOC 导航抽象混用留下的边界污染。

## 有效判断

- 全项目扫描后，真正应该减负的是 TOC 专属历史结构；`PAGE_NAV_group` 的 `HIGHLIGHT` 仍是当前正确实现，不应删除。
- `layout-engine` 的 fallback size、旧生成 Section 清理属于安全兜底，不是模板结构兼容冗余。
- PAGE_NAV 只写 `PAGE_*` 字段、TOC 只走 `TOC_NAV_item/TYPE`，边界更清楚。

## 走偏判断

- 之前为了追真实模板，不断叠加兼容分支，导致 TOC 逻辑过度复杂。
- v10 应该按用户当前模板收敛，而不是继续保留旧模板迁移成本。

## 有效测试或检查

- `toc-expander` 测试从 12 个收敛到 6 个，删除 HIGHLIGHT / old NAV_item / row-level TOC_TEXT 兼容测试。
- `rg` 确认 `src/figma/toc-expander.ts` 与 `tests/figma/toc-expander.test.ts` 不再出现 TOC 的 `HIGHLIGHT` 或旧 `NAV_item/TOC` 路径。
- `navigation-injector` 新增边界测试，确认 `PAGE_NAV_group` 不会写入 `TOC_*_TEXT`。
- 完整验证覆盖 `npm test`（16 个测试文件、87 个测试通过）、`npm run typecheck`、`npm run lint`、`npm run build`。

## 下次同类问题操作准则

- 用户确认模板升级后，应删除旧结构主路径与测试，不要长期并存。
- TOC 当前唯一主结构：`TOC_NAV_group` 暴露 `TOC_NAV_item`，每个 item 用 `TYPE` 表达角色。
- PAGE_NAV 和 TOC 的字段写入边界要分开，不能再用 PAGE_NAV 写入器兜 TOC 字段。
- 清理兼容逻辑时要区分“模板历史兼容”和“安全兜底”，不要误删后者。

## 剩余风险

- 旧 TOC 模板不再支持；这是本轮有意减负。
