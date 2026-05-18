# v9.0 TOC_NAV_item TYPE 对位修复方案

## 背景

用户已简化 TOC NAV 模板属性：不再依赖 `HIGHLIGHT`，每个 `TOC_NAV_item` 通过 `TYPE` 表达角色，并暴露对应文本属性。

## 当前问题

- 代码仍在尝试兼容 `HIGHLIGHT` 和复杂 raw key 分组，偏离了当前模板。
- 当前模板的角色应来自 `TYPE=TOC_NUM / TOC_CHAPTER / TOC_PAGE_RANGE / TOC_TITLE`。
- `TOC_TITLE_TEXT` 应只写标题列表，`TOC_CHAPTER_TEXT` 应只写章节标题，不能串位。
- title 槽位不足时，只需要调整组件内 title 槽位，不需要改动 num/chapter/page 槽位。

## 目标方案

- TOC 写入按 `TOC_NAV_item` 的 `TYPE` 对位写文本。
- 保留兼容 `NAV_item`，但优先支持 `TOC_NAV_item`。
- title 槽位按 `TYPE=TOC_TITLE` 收集、扩展、写入和隐藏。
- 不再把 `HIGHLIGHT` 作为 TOC 的主要角色来源。

## 不做范围

- 不改 Markdown 大纲解析。
- 不改 PAGE_NAV_group。
- 不要求模板重新引入 `HIGHLIGHT`。

## 待确认问题

无。用户已确认简化后的模板规则。

## 验收标准

- `TYPE=TOC_NUM` 写 `TOC_NUM_TEXT`。
- `TYPE=TOC_CHAPTER` 写 `TOC_CHAPTER_TEXT`。
- `TYPE=TOC_PAGE_RANGE` 写 `TOC_PAGE_RANGE_TEXT`。
- `TYPE=TOC_TITLE` 写 `TOC_TITLE_TEXT`，多余 title 槽清空并隐藏。
- 完整验证通过并更新 `code.js`。

## 已知风险

- 如果 Figma raw key 中 `TYPE` 和 `_TEXT` 的分组顺序不稳定，需要继续补基于属性 key 后缀的配对规则。
