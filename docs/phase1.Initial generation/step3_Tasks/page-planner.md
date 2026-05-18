# PagePlanner 最小任务

## 模块目标

将结构化大纲转换为扁平页面计划 `PagePlanItem[]`，并跳过缺失模板的页面。

## 输入

- `document: OutlineDocument`
- `templateMapping: Record<PageKind, TemplateInfo | null>`

## 输出

- `pages: PagePlanItem[]`
- `skippedPages: SkippedPage[]`
- `warnings: PlanningWarning[]`

## 最小任务清单

- [x] 创建 `src/core/page-planner.ts`
- [x] 定义 `createPagePlan(input: PagePlannerInput): PagePlannerOutput`
- [x] Vision 存在且 COVER 模板存在时生成 COVER 页面计划
- [x] TOC 存在且 TOC 模板存在时生成 TOC 页面计划
- [x] 为每个 CHAPTER 生成 CHAPTER 页面计划
- [x] 为每个 TITLE 生成 TITLE 页面计划
- [x] 为每个 STEP 生成 STEP 页面计划
- [x] CHAPTER 页面携带 `chapterIndex` 和 `chapterTitle`
- [x] TITLE 页面携带 `chapterIndex`、`titleIndex`、`chapterTitle`、`titleText`
- [x] STEP 页面携带 `chapterIndex`、`titleIndex`、`stepIndex`、`chapterTitle`、`titleText`、`stepText`
- [x] 每个页面携带 `vision`
- [x] 每个页面携带对应 `templateId`
- [x] 缺少模板时跳过对应页面
- [x] 缺少模板时写入 skippedPages
- [x] 缺少模板时写入 warning
- [x] 保持页面顺序为 COVER → TOC → 大纲顺序
- [x] 为完整大纲添加单元测试
- [x] 为缺少 STEP 模板添加单元测试
- [x] 为缺少 TOC 模板添加单元测试
- [x] 为只有 CHAPTER 的大纲添加单元测试
- [x] 为页面上下文添加断言测试

## 完成标准

- [x] 页面计划顺序稳定
- [x] 缺失模板不会阻断其他页面计划
- [x] 每个 PagePlanItem 的上下文足够后续注入使用

