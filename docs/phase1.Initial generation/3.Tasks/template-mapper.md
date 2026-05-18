# TemplateMapper 最小任务

## 模块目标

根据大纲所需页面类型和用户选择，生成页面类型到模板的映射。

## 输入

- `requiredPageKinds: PageKind[]`
- `templates: TemplateInfo[]`
- `selectedTemplateIds: Record<PageKind, string>`

## 输出

- `mapping: Record<PageKind, TemplateInfo | null>`
- `missingKinds: PageKind[]`
- `warnings: TemplateWarning[]`

## 最小任务清单

- [x] 创建 `src/core/template-mapper.ts`
- [x] 定义 `mapTemplates(input: TemplateMappingInput): TemplateMappingResult`
- [x] 为每个 requiredPageKind 查找用户选择的 templateId
- [x] templateId 存在时映射到 TemplateInfo
- [x] templateId 缺失时映射为 null
- [x] templateId 不存在于 templates 时映射为 null
- [x] 将缺失页面类型加入 `missingKinds`
- [x] 为缺失模板添加 warning
- [x] 保持缺失模板不阻断整体流程
- [x] 添加完整映射单元测试
- [x] 添加缺少一个模板的单元测试
- [x] 添加用户选择不存在 id 的单元测试
- [x] 添加 requiredPageKinds 为空的单元测试

## 完成标准

- [x] 每种页面类型都有明确映射结果
- [x] 缺失模板只进入 warning
- [x] PagePlanner 可基于 null 映射跳过对应页面

