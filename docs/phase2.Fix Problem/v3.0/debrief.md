# Outline2Page Fix 3.0 Debrief

## 本轮问题根因

Fix 3.0 的核心问题是代码把 Figma 导航组件的容器职责和导航项职责混在了一起。`PAGE_NAV_group` 与 `TOC_NAV_group` 是外层容器，外层 `TYPE` 主要承担样式变体作用；真正承载章节、标题、小节、显示状态和高亮状态的是内部 `NAV_item` 及其暴露出的 `_TEXT`、`SHOW`、`HIGHLIGHT` 属性。

旧逻辑过早相信外层组件名称或外层 `TYPE` 的业务语义，导致写入目标错位，尤其会让单个 `PAGE_TITLE` 槽位无法对应当前 frame 标题。

## 有效判断

- 先确认真实 Figma 组件结构，再改注入规则，是本轮最关键的判断。
- 把 `PAGE_NAV_group` / `TOC_NAV_group` 重新定义为容器，而不是文本槽位，修复了主要方向错误。
- 对 Figma 暴露属性使用后缀匹配，能兼容 `NAV_item/PAGE_TITLE_TEXT#...` 这类嵌套 key。
- 区分单槽位面包屑语义与多槽位列表语义，解决了当前页面标题与章节无法对齐的问题。
- 保留写入失败警告而不中断其他槽位写入，降低了单个组件异常对整页生成的影响。

## 走偏判断

- 早期把外层 `TYPE` 当成 `CHAPTER` / `TITLE` / `STEP` 的业务判定来源，这是根本偏差。
- 早期把泛化的 `NAV_group` 当成导航项本身，忽略了内部 `NAV_item` 才是语义槽位。
- 早期路径记录里出现过 `docs/2.Fix Problem/` 这类错误写法，后续必须统一为 `docs/phase2.Fix Problem/`。

## 有效测试或检查

- 用 `navigation-injector` 回归测试覆盖内部 `NAV_item` 写入，是本轮最有效的保护。
- 用 `toc-expander` 回归测试覆盖嵌套 `TOC_TITLE_TEXT` key，能防止 Figma 暴露属性路径再次漏匹配。
- 完整运行 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build`，确认源码、类型、风格和构建产物同步。

## 下次同类问题操作准则

1. 先把用户提供的 Figma 组件层级画成职责表：容器、导航项、文本槽、状态槽分别是谁。
2. 不要把外层样式变体当业务语义；遇到 `TYPE` 时先确认它是样式变体还是业务枚举。
3. 对 Figma component properties 做归一化后缀匹配，兼容斜杠、组件名前缀和 `#` 后缀。
4. 同类槽位只有一个时，优先按当前页面上下文写入；同类槽位有多个时，再按列表语义写入。
5. 每次 fix 都在 `docs/phase2.Fix Problem/<version>/` 创建或更新 `proposal.md`、`task.md`、`progress.md`、`debrief.md`，不要混用旧路径。
6. 构建产物 `code.js` 需要和源码修复一起验证，不能只跑单元测试。

## 剩余风险

- 如果后续 Figma 模板同时存在面包屑槽位和列表槽位，仅靠同类槽位数量可能不足以区分语义，需要引入更明确的组件命名或结构规则。
- 如果未来需要自动 clone 不足的导航槽位，必须另开版本设计 clone 策略，不能混入当前写入逻辑。
- Figma 暴露属性 key 的格式可能继续变化，后续新增组件时应先补 fixture 或回归测试，再改注入逻辑。
