# PropertyInjector 最小任务

## 模块目标

向生成节点写入组件属性和普通 Text Layer，缺失属性时继续生成并报告警告。

## 输入

- `node: SceneNode`
- `page: PagePlanItem`
- `chapterRanges: Record<number, string>`

## 输出

- `writtenCount: number`
- `missingProperties: string[]`
- `warnings: InjectionWarning[]`

## 最小任务清单

- [x] 创建 `src/figma/property-injector.ts`
- [x] 定义 `injectProperties(input: PropertyInjectorInput): Promise<PropertyInjectorOutput>`
- [x] 创建属性值映射函数
- [x] 将 `PAGE_TITLE_TEXT` 映射到 `page.titleText`
- [x] 将 `PAGE_CHAPTER_TEXT` 映射到 `page.chapterTitle`
- [x] 将 `PAGE_STEP_TEXT` 映射到 `page.stepText`
- [x] 将 `PAGE_CHAPTER_TEXT (HUGE)` 映射到 `page.chapterTitle`
- [x] 将 `PAGE_PAGE_TEXT` 映射到 `page.pageNumberText`
- [x] 将 `PAGE_VERSION_TEXT` 映射到 `page.vision`
- [x] 将 `TOC_NUM_TEXT` 映射到章节号
- [x] 将 `TOC_PAGE_RANGE_TEXT` 映射到章节跨度
- [x] 不写入 `TYPE`
- [x] 递归扫描所有 InstanceNode
- [x] 对 InstanceNode 中完全匹配的 componentProperties 写入
- [x] 写入前检查属性类型
- [x] 类型不匹配时记录 warning
- [x] 递归扫描所有 TextNode
- [x] TextNode 名称完全匹配时写入 characters
- [x] 写 TextNode 前调用 `figma.loadFontAsync`
- [x] 字体加载失败时记录 warning 并跳过该 TextNode
- [x] 多个同名属性全部写入
- [x] 多个同名 Text Layer 全部写入
- [x] 缺少目标属性时记录 missingProperties
- [x] 添加 Mock 测试：组件属性写入
- [x] 添加 Mock 测试：Text Layer 写入
- [x] 添加 Mock 测试：多个同名目标全部写入
- [x] 添加 Mock 测试：TYPE 不被修改
- [x] 添加 Mock 测试：字体加载失败 warning
- [x] 添加 Mock 测试：缺失属性继续生成

## 完成标准

- [x] 所有已暴露目标属性可写入
- [x] Text Layer 与组件属性同步写入
- [x] 缺失属性或字体失败不导致插件崩溃

