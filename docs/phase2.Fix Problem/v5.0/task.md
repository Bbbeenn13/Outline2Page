# v5.0 修复任务

## 任务 1：复现 TOC 嵌套标题槽位扩展失败

- 目标：新增测试覆盖 `TOC_TITLE_TEXT` 位于嵌套 `NAV_item` 内，内部标题槽位不可 clone，但父级标题行可 clone 的情况。
- 涉及文件：`tests/figma/toc-expander.test.ts`、`tests/figma/figma-mock.ts`
- 完成标准：测试能在旧逻辑下暴露 `TOC_TITLE_SLOT_CLONE_FAILED`。
- 测试要求：纳入 `npm test`。

## 任务 2：修复 TOC 标题槽位扩展策略

- 目标：标题槽位不足时 clone 合适的标题行容器或父级节点，再重新收集槽位写入。
- 涉及文件：`src/figma/toc-expander.ts`
- 完成标准：嵌套标题槽位可扩展，已有扁平槽位行为不退化。
- 测试要求：`toc-expander` 全部测试通过。

## 任务 3：修复导航属性缺失误报

- 目标：普通属性注入跳过导航容器时，不再把导航专属目标计入缺失属性。
- 涉及文件：`src/figma/property-injector.ts`、`tests/figma/property-injector.test.ts`
- 完成标准：普通内容缺失仍报告，导航属性缺失误报消失。
- 测试要求：`property-injector` 全部测试通过。

## 任务 4：完整验证与文档收尾

- 目标：运行完整验证并更新 `progress.md`、`debrief.md`、`RETRO.md`。
- 涉及文件：`docs/phase2.Fix Problem/v5.0/*`、`docs/phase2.Fix Problem/RETRO.md`
- 完成标准：验证结果明确记录，跨版本教训完成沉淀。
- 测试要求：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。
