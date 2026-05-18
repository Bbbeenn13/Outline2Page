# Outline2Page Fix 2.0 Task

## Task 1：完整 Frame 命名

目标：

- 将生成命名从 `页数.kind` 改为完整层级路径。
- 保留封面和目录的稳定短名：`00.cover`、`01.toc`。

涉及文件：

- `src/core/naming-service.ts`
- `tests/core/naming-service.test.ts`

完成标准：

- `CHAPTER` 输出 `02.<chapter>`。
- `TITLE` 输出 `03.<chapter>/<title>`。
- `STEP` 输出 `04.<chapter>/<title>/<step>`。
- 页码文本为单数字时补齐两位。
- 页码文本为空时回退到 `pageNumber`。

## Task 2：导航解析兼容完整路径

目标：

- 导航高亮从完整 frame 名推断当前页层级。
- 保留旧格式 `页数.kind` 兼容。
- 解析失败时继续回退到 page plan。

涉及文件：

- `src/figma/navigation-injector.ts`
- `tests/figma/navigation-injector.test.ts`

完成标准：

- `04.Chapter/Title/Step` 识别为小节页。
- `04.Chapter/Title` 识别为标题页。
- `04.step` 仍识别为小节页。
- `legacy_STEP_frame` 仍回退到 page plan。

## Task 3：文档、构建与验证

目标：

- 新建 `doc/fix/2.0` 管理本轮修复。
- 更新 `code.js`。
- 完整验证。

涉及文件：

- `doc/fix/2.0/proposal.md`
- `doc/fix/2.0/task.md`
- `doc/fix/2.0/progress.md`
- `code.js`

完成标准：

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
