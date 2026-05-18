# v6.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。当前工作区初始检查为干净状态，本轮不额外创建备份提交。
- Git 状态：`## main...origin/main`。

## 检查清单

- [x] 读取项目指令。
- [x] 读取 Phase2 README 与 RETRO。
- [x] 读取上一轮 v5.0 文档。
- [x] 检查 Git 状态。
- [x] 判断本轮为 Phase2 Fix。
- [x] 创建 `v6.0` 修复文档。
- [x] 新增失败复现测试。
- [x] 实现修复。
- [x] 运行完整验证。
- [x] 写入 debrief 与 RETRO。

## 已确认决策

- 本轮问题影响 TOC 生成结果和模板写入，进入 Phase2 Fix。
- 标题槽位不足时不能复制整张 `TOC_NAV_group`，否则会产生额外章节卡片。
- 如果模板没有可安全扩展的内部标题槽位，应给 warning，而不是静默生成错误结构。

## 未解决问题

- 暂无。

## 风险

- 真实 Figma 中外层暴露属性和内部实例属性可能同时存在，修复不能破坏内部 `NAV_item` 可 clone 的正常模板。

## 下一步

交付给用户重新加载插件并复测真实 Figma 目录页。

## 验证命令与结果

- `npx vitest run tests/figma/toc-expander.test.ts`：通过，9 个测试通过。
- `npm test`：通过，16 个测试文件、88 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。
