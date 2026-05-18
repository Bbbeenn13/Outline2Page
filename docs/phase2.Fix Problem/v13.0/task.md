# v13.0 修复任务

## 任务 1：保存字段映射 UI 状态

- 目标：用户编辑字段映射后，后续 render 不再覆盖该输入。
- 涉及文件：`src/ui/ui-controller.ts`、`src/ui.html`。
- 完成标准：字段映射输入事件写入状态；渲染时优先使用状态值。
- 测试要求：补充 UI 集成测试覆盖点击生成后的输入保持。

## 任务 2：保持生成消息使用最新映射

- 目标：点击生成时发送的 `propertyMapping` 必须来自用户刚编辑后的值。
- 涉及文件：`src/ui/ui-controller.ts`、`src/ui.html`、`tests/integration/plugin-ui-bridge.test.ts`。
- 完成标准：生成前同步 DOM 输入到状态；发送 payload 包含用户追加属性。
- 测试要求：断言 `GENERATE.propertyMapping` 和生成后 DOM 值都包含用户追加属性。

## 任务 3：同步构建产物和修复记录

- 目标：源码、内嵌 UI、构建产物、修复文档一致。
- 涉及文件：`code.js`、`docs/phase2.Fix Problem/v13.0/*`、`docs/phase2.Fix Problem/RETRO.md`、`docs/phase2.Fix Problem/FIX_GUIDE.md`。
- 完成标准：`npm run build` 更新 `code.js`；记录验证结果和复盘；如当前指南无新增长期规则则在进度中说明。
- 测试要求：运行完整验证命令。
