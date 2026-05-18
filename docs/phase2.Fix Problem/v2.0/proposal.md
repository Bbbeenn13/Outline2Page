# Outline2Page Fix Proposal 2.0

## 背景

Fix 1.0 已完成字段映射、`NAV_group` 导航注入、短格式 frame 命名与构建验证。用户进一步明确：frame 命名必须是完整层级路径，而不是 `04.step` 这样的短类型名。

本轮 2.0 只修复 frame 命名与依赖 frame 名的导航解析，不扩大到 UI、属性注入或模板扫描。

## 当前问题

1. `createFrameName` 当前会生成 `00.cover`、`01.toc`、`02.chapter`、`03.title`、`04.step`。
2. 用户需要完整格式：`<page>.<chapter>/<title>/<step>`。
3. 导航高亮逻辑当前只解析 `页数.kind`，不能从完整层级路径判断当前页层级。

## 目标设计

Frame 命名最终采用：

- 封面：`00.cover`
- 目录：`01.toc`
- 章节页：`02.<chapter>`
- 标题页：`03.<chapter>/<title>`
- 小节页：`04.<chapter>/<title>/<step>`

其中：

- `<page>` 使用两位页码。
- `<chapter>`、`<title>`、`<step>` 使用大纲中的真实文字。
- 空白文本会被压缩并裁剪首尾空格。
- 如果某层文字缺失，使用对应层级的英文 fallback：`chapter`、`title`、`step`。

导航解析策略：

- 优先解析完整路径：一个路径段为章节页，两个路径段为标题页，三个路径段为小节页。
- 兼容旧格式：`04.chapter`、`04.title`、`04.step`。
- 如果 frame 名无法解析，继续回退到 `PagePlanItem.kind`。

## 不做范围

- 不修改属性映射 UI。
- 不修改 `NAV_group` 数据写入规则。
- 不修改大纲解析模型。
- 不创建或删除模板节点。

## 验收标准

1. 生成的章节/标题/小节 frame 名符合 `<page>.<chapter>/<title>/<step>`。
2. 导航高亮能识别完整路径命名。
3. 旧的 `页数.kind` 短格式仍能被识别，避免旧文件行为断裂。
4. `code.js` 重新构建。
5. `npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。

## 已确认决策

- 这轮修复归档到 `doc/fix/2.0`。
- 1.0 保持为上一轮历史记录。
