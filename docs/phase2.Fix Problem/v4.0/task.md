# Outline2Page Fix v4.0 Task

## 任务 1：记录本轮 fix 边界

- 目标：创建 v4.0 修复文档，记录问题、方案、验收标准和风险。
- 涉及文件：`docs/phase2.Fix Problem/v4.0/proposal.md`、`task.md`、`progress.md`、`debrief.md`。
- 完成标准：四个文档存在，且路径符合项目规范。
- 测试要求：无需运行代码测试。

## 任务 2：补充 chapter huge 导航回归测试

- 目标：用测试复现 `PAGE_CHAPTER_TEXT (HUGE)` 在导航区域不写入的问题。
- 涉及文件：`tests/figma/navigation-injector.test.ts`。
- 完成标准：新增测试在修复前失败，修复后通过。
- 测试要求：运行 `npm test -- tests/figma/navigation-injector.test.ts`。

## 任务 3：修复导航文本目标

- 目标：让 `navigation-injector` 对 chapter 导航项写入 `PAGE_CHAPTER_TEXT (HUGE)`。
- 涉及文件：`src/figma/navigation-injector.ts`。
- 完成标准：普通 key 与嵌套暴露 key 都能写入 chapter 标题。
- 测试要求：导航注入测试通过。

## 任务 4：完整验证并同步构建产物

- 目标：确认本轮修复不破坏类型、lint、测试和插件构建。
- 涉及文件：`code.js`。
- 完成标准：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。
- 测试要求：记录完整命令结果到 `progress.md`。

## 任务 5：收尾复盘

- 目标：写入 `debrief.md`，并把可复用教训合并到 `RETRO.md`。
- 涉及文件：`docs/phase2.Fix Problem/v4.0/debrief.md`、`docs/phase2.Fix Problem/RETRO.md`。
- 完成标准：复盘包含根因、正确判断、偏差、有效测试、下次准则和剩余风险。
- 测试要求：无需额外测试。
