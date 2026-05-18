# v8.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。
- Git 状态：存在 v6/v7 相关未提交改动，本轮继续在其上修正，不删除历史文档。

## 检查清单

- [x] 根据最新截图重新判断问题。
- [x] 创建 `v8.0` 修复文档。
- [x] 新增失败复现测试。
- [x] 实现 TOC 槽位模型修复。
- [x] 运行完整验证。
- [x] 写入 debrief 与 RETRO。

## 已确认决策

- 本轮问题不是 parser 缺失 title，而是 TOC 暴露属性对位写入失败。
- 不能再把 v5/v6/v7 的结论当作完整修复。
- `TOC_NAV_group` 应按 `PAGE_NAV_group` 的正确实现理解：收集暴露出来的 `NAV_item`，按 `HIGHLIGHT` 角色对位写入。
- 当多个暴露 `NAV_item` 的 raw key 前缀相同，必须以每个 `HIGHLIGHT` 作为新槽位边界，不能按前缀合并成一个槽位。

## 未解决问题

- 暂无。

## 风险

- 如果 Figma API raw key 与测试模拟仍有差异，需要进一步加调试输出。

## 下一步

交付用户重新加载插件复测 TOC。

## 验证命令与结果

- `npx vitest run tests/figma/toc-expander.test.ts`：通过，11 个测试通过。
- `npm test`：通过，16 个测试文件、91 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。
