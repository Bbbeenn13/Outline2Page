# OutlineAnalyzer 最小任务

## 模块目标

根据 `OutlineDocument` 统计页面生成所需信息，并推导需要哪些页面模板。

## 输入

- `document: OutlineDocument`

## 输出

- `OutlineSummary`

## 最小任务清单

- [x] 创建 `src/core/outline-analyzer.ts`
- [x] 定义 `analyzeOutline(document: OutlineDocument): OutlineSummary`
- [x] 统计 `chapterCount`
- [x] 统计 `titleCount`
- [x] 统计 `stepCount`
- [x] 读取 `vision`
- [x] 当存在 Vision 时加入 requiredPageKinds: `COVER`
- [x] 当存在 TOC 时加入 requiredPageKinds: `TOC`
- [x] 当存在 CHAPTER 时加入 requiredPageKinds: `CHAPTER`
- [x] 当存在 TITLE 时加入 requiredPageKinds: `TITLE`
- [x] 当存在 STEP 时加入 requiredPageKinds: `STEP`
- [x] 保持 requiredPageKinds 顺序为 `COVER / TOC / CHAPTER / TITLE / STEP`
- [x] 计算 `estimatedPageCount`
- [x] 添加 CHAPTER-only 统计测试
- [x] 添加 CHAPTER + TITLE 统计测试
- [x] 添加 CHAPTER + TITLE + STEP 统计测试
- [x] 添加缺少 Vision 的统计测试
- [x] 添加缺少 TOC 的统计测试

## 完成标准

- [x] requiredPageKinds 与输入层级一致
- [x] estimatedPageCount 与生成规则一致
- [x] 单元测试覆盖所有基础层级组合

