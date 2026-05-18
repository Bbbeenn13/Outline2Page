# v12.0 修复复盘

## 本轮问题根因

- TOC 在 v10-v11 收敛到外层 `TOC_NAV_group` 暴露 `TOC_NAV_item/...` 的嵌套属性协议，但真实使用中该协议仍依赖 Figma raw key 暴露形态。
- PAGE_NAV 已经更接近参考项目的扁平 item 模式，TOC 却保留另一套分组解析，导致两个导航系统心智不一致。
- 用户确认希望把 TOC_NAV 和 PAGE_NAV 做成同一种底层结构，因此继续修补嵌套暴露属性路线会扩大复杂性。

## 正确判断

- 参考项目最有价值的是协议形态：container 只做容器，内部 item instance 自己带 `TYPE`、文本属性和 `SHOW`。
- TOC 文本与 `SHOW` 分离写入是必要安全机制，保留并迁移到新扁平 item 写入器。
- TOC 页码范围支持 `TOC_PAGE_RANGE` 和 `TOC_PAGE` 两种语义别名，可以降低模板命名成本，不等同于旧结构兼容。

## 走偏判断

- v10-v11 试图让外层嵌套暴露属性协议变可靠，但这条路本身就把 Figma raw key 形态变成插件协议核心。
- 单纯修 `#id` 和逐属性 fallback 只能缓解写入问题，不能解决 TOC/PAGE_NAV 两套结构不一致的维护问题。

## 有效测试或检查

- 将 `toc-expander` 测试改为内部独立 `NAV_item`，每个 item 自带 `TYPE` 与对应 `TOC_*_TEXT`。
- 覆盖了章节行扩展、四类 TOC 文本写入、多余 title 隐藏、title item clone、`TOC_PAGE` 别名、`SHOW` 失败不阻断文本。
- `npx vitest run tests/figma/toc-expander.test.ts` 先红后绿，证明旧实现确实不支持新协议。
- 完整验证：`npm test`、`npm run typecheck`、`npm run lint`、`npm run build` 全部通过。

## 下次同类问题操作准则

- TOC/PAGE_NAV 的底层协议保持一致：外层 group 容器 + 内部独立 item instance + item 自身 `TYPE` + item 自身 text + 可选 `SHOW`。
- 不再把外层 group 暴露的 `TOC_NAV_item/...` 嵌套属性作为 TOC 当前协议。
- 如果模板写不进去，先检查内部 item 是否可被插件遍历、是否有 `TYPE`、是否有对应文本属性，而不是继续猜外层 raw key 分组。

## 仍需注意的风险

- 用户当前 Figma TOC 模板需要按新协议调整；如果继续使用外层嵌套暴露属性，当前代码不会再按该路径写入。
- 如果 Figma 组件把 item 完全封装为不可访问内部节点，只暴露外层嵌套属性，则该模板不符合当前协议。
