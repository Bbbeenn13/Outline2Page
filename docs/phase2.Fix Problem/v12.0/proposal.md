# v12.0 扁平导航协议收敛方案

## 背景

用户确认希望把 `TOC_NAV` 和 `PAGE_NAV` 做成同一种底层结构，参考 `Figma-SmartNavigation-dev` 的扁平快速方式：扫内部独立 instance，通过 `TYPE` 判断角色，再写该 instance 自己暴露的文本属性。

## 当前问题

- v10-v11 的 TOC 协议仍以外层 `TOC_NAV_group` 暴露的 `TOC_NAV_item/...` 嵌套属性为核心。
- 这种协议依赖 Figma raw key 的分组形态，容易受 `#id`、路径层级和外层实例暴露方式影响。
- PAGE_NAV 已经支持内部 `NAV_item` 扁平 instance 扫描；TOC 仍是另一套嵌套暴露属性解析，导致两者心智不统一。
- 参考项目证明了更稳的模式：每个导航 item 自己带 `TYPE`、文本属性和 `SHOW`，文本写入与显示控制分离。

## 目标方案

- `PAGE_NAV_group` 和 `TOC_NAV_group` 统一底层模板协议：
  - 外层 group 只作为容器。
  - 内部可写项是独立 `INSTANCE`。
  - item 自己暴露 `TYPE`。
  - item 自己暴露对应文本属性。
  - item 自己可选暴露 `SHOW`。
- TOC 当前支持的 item 类型：
  - `TOC_NUM` -> `TOC_NUM_TEXT`
  - `TOC_CHAPTER` -> `TOC_CHAPTER_TEXT`
  - `TOC_PAGE_RANGE` 或 `TOC_PAGE` -> `TOC_PAGE_RANGE_TEXT` 或 `TOC_PAGE_TEXT`
  - `TOC_TITLE` -> `TOC_TITLE_TEXT`
- TOC 文本写入和 `SHOW` 写入分开，单个失败不拖累另一个。
- TOC 标题槽不足时优先 clone 最后一个 `TOC_TITLE` item。
- 更新测试，覆盖扁平 TOC item 协议；不再测试外层 `TOC_NAV_item/...` 嵌套暴露路径。

## 不做范围

- 不重写 PAGE_NAV 的业务编排。
- 不回加旧 TOC `HIGHLIGHT`、旧 `NAV_item/TOC_*`、row-level `TOC_*_TEXT`。
- 不支持外层 `TOC_NAV_group` 作为多个 item 的嵌套暴露属性承载者。
- 不删除任何文件。

## 待确认问题

无。用户已确认执行统一扁平 item 协议。

## 验收标准

- TOC 扫描内部独立 item instance，根据 `TYPE` 写对应文本。
- TOC 和 PAGE_NAV 的底层协议一致：container + item instance + `TYPE` + text + `SHOW`。
- TOC 行仍按章节数扩展，多余标题槽清空并隐藏。
- `SHOW` 写入失败时文字仍写入。
- 完整验证通过并同步 `code.js`。

## 风险

- 当前使用外层嵌套暴露属性的 TOC 模板需要调整为内部独立 item instance。
- 如果 Figma 组件把内部 item 完全封装到不可访问的 instance 内部，插件只能写外层暴露属性；这种模板不再作为当前协议支持目标。
