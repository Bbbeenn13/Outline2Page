# v10.0 修复任务

## 任务 1：移除 TOC HIGHLIGHT 兼容逻辑

- 目标：TOC role 只由 `TYPE` 决定。
- 涉及文件：`src/figma/toc-expander.ts`。
- 完成标准：不存在 TOC 专用的 HIGHLIGHT role 解析。
- 测试要求：TOC 单测通过。

## 任务 2：移除误导性旧兼容测试

- 目标：测试只保留当前模板规则和必要基础兼容。
- 涉及文件：`tests/figma/toc-expander.test.ts`。
- 完成标准：删除 HIGHLIGHT 旧模板测试用例，保留 `TOC_NAV_item/TYPE` 测试。
- 测试要求：完整测试通过。

## 任务 3：验证与文档

- 目标：同步构建与复盘。
- 涉及文件：`code.js`、`docs/phase2.Fix Problem/RETRO.md`、`docs/phase2.Fix Problem/v10.0/*`。
- 完成标准：验证通过并记录。
- 测试要求：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 任务 4：移除 PAGE_NAV 写入器里的 TOC 字段残影

- 目标：PAGE_NAV 注入器只负责 `PAGE_*` 导航字段，TOC 字段只由 TOC 专属注入器处理。
- 涉及文件：`src/figma/navigation-injector.ts`、`tests/figma/navigation-injector.test.ts`。
- 完成标准：`PAGE_NAV_group` 即使暴露 `TOC_*_TEXT`，也不会由 PAGE_NAV 写入器写入。
- 测试要求：补充边界测试并通过完整验证。
