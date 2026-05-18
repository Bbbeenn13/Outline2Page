# v9.0 修复复盘

## 本轮问题根因

- 用户简化模板后，TOC 角色由 `TOC_NAV_item/TYPE` 表达，而不是 `HIGHLIGHT`。
- 代码只识别旧的 `NAV_item` 暴露属性，没有识别 `TOC_NAV_item`，导致简化模板落回全实例通用写入路径。
- 全实例路径会把所有 `SHOW` 都置为 true，title 槽位不能按实际 title 数量隐藏，也不能稳定按 `TYPE` 对位。

## 有效判断

- 用户明确说明“不用理会 highlight”后，应立即以 `TYPE` 为唯一主要角色来源。
- `TOC_NAV_item` 的结构和 `PAGE_NAV_group` 类似，但角色枚举不同；实现应保持简单。

## 走偏判断

- v7/v8 仍保留过多 `HIGHLIGHT` 兼容思路，对当前简化模板不是主路径。
- 没有第一时间把 `TOC_NAV_item` 纳入暴露属性识别，是导致 title 槽位控制失败的直接原因。

## 有效测试或检查

- 新增 `writes simplified TOC_NAV_item slots by TYPE without HIGHLIGHT`，覆盖 `TYPE=TOC_NUM/TOC_CHAPTER/TOC_PAGE_RANGE/TOC_TITLE` 对位写入。
- 完整验证覆盖 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## 下次同类问题操作准则

- 模板简化后，代码应跟着收敛主路径，而不是继续优先兼容旧复杂结构。
- `TYPE` 可以作为 item 边界：连续出现多个 `TYPE` 时，每个 `TYPE` 开始一个新的暴露 item。
- TOC 的主规则：按 `TOC_NAV_item/TYPE` 找角色，写对应 `TOC_*_TEXT`，多余 title 槽清空并隐藏。

## 剩余风险

- 如果未来模板再次改名，需要同步更新暴露 item 名称识别规则。
