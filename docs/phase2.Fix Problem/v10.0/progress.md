# v10.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。
- Git 状态：存在 v6-v9 未提交改动，本轮继续修正，不删除文件。

## 检查清单

- [x] 读取用户最新要求。
- [x] 创建 `v10.0` 修复文档。
- [x] 移除 TOC HIGHLIGHT 兼容逻辑。
- [x] 移除旧兼容测试。
- [x] 全项目扫描类似历史兼容冗余。
- [x] 移除 PAGE_NAV 写入器中遗留的 TOC 字段映射。
- [x] 运行完整验证。
- [x] 写入 debrief 与 RETRO。
- [x] 收敛 RETRO 中 v5-v8 的旧 TOC 结论，避免把废弃结构继续列为当前必测或长期风险。
- [x] 对 RETRO 中容易污染后续判断的旧 TOC 总结行添加删除线，保留历史但明确不再作为当前准则。
- [x] 新增 `FIX_GUIDE.md` 作为当前行动地图，并调整 Fix 工作流为“当前指南 + 最新版本优先，历史索引按需追溯”。

## 已确认决策

- TOC 不再兼容旧 HIGHLIGHT 模板。
- PAGE_NAV_group 不受影响。
- TOC 不再兼容旧 `NAV_item/TOC_*`、row-level `TOC_*_TEXT`、按文本名猜角色等历史结构。
- `PAGE_NAV_group` 的 `HIGHLIGHT` 是当前正确实现的一部分，不属于本轮可删冗余。
- `PAGE_NAV_group` 不再写入 `TOC_*_TEXT`，TOC 字段归 TOC 专属注入器处理。
- `layout-engine` 的 fallback size 是安全兜底，不属于历史结构兼容。

## 未解决问题

- 暂无。

## 风险

- 旧 TOC HIGHLIGHT 模板将不再可用。
- 旧 TOC `NAV_item` 模板、row-level TOC 文本模板将不再可用。

## 下一步

交付用户重新加载插件复测当前简化模板。

## 验证命令与结果

- `npx vitest run tests/figma/navigation-injector.test.ts tests/figma/toc-expander.test.ts`：通过，2 个测试文件、20 个测试通过。
- `npm test`：通过，16 个测试文件、87 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。

## 文档收敛补充

- `RETRO.md` 已区分 `PAGE_NAV_group` 与 `TOC_NAV_group`：PAGE_NAV 继续保留 `HIGHLIGHT`，TOC 只支持 `TOC_NAV_item/TYPE + 对应 TEXT`。
- 旧 TOC 的 `HIGHLIGHT` / `NAV_item/TOC_*` / row-level TOC_TEXT 已从当前必测项和长期风险中移除，只作为历史走偏记录保留。
- PAGE_NAV 写入器中遗留的 `TOC_CHAPTER_TEXT`、`TOC_TITLE_TEXT`、`TOC_NUM_TEXT` 映射已移除，并补充“不写 TOC 字段”的回归测试。
- v5-v8 中关于旧 `NAV_item + HIGHLIGHT`、旧嵌套 `NAV_item/TOC_*`、row-level TOC_TEXT 的误导性总结行已用删除线标注，不删除整行。
- `FIX_GUIDE.md` 已接管当前开发/决策/修复/测试规则；`RETRO.md` 降级为历史索引，后续不再默认通读或全量维护旧历史。
