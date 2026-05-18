# PaginationService 最小任务

## 模块目标

计算页面实际页码、格式化页码文本和章节页码跨度。

## 输入

- `pages: PagePlanItem[]`

## 输出

- `pages: PagePlanItem[]`
- `chapterRanges: Record<number, string>`

## 最小任务清单

- [x] 创建 `src/core/pagination-service.ts`
- [x] 定义 `applyPagination(pages: PagePlanItem[]): PaginationOutput`
- [x] COVER 保留命名编号 `00`
- [x] TOC 实际页码设为 1
- [x] TOC 的 `pageNumberText` 设为 `01`
- [x] TOC 后页面依次递增
- [x] 所有正文页面生成 `pageNumber`
- [x] 所有正文页面生成两位数 `pageNumberText`
- [x] 计算每个 CHAPTER 的起始页码
- [x] 计算每个 CHAPTER 的结束页码
- [x] 章节只有 CHAPTER 页时输出 `03-03` 格式
- [x] 章节包含 TITLE / STEP 时跨度到该章节最后页面
- [x] 格式化 `TOC_PAGE_RANGE_TEXT` 为 `03-08`
- [x] 添加 COVER + TOC 测试
- [x] 添加无 COVER 但有 TOC 测试
- [x] 添加单章节无 TITLE 测试
- [x] 添加多 TITLE / STEP 跨度测试
- [x] 添加两位数格式测试

## 完成标准

- [x] `PAGE_PAGE_TEXT` 可直接使用 `pageNumberText`
- [x] `TOC_PAGE_RANGE_TEXT` 可直接使用 chapterRanges
- [x] 页码计算不依赖 Figma API

