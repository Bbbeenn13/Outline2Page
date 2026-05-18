# Outline2Page Fix v4.0 Debrief

## 本轮问题根因

`PAGE_CHAPTER_TEXT (HUGE)` 已经被普通属性注入识别，但导航区域会被 `property-injector` 跳过，改由 `navigation-injector` 独立写入。`navigation-injector` 的 chapter 文本目标只包含 `PAGE_CHAPTER_TEXT` 与 `TOC_CHAPTER_TEXT`，漏掉了截图中真实模板使用的 `PAGE_CHAPTER_TEXT (HUGE)`，导致 Figma 保留默认文案 `chapter`。

## 哪些判断是正确的

- 先从截图属性面板确认真实属性名，再回到代码查写入链路，是最快定位方式。
- 保留 `property-injector` 跳过导航组件的职责边界是正确的；问题不在普通属性注入，而在导航专属注入目标不完整。
- 先写失败测试，再改目标列表，能确认修复命中了真实缺口。

## 哪些判断走偏了

无明显走偏。本轮问题边界较清晰，截图与现有源码命名能直接闭环。

## 哪些测试或检查最有效

- `navigation-injector` 中新增 `NAV_item/PAGE_CHAPTER_TEXT (HUGE)#text` 回归测试，直接复现截图问题。
- 完整运行 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build`，确认源码、类型、风格和构建产物同步。

## 下次遇到同类问题的操作准则

1. 看到某个 Figma 属性不注入时，先确认它属于普通内容注入还是导航/TOC 等专属注入。
2. 如果一个语义字段存在尺寸或样式后缀，例如 `(HUGE)`，所有负责该语义的专属注入器都要同步支持。
3. 对 Figma 暴露属性继续使用归一化后的后缀匹配，覆盖 `NAV_item/...#text` 这类嵌套 key。

## 仍需注意的风险

- 未来如果出现 `PAGE_CHAPTER_TEXT (SMALL)`、`PAGE_CHAPTER_TEXT (LARGE)` 等新后缀，可能还需要抽象出更通用的 chapter 文本目标判断。
- `code.js` 是当前工作区整体源码的构建产物；在多人或多轮未提交改动并存时，交付前必须说明这一点。

待修复完成后填写。
