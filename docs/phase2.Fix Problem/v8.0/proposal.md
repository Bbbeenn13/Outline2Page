# v8.0 TOC 暴露属性对位修复方案

## 背景

用户复测后确认 v7.0 仍未解决真实 TOC title 注入。最新截图显示：`TOC_CHAPTER_TEXT` 被写入为章节名，但 `TOC_TITLE_TEXT` 为空；画布中目录卡片主标题显示章节，下面 title 槽位没有按大纲标题写入。

## 当前问题

- 大纲解析结果里 title 数据存在，说明问题不在 parser。
- 真实模板已暴露 `NAV_item` 下的 `HIGHLIGHT=TOC_TITLE` 与 `TOC_TITLE_TEXT`，但代码没有按用户设计的暴露属性对位填入。
- v5/v6/v7 的修复仍过度依赖推断的 raw key 形态，缺少对“同一个 `TOC_NAV_group` 实例内多组暴露属性、且可能无稳定分组前缀”的兼容。

## 目标方案

- 重新审视 `TOC_NAV_group` 的可写属性分配逻辑，不再只靠 `NAV_item/` 前缀或全实例属性名。
- 对同一实例内的 TOC 暴露属性建立更稳健的槽位模型：优先按 `HIGHLIGHT` 角色分组；无法分组时按 `TOC_*_TEXT` 的可写 key 序列分配。
- 确保 title 写入失败时产生 warning，而不是静默显示空白。
- 补充测试覆盖“章节元数据已写入但 title 暴露槽未写入”的真实症状。

## 不做范围

- 不修改大纲层级语法。
- 不要求用户重新设计模板。
- 不继续基于 v5/v6 的 clone 结论叠补丁。

## 待确认问题

暂不提问。先从截图和现有 Figma API 模拟补齐兼容；如果仍无法覆盖真实 raw key，需要请求用户提供扫描到的 raw key 调试日志。

## 验收标准

- `TOC_CHAPTER_TEXT` 写章节名，`TOC_TITLE_TEXT` 写该章节下的 title 列表。
- title 数量随大纲变化，多余 title 槽清空并隐藏。
- 写入不到任何 title 槽时产生明确 warning。
- 完整验证通过并更新 `code.js`。

## 已知风险

- Figma API 对嵌套暴露属性的 raw key 可能与截图显示不一致；需要尽量做结构兼容，并在失败时输出可诊断 warning。
