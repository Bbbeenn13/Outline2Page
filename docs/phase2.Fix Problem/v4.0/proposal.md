# Outline2Page Fix v4.0 Proposal

## 背景

用户反馈：生成页面后，Figma 中 chapter 大标题仍显示默认文案 `chapter`，没有被注入为真实章节标题。截图中选中的节点位于 `PAGE_NAV_group` 内，属性面板显示可写属性为 `PAGE_CHAPTER_TEXT (HUGE)`。

## 当前问题

- `property-injector` 已支持普通内容节点的 `PAGE_CHAPTER_TEXT (HUGE)`。
- 但 `property-injector` 会跳过导航组件，由 `navigation-injector` 负责 `PAGE_NAV_group` 内部文案。
- `navigation-injector` 目前只把 chapter 文案写入 `PAGE_CHAPTER_TEXT` 和 `TOC_CHAPTER_TEXT`，没有覆盖 `PAGE_CHAPTER_TEXT (HUGE)`。
- 因此导航区域里的 chapter 大标题属性落空，保留模板默认值。

## 目标方案

- 在导航注入逻辑中，把 `PAGE_CHAPTER_TEXT (HUGE)` 视为 chapter 文本目标。
- 同时兼容 Figma 暴露属性的嵌套 key，例如 `NAV_item/PAGE_CHAPTER_TEXT (HUGE)#text`。
- 增加回归测试，覆盖截图对应的 `PAGE_NAV_group -> NAV_item -> PAGE_CHAPTER_TEXT (HUGE)` 写入场景。
- 保持普通属性注入、导航 SHOW/HIGHLIGHT、TOC 注入行为不变。

## 不做范围

- 不改变 Figma 模板结构。
- 不新增自动 clone 导航项能力。
- 不改 UI 字段映射交互。
- 不重构导航收集策略，只补齐 chapter huge 文本目标。

## 待确认问题

无。截图已经明确目标属性名为 `PAGE_CHAPTER_TEXT (HUGE)`，且现有代码已有同名普通属性支持，本轮可直接修复。

## 验收标准

- `PAGE_NAV_group` 内 `NAV_item/PAGE_CHAPTER_TEXT (HUGE)#text` 被写入当前 chapter 标题。
- 原有 `PAGE_CHAPTER_TEXT`、`PAGE_TITLE_TEXT`、`PAGE_STEP_TEXT` 导航注入测试继续通过。
- 完整验证命令通过：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。
- 构建产物 `code.js` 与源码同步。

## 风险

- Figma 暴露属性可能存在更多尺寸后缀。当前只修复已确认且源码中已有语义的 `(HUGE)`。
- 现有工作区有大量未提交改动，本轮只应触碰 v4.0 文档、导航注入源码、导航注入测试和构建产物。
