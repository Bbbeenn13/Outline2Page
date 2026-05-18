# ReportBuilder 最小任务

## 模块目标

汇总解析、模板、计划、生成、注入、TOC 等模块输出，生成 UI 可读的生成报告。

## 输入

- `createdCount`
- `removedCount`
- `skippedPages`
- `warnings`
- `tocExpandedCount`
- `selectedNodeIds`

## 输出

- `GenerationReport`

## 最小任务清单

- [x] 创建 `src/core/report-builder.ts`
- [x] 定义 `buildGenerationReport(input: ReportBuilderInput): GenerationReport`
- [x] 统计 createdCount
- [x] 统计 replacedSectionCount
- [x] 统计 skippedCount
- [x] 统计 warningCount
- [x] 汇总 parse warnings
- [x] 汇总 template warnings
- [x] 汇总 planning warnings
- [x] 汇总 generation warnings
- [x] 汇总 injection warnings
- [x] 汇总 navigation warnings
- [x] 汇总 toc warnings
- [x] 记录 missingTemplates
- [x] 记录 missingProperties
- [x] 记录 tocExpandedCount
- [x] 记录 selectedNodeIds
- [x] 生成 UI 可展示的摘要文本
- [x] 保持 warning 顺序稳定
- [x] 添加测试：正常生成报告
- [x] 添加测试：缺模板报告
- [x] 添加测试：缺属性报告
- [x] 添加测试：TOC 扩展报告
- [x] 添加测试：多类 warning 合并

## 完成标准

- [x] UI 能直接渲染报告
- [x] 报告能说明创建、覆盖、跳过、警告、TOC 扩展
- [x] 报告生成不依赖 Figma API

