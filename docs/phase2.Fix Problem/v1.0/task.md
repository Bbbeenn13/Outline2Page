# Outline2Page Fix 1.0 Task

## 执行原则

- 当前文档只定义最小可执行任务，确认需求前不进入实现。
- 实现阶段由主 Agent 拆分子 Agent 并行处理。
- 每个子任务必须带测试，最后统一 `typecheck/test/build`。

## 最小可执行任务

### Task 1：字段映射数据模型

目标：

- 定义大纲字段到属性名的映射类型。
- 扩展 UI -> Plugin 消息，让 `GENERATE` 携带 `propertyMapping`。
- 保留现有 `templateMapping` 行为。

涉及文件：

- `src/types/index.ts`
- `src/figma/figma-types.ts`
- `src/main.ts`
- `src/ui/ui-controller.ts`
- `tests/integration/plugin-ui-bridge.test.ts`

完成标准：

- 没有映射时使用默认属性。
- 有映射时主线程能收到完整映射。

### Task 2：面板字段映射 UI

目标：

- 面板基于解析后的大纲层级显示可映射字段。
- 字段选项来自模板扫描出的组件属性和 Text Layer。
- 用户生成时带上映射结果。
- UI 文案使用“封面主题 / 章节标题 / 标题文字 / 小节文字”等中文字段，不暴露内部类型术语。

涉及文件：

- `src/ui/ui-controller.ts`
- `src/ui.html`
- `tests/integration/plugin-ui-bridge.test.ts`

完成标准：

- 能为 `COVER/CHAPTER/TITLE/STEP` 的字段选择属性。
- UI 测试覆盖默认选择和手动选择。

### Task 3：配置驱动的属性注入

目标：

- `property-injector` 从固定属性名注入扩展为“默认映射 + 用户映射”。
- 支持组件属性和 Text Layer。
- 修复封面 `《XXX》` 不能写入目标属性的问题。

涉及文件：

- `src/figma/property-injector.ts`
- `src/main.ts`
- `tests/figma/property-injector.test.ts`

完成标准：

- `coverTitle` 能写入确认后的封面属性名。
- 章节、标题、步骤字段能按映射写入。
- 类型不匹配和字体加载失败仍然 warning，不中断。

### Task 4：Frame 命名规则与解析

目标：

- 调整生成 frame 命名。
- 提供从 frame 名解析当前页类型和索引的函数。
- 导航高亮使用解析结果。
- 命名格式采用 `页数.chapter/title/step`，例如 `02.chapter`、`03.title`、`04.step`。

涉及文件：

- `src/core/naming-service.ts`
- `src/figma/navigation-injector.ts`
- `tests/core/naming-service.test.ts`
- `tests/figma/navigation-injector.test.ts`

完成标准：

- Frame 名符合确认后的 `PAGE_CHAPTER / PAGE_TITLE / PAGE_STEP` 规则。
- 解析函数能得到 page kind 和索引。

### Task 5：NAV_group 导航注入

目标：

- 导航注入从 `NAV_CHAPTER/NAV_TITLE/NAV_STEP` 改为识别 `NAV_group`。
- 按大纲顺序写入章节/小节文字，小节对应 `step`。
- 根据当前 frame 命名高亮。
- 数量不足时不自动 clone，返回 warning 提示用户调整 `NAV_group` 数量。

涉及文件：

- `src/figma/navigation-injector.ts`
- `tests/figma/navigation-injector.test.ts`

完成标准：

- `NAV_group` 按视觉顺序赋值。
- 数量不足时返回 warning。
- 当前项高亮，其他项关闭高亮。

### Task 6：集成验证和构建

目标：

- 覆盖主流程：解析大纲 -> 选择模板与属性 -> 生成节点 -> 注入属性 -> 导航高亮。
- 更新 `code.js`。

涉及文件：

- `tests/integration/plugin-ui-bridge.test.ts`
- 可能新增集成测试文件
- `code.js`

完成标准：

- `npm test`
- `npm run typecheck`
- `npm run build`

## 子 Agent 拆分建议

确认需求后建议拆 3 个子 Agent：

1. UI Agent：负责 Task 1 + Task 2。
2. Injection Agent：负责 Task 3。
3. Navigation Agent：负责 Task 4 + Task 5。

主 Agent 负责：

- 合并接口定义。
- 处理冲突。
- 跑完整测试。
- 更新 `progress.md`。
- 最终汇报与必要提交。
