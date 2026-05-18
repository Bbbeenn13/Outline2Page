# Outline2Page 模块开发总进度

## 总体状态

- [x] 工程初始化完成
- [x] 纯逻辑模块完成
- [x] Figma API 适配模块完成
- [x] UI 通信模块完成
- [x] 模块测试完成
- [ ] Figma 手动验收完成

## 模块进度

- [x] [OutlineParser](./outline-parser.md)
- [x] [OutlineAnalyzer](./outline-analyzer.md)
- [x] [TemplateScanner](./template-scanner.md)
- [x] [TemplateMapper](./template-mapper.md)
- [x] [PagePlanner](./page-planner.md)
- [x] [PaginationService](./pagination-service.md)
- [x] [NamingService](./naming-service.md)
- [x] [LayoutEngine](./layout-engine.md)
- [x] [GeneratedSectionManager](./generated-section-manager.md)
- [x] [NodeFactory](./node-factory.md)
- [x] [PropertyInjector](./property-injector.md)
- [x] [NavigationInjector](./navigation-injector.md)
- [x] [TocExpander](./toc-expander.md)
- [x] [ReportBuilder](./report-builder.md)
- [x] [PluginUiBridge](./plugin-ui-bridge.md)

## 推荐开发顺序

- [x] 1. 工程初始化：`manifest.json`、`package.json`、`tsconfig.json`、基础构建
- [x] 2. OutlineParser
- [x] 3. OutlineAnalyzer
- [x] 4. TemplateMapper
- [x] 5. PagePlanner
- [x] 6. PaginationService
- [x] 7. NamingService
- [x] 8. LayoutEngine
- [x] 9. ReportBuilder
- [x] 10. TemplateScanner
- [x] 11. GeneratedSectionManager
- [x] 12. NodeFactory
- [x] 13. PropertyInjector
- [x] 14. NavigationInjector
- [x] 15. TocExpander
- [x] 16. PluginUiBridge
- [ ] 17. Figma 手动验收

## 阶段验收

### Phase 1：纯逻辑核心

- [x] OutlineParser 单元测试通过
- [x] OutlineAnalyzer 单元测试通过
- [x] TemplateMapper 单元测试通过
- [x] PagePlanner 单元测试通过
- [x] PaginationService 单元测试通过
- [x] NamingService 单元测试通过
- [x] LayoutEngine 单元测试通过
- [x] ReportBuilder 单元测试通过

### Phase 2：Figma 适配

- [x] TemplateScanner Mock 测试通过
- [x] GeneratedSectionManager Mock 测试通过
- [x] NodeFactory Mock 测试通过
- [x] PropertyInjector Mock 测试通过
- [x] NavigationInjector Mock 测试通过
- [x] TocExpander Mock 测试通过

### Phase 3：UI 与集成

- [x] 插件启动后能显示 UI
- [x] UI 启动后能扫描当前 Page 模板
- [x] UI 粘贴 Markdown 后能显示解析预览
- [x] UI 能根据 requiredPageKinds 展示模板下拉栏
- [x] UI 能发送 GENERATE 消息
- [x] 主线程能返回生成报告
- [x] 生成结束后选中新 Section

### Phase 4：真实 Figma 验收

- [ ] 当前 Page 中模板可识别
- [ ] COVER / TOC / CHAPTER / TITLE / STEP 可生成
- [ ] 模板节点不被修改
- [ ] 旧生成 Section 可覆盖
- [ ] Section 外部用户内容保留
- [ ] 组件属性可注入
- [ ] Text Layer 可同步写入
- [ ] `PAGE_VERSION_TEXT` 写入 Vision
- [ ] `PAGE_PAGE_TEXT` 写入实际页码
- [ ] `TOC_NUM_TEXT` 写入章节号
- [ ] `TOC_PAGE_RANGE_TEXT` 写入章节跨度
- [ ] `SHOW` 写入 true / false
- [ ] `HIGHLIGHT` 写入 on / off
- [ ] `NAV_group` 不足时可扩展
- [ ] 缺模板时生成可生成部分并报告
- [ ] 缺属性时继续生成并报告

## 当前风险待跟踪

- [ ] Figma 组件属性类型与写入值类型不匹配
- [ ] Text Layer 字体加载失败
- [ ] 无后缀导航项视觉排序与用户预期不一致
- [ ] `NAV_group` 只有一行时行距推断不准确
- [ ] 模板节点类型超出 Frame / Component / Instance

