# v6.0 修复任务

## 任务 1：复现 TOC_NAV_group 被当作标题槽位复制

- 目标：用单元测试覆盖外层 `TOC_NAV_group` 同时暴露章节元数据和 `TOC_TITLE_TEXT`，且标题数量超过现有标题属性数量的场景。
- 涉及文件：`tests/figma/toc-expander.test.ts`。
- 完成标准：测试能证明修复后不会新增额外 `TOC_NAV_group`。
- 测试要求：断言 warnings、目录组数量、已写入标题属性。

## 任务 2：修复标题槽位 clone 候选选择

- 目标：限制标题槽位扩展只在当前目录行内部进行，不把 `TOC_NAV_group` 自身作为标题槽位候选。
- 涉及文件：`src/figma/toc-expander.ts`。
- 完成标准：安全候选可扩展；不安全候选返回 warning。
- 测试要求：新增测试通过，既有 TOC 扩展测试不回退。

## 任务 3：完整验证与构建

- 目标：确认修复不破坏现有生成链路，并同步构建产物。
- 涉及文件：`code.js`。
- 完成标准：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。
- 测试要求：记录所有验证结果到 `progress.md`。
