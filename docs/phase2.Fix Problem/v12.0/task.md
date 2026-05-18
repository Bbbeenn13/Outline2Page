# v12.0 修复任务

## 任务 1：改造 TOC 单测为扁平 item 协议

- 目标：测试表达新的当前协议，而不是外层 `TOC_NAV_item/...` 嵌套暴露属性。
- 涉及文件：`tests/figma/toc-expander.test.ts`。
- 完成标准：测试中的 `TOC_NAV_group` 包含内部独立 item instance，每个 item 自带 `TYPE` 和对应文本属性。
- 测试要求：覆盖 row 扩展、四类文本写入、多余 title 隐藏、title item clone、`SHOW` 失败不阻断文本。

## 任务 2：收敛 `toc-expander` 到扁平扫描写入

- 目标：TOC 像 PAGE_NAV 一样扫描内部 item instance，通过 item 自己的 `TYPE` 判定角色。
- 涉及文件：`src/figma/toc-expander.ts`。
- 完成标准：移除外层 `TOC_NAV_item/...` 分组解析路径，写入内部 item 自身属性。
- 测试要求：TOC 单测通过。

## 任务 3：完整验证与构建

- 目标：源码、测试和构建产物一致。
- 涉及文件：`code.js`、相关测试文件。
- 完成标准：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 通过。
- 测试要求：记录真实命令结果。

## 任务 4：文档收敛

- 目标：更新当前指南和历史索引，避免后续 agent 回到嵌套 TOC 暴露属性路线。
- 涉及文件：`docs/phase2.Fix Problem/FIX_GUIDE.md`、`RETRO.md`、`v12.0/progress.md`、`v12.0/debrief.md`。
- 完成标准：当前规则明确 TOC/PAGE_NAV 统一扁平 item 协议，旧嵌套 TOC 暴露属性不再作为支持目标。
- 测试要求：文档不替代验证命令。
