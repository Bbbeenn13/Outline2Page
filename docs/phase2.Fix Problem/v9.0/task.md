# v9.0 修复任务

## 任务 1：补 TYPE 对位测试

- 目标：覆盖 `TOC_NAV_item/TYPE` 对位写入四类 TOC 文本。
- 涉及文件：`tests/figma/toc-expander.test.ts`。
- 完成标准：测试断言章节、页码、页码范围、title 均写入正确槽位。
- 测试要求：包含多余 title 槽隐藏。

## 任务 2：实现 TOC_NAV_item TYPE 对位

- 目标：TOC 专属注入按 `TYPE` 识别槽位角色。
- 涉及文件：`src/figma/toc-expander.ts`。
- 完成标准：不依赖 `HIGHLIGHT` 即可完成写入。
- 测试要求：TOC 单测通过。

## 任务 3：完整验证

- 目标：确认修复不破坏现有生成链路。
- 涉及文件：`code.js`、`docs/phase2.Fix Problem/RETRO.md`。
- 完成标准：完整验证通过，文档更新。
- 测试要求：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。
