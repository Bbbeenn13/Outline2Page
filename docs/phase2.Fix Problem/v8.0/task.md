# v8.0 修复任务

## 任务 1：补充 TOC title 对位失败回归测试

- 目标：复现章节元数据写入成功但 title 槽不写入/不报警的问题。
- 涉及文件：`tests/figma/toc-expander.test.ts`。
- 完成标准：旧逻辑下失败，新逻辑通过。
- 测试要求：断言 title 文本、show 状态、warning。

## 任务 2：重写 TOC 暴露属性槽位模型

- 目标：按用户设计的暴露属性对位写入，不把章节当 title，也不漏写 title。
- 涉及文件：`src/figma/toc-expander.ts`。
- 完成标准：支持有分组前缀和无分组前缀两类 raw key。
- 测试要求：TOC 相关测试全部通过。

## 任务 3：验证与沉淀

- 目标：完整验证，修正 RETRO 中不可靠沉淀。
- 涉及文件：`docs/phase2.Fix Problem/RETRO.md`、`docs/phase2.Fix Problem/v8.0/*`、`code.js`。
- 完成标准：文档、测试、构建全部完成。
- 测试要求：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。
