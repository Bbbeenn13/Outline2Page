# v11.0 修复任务

## 任务 1：补充 TOC 写入失败回归测试

- 目标：复现 `SHOW` 写入失败导致整组文字无法落地的风险。
- 涉及文件：`tests/figma/toc-expander.test.ts`。
- 完成标准：新增测试证明 `SHOW` 失败时 `TOC_*_TEXT` 仍写入。
- 测试要求：TOC 单测失败后再修复，最终通过。

## 任务 2：增强 TOC 属性写入器

- 目标：TOC 写入批量失败后逐属性 fallback。
- 涉及文件：`src/figma/toc-expander.ts`。
- 完成标准：单个属性失败不会阻断同批其它文本属性。
- 测试要求：新增 TOC 回归测试通过，现有 TOC 对位测试不退化。

## 任务 3：同步构建产物与完整验证

- 目标：源码、测试和 `code.js` 一致。
- 涉及文件：`code.js`、相关测试文件、v11.0 文档、`RETRO.md`、必要时 `FIX_GUIDE.md`。
- 完成标准：完整验证通过并记录结果。
- 测试要求：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 任务 4：收尾复盘

- 目标：记录根因、有效检查、下次同类问题准则。
- 涉及文件：`docs/phase2.Fix Problem/v11.0/progress.md`、`debrief.md`、`RETRO.md`、必要时 `FIX_GUIDE.md`。
- 完成标准：文档反映最终修复和验证状态。
- 测试要求：文档不替代验证命令，必须引用真实命令结果。
