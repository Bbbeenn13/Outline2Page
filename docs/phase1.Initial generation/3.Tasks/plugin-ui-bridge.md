# PluginUiBridge 最小任务

## 模块目标

管理 UI 与 Figma 插件主线程之间的消息通信，连接扫描、解析、生成流程。

## 输入

- UI 消息：`SCAN_TEMPLATES`、`PARSE_OUTLINE`、`GENERATE`

## 输出

- 主线程消息：`TEMPLATES_SCANNED`、`OUTLINE_PARSED`、`GENERATION_DONE`、`ERROR`

## 最小任务清单

- [x] 创建 `src/main.ts`
- [x] 创建 `src/ui.html`
- [x] 创建 `src/ui/ui-controller.ts`
- [x] 定义 UI 到主线程消息类型
- [x] 定义主线程到 UI 消息类型
- [x] 插件启动时调用 `figma.showUI`
- [x] UI 加载后发送 `SCAN_TEMPLATES`
- [x] 主线程处理 `SCAN_TEMPLATES`
- [x] 主线程返回 `TEMPLATES_SCANNED`
- [x] UI 粘贴 Markdown 后触发 `PARSE_OUTLINE`
- [x] 主线程处理 `PARSE_OUTLINE`
- [x] 主线程返回 `OUTLINE_PARSED`
- [x] UI 根据解析结果展示 requiredPageKinds
- [x] UI 根据模板扫描结果展示模板下拉栏
- [x] UI 点击生成时发送 `GENERATE`
- [x] `GENERATE` 消息携带 markdown
- [x] `GENERATE` 消息携带 templateMapping
- [x] 主线程串联 TemplateMapper / PagePlanner / Pagination / Naming / Layout
- [x] 主线程串联 SectionManager / NodeFactory / PropertyInjector / NavigationInjector / TocExpander
- [x] 主线程返回 `GENERATION_DONE`
- [x] UI 展示生成报告
- [x] 主线程异常时返回 `ERROR`
- [x] UI 展示 ERROR
- [x] 生成过程中禁用生成按钮
- [x] 生成结束后恢复生成按钮
- [x] 添加集成测试或手动验证：打开插件自动扫描模板
- [x] 添加集成测试或手动验证：粘贴 Markdown 返回预览
- [x] 添加集成测试或手动验证：点击生成返回报告
- [x] 添加集成测试或手动验证：异常可展示

## 完成标准

- [x] UI 与主线程消息协议稳定
- [x] 三条核心消息链路可运行
- [x] 错误不会让 UI 卡死

