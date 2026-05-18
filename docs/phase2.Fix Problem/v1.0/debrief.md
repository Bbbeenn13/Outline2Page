# Outline2Page Fix 1.0 Debrief

## 本轮问题根因

Fix 1.0 的核心问题是生成链路缺少“用户可配置的大纲字段到模板写入目标”的稳定桥梁。旧实现主要依赖固定属性名写入，例如 `PAGE_VERSION_TEXT`、`PAGE_TITLE_TEXT`、`PAGE_CHAPTER_TEXT`，导致封面主题、章节标题、标题文字、小节文字、页码和目录信息无法根据真实模板灵活映射。

同时，导航注入逻辑对模板结构的理解不够贴近真实 Figma 组件。代码曾寻找 `NAV_CHAPTER` / `NAV_TITLE` / `NAV_STEP` 这类目标，但用户实际模板使用的是 `NAV_group` 实例，并通过属性暴露文本、显示和高亮状态。

## 有效判断

- 先做基线备份，再进入修复，是本轮正确的安全动作。基线 commit 为 `164056d chore: backup outline2page 1.0 baseline`。
- 把字段映射建模为 UI 到主线程的显式数据，而不是继续扩展硬编码属性名，方向正确。
- UI 对用户展示中文业务字段，而不是暴露内部技术字段名，降低了模板配置成本。
- 属性注入保留默认映射，同时允许用户映射覆盖，兼顾旧模板兼容和新模板自由度。
- 写入失败进入 warning 而不中断整次生成，避免单个属性问题拖垮完整页面生成。
- 对 `NAV_group` 数量不足选择 warning 而不是自动 clone，符合用户确认的模板维护方式。

## 走偏判断

- 初始方案中曾倾向使用较复杂的 frame 命名格式，例如 `PAGE_STEP__C01_T01_S01__...`，但用户最终需要更短、更贴近视觉层级的格式。
- 初始理解里把“步骤”作为主要术语，后续确认应统一为“小节”，对应模型中的 `step`。
- 早期文档路径沿用了 `doc/fix/1.0`，后续项目规范已经统一为 `docs/phase2.Fix Problem/v1.0`。
- 对真实 `NAV_group` 结构的判断仍依赖用户提供的属性列表和测试 mock，后续真实模板验证仍然重要。

## 有效测试或检查

- `plugin-ui-bridge` 集成测试验证了 UI 生成消息能携带 `propertyMapping`，保护了 UI 到主线程的数据契约。
- `property-injector` 测试覆盖了默认映射和用户映射写入，是字段映射修复的核心回归保护。
- `naming-service` 测试确认 frame 命名规则没有破坏生成链路。
- `navigation-injector` 测试覆盖 `NAV_group` 写入和高亮逻辑，避免继续依赖不存在的 `NAV_CHAPTER` / `NAV_TITLE` / `NAV_STEP`。
- 完整运行 `npm test`、`npm run typecheck`、`npm run lint`、`npm run build`，并更新 `code.js`，保证源码和插件产物同步。

## 下次同类问题操作准则

1. 用户说“某个大纲文字写不进去”时，先查三件事：大纲字段名、UI 映射结果、Figma 模板实际可写属性。
2. 不要直接把新字段写死进 `property-injector`；优先确认是否应该进入 `propertyMapping`。
3. UI 展示给用户的字段名必须是业务语言，例如“封面主题”“章节标题”“小节文字”，技术字段只留在类型和测试里。
4. Figma 模板属性要以扫描结果和用户确认为准，不根据猜测新增不存在的属性名。
5. 导航槽位数量不足时先 warning，让用户调整模板；除非用户明确要求，否则不要自动 clone。
6. 每次修改 UI 到主线程的数据结构，都必须补集成测试，防止消息 payload 漏字段。

## 剩余风险

- 真实 Figma 模板中的属性名大小写、中文括号、特殊后缀可能和测试 mock 不完全一致，后续新增模板时仍需扫描确认。
- 字段映射当前不持久化，每次初始化重新扫描和计算；如果用户未来需要跨会话记忆映射，需要单独设计 `figma.clientStorage` 策略。
- 如果模板同时包含 component properties 和同名 Text Layer，后续可能需要更明确的优先级展示和冲突提示。
- v1 文档历史中残留旧路径 `doc/fix/1.0`，以后只应使用 `docs/phase2.Fix Problem/v1.0`。
