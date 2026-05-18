# v5.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。当前工作区已有用户/既有改动，本轮只记录并保护现状，不做提交。
- 相关既有改动：`src/ui.html`、`code.js`、`docs/phase3.Patch/` 等存在未提交变更。

## 检查清单

- [x] 读取项目指令。
- [x] 读取 Phase2 README 与 RETRO。
- [x] 判断本轮为 Phase2 Fix。
- [x] 创建 `v5.0` 修复文档。
- [x] 新增失败复现测试。
- [x] 实现修复。
- [x] 运行完整验证。
- [x] 写入 debrief 与 RETRO。

## 已确认决策

- 目录页标题扩展失败影响生成结果，进入 Phase2 Fix。
- TOC 标题槽位不足应优先扩展可 clone 的标题行/容器，而不是只 clone 内部实例。
- 普通属性注入器不应报告导航专属属性缺失。

## 未解决问题

- 暂无。

## 风险

- 真实 Figma 嵌套实例结构复杂，修复需保持对现有扁平槽位和暴露属性 key 的兼容。
- 缺失属性过滤不能隐藏普通内容区域的真实缺失。

## 下一步

交付给用户复测真实 Figma 目录页。

## 验证命令与结果

- `npx vitest run tests/figma/toc-expander.test.ts`：通过，8 个测试通过。
- `npx vitest run tests/figma/property-injector.test.ts`：通过，10 个测试通过。
- `npm test`：通过，16 个测试文件、87 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。
