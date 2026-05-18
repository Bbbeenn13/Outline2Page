# v7.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。
- Git 状态：存在上一轮 v6.0 未提交改动与文档，本轮会在此基础上审视并必要时修正，不做批量删除。

## 检查清单

- [x] 读取 structured-fix-workflow。
- [x] 读取 Git 状态。
- [x] 读取 RETRO。
- [x] 创建 `v7.0` 修复文档。
- [x] 复核生成链路。
- [x] 复核 TOC 属性写入模型。
- [x] 新增失败复现测试。
- [x] 实现修复。
- [x] 运行完整验证。
- [x] 写入 debrief 与修正 RETRO。

## 已确认决策

- v5.0/v6.0 没有解决真实 title 注入问题，它们的沉淀不能直接作为后续前提。
- 本轮先排查“旧值残留/缓存感”的原因，再决定是否保留、回滚或改写 v6.0 代码。
- 生成链路不是典型内存缓存，但旧版本遗留的默认命名生成 Section 如果没有 pluginData，旧结果可能叠在新结果中。
- 真实 TOC 模板的 `NAV_item` 角色主要由 `HIGHLIGHT=TOC_NUM/TOC_CHAPTER/TOC_PAGE/TOC_TITLE` 表达，TOC 注入必须按暴露属性分组写入。

## 未解决问题

- 暂无。

## 风险

- 真实模板可能依赖 `HIGHLIGHT` 变体来决定每个 `NAV_item` 显示哪种文本，如果只写 `_TEXT` 不写变体，表现会像旧内容残留。

## 下一步

交付用户重新加载插件并用不同大纲连续生成复测。

## 验证命令与结果

- `npx vitest run tests/figma/toc-expander.test.ts`：通过，10 个测试通过。
- `npx vitest run tests/figma/generated-section-manager.test.ts`：通过，4 个测试通过。
- `npm test`：通过，16 个测试文件、90 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。
