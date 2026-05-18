# v9.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。
- Git 状态：存在 v6-v8 未提交改动，本轮继续修正，不删除历史文件。

## 检查清单

- [x] 读取用户最新截图与说明。
- [x] 创建 `v9.0` 修复文档。
- [x] 新增 TYPE 对位测试。
- [x] 实现修复。
- [x] 运行完整验证。
- [x] 写入 debrief 与 RETRO。

## 已确认决策

- `TOC_NAV_group` 不需要理会 `HIGHLIGHT`。
- `TOC_NAV_item` 通过 `TYPE` 表达角色。
- title 槽位调整仅围绕 `TYPE=TOC_TITLE`。
- 代码必须识别 `TOC_NAV_item` 暴露属性，不能只识别旧的 `NAV_item`。
- 多个 `TYPE` 属性连续出现时，每个 `TYPE` 是一个 item 槽位边界。

## 未解决问题

- 暂无。

## 风险

- 暂无。

## 下一步

交付用户重新加载插件复测。

## 验证命令与结果

- `npx vitest run tests/figma/toc-expander.test.ts`：通过，12 个测试通过。
- `npm test`：通过，16 个测试文件、92 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。
