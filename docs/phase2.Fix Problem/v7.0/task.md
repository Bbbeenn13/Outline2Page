# v7.0 修复任务

## 任务 1：重新评估 v5.0/v6.0 有效性

- 目标：明确哪些结论不可继续沿用。
- 涉及文件：`docs/phase2.Fix Problem/RETRO.md`、`docs/phase2.Fix Problem/v7.0/debrief.md`。
- 完成标准：RETRO 中标记 v5/v6 的局限或修正沉淀。
- 测试要求：无代码测试，但必须基于代码与回归测试结论。

## 任务 2：复核生成链路是否存在旧节点/旧 override 复用

- 目标：确认 `createNodeFromTemplate`、generated section 清理、TOC 注入顺序是否会造成缓存式旧值。
- 涉及文件：`src/figma/node-factory.ts`、`src/figma/generated-section-manager.ts`、`src/main.ts`。
- 完成标准：若存在复用问题，新增回归测试并修复；若不存在，记录证据。
- 测试要求：必要时补 integration 或 figma 单元测试。

## 任务 3：复核 TOC 属性写入模型

- 目标：确认 `TYPE/HIGHLIGHT/SHOW/TOC_TITLE_TEXT` 是否需要共同写入，避免写到不可见或错误变体。
- 涉及文件：`src/figma/toc-expander.ts`、`tests/figma/toc-expander.test.ts`。
- 完成标准：不同大纲生成不同 title 文本；旧值不残留。
- 测试要求：新增至少一个会在旧逻辑下失败的 TOC 回归测试。

## 任务 4：完整验证与构建

- 目标：确认修复不破坏现有行为，并同步 `code.js`。
- 涉及文件：`code.js`。
- 完成标准：完整验证通过。
- 测试要求：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。
