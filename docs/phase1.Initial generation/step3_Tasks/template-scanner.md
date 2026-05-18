# TemplateScanner 最小任务

## 模块目标

扫描当前 Figma Page 中所有 `PAGE_TEMP：` 模板，提取模板信息、组件属性名和 Text Layer 名称。

## 输入

- `currentPage: PageNode`

## 输出

- `templates: TemplateInfo[]`
- `warnings: TemplateWarning[]`

## 最小任务清单

- [x] 创建 `src/figma/template-scanner.ts`
- [x] 定义 `scanTemplates(currentPage: PageNode): TemplateScanOutput`
- [x] 只扫描 `figma.currentPage`
- [x] 识别名称以 `PAGE_TEMP：` 开头的节点
- [x] 从模板名提取 `kindGuess`
- [x] 支持 Frame 模板
- [x] 支持 Component 模板
- [x] 支持 Instance 模板
- [x] 对其他可 clone 节点保留模板信息并添加低优先级警告
- [x] 对不可复制节点添加警告
- [x] 提取模板节点 id
- [x] 提取模板节点 name
- [x] 提取模板节点 type
- [x] 提取模板节点 width / height
- [x] 递归扫描模板内部 InstanceNode
- [x] 收集所有 `componentProperties` 属性名
- [x] 递归扫描模板内部 TextNode
- [x] 收集所有 Text Layer 名称
- [x] 去重 propertyNames
- [x] 去重 textLayerNames
- [x] 不移动、不改名、不修改模板节点
- [x] 添加 Mock 测试：只返回当前 Page 模板
- [x] 添加 Mock 测试：忽略普通 Frame
- [x] 添加 Mock 测试：提取 kindGuess
- [x] 添加 Mock 测试：提取组件属性名
- [x] 添加 Mock 测试：提取 Text Layer 名称

## 完成标准

- [x] 当前 Page 中所有 `PAGE_TEMP：` 模板可被识别
- [x] 模板原节点无任何修改
- [x] 扫描结果可用于 UI 模板下拉栏

