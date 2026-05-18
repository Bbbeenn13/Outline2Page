# LayoutEngine 最小任务

## 模块目标

根据页面计划和模板尺寸计算生成节点坐标，保证章节分行、标题小队和 STEP 间距符合需求。

## 输入

- `pages: PagePlanItem[]`
- `templateSizes: Record<string, { width: number; height: number }>`
- `options: { rowGap: 100; stepGap: 100; titleGroupGap: 200 }`

## 输出

- `placements: Record<string, { x: number; y: number }>`

## 最小任务清单

- [x] 创建 `src/core/layout-engine.ts`
- [x] 定义 `calculateLayout(input: LayoutInput): LayoutOutput`
- [x] 支持默认 `rowGap = 100`
- [x] 支持默认 `stepGap = 100`
- [x] 支持默认 `titleGroupGap = 200`
- [x] 将 COVER 和 TOC 放在最前方
- [x] 将每个 CHAPTER 作为新章节行起点
- [x] 同一章节内按 CHAPTER → TITLE → STEP 排列
- [x] 同一 TITLE 下 STEP 间距使用 100
- [x] 不同 TITLE 小队间距使用 200
- [x] 不同 CHAPTER 行垂直间距使用 100
- [x] 根据模板 width 计算下一个 x
- [x] 根据当前行最大 height 计算下一行 y
- [x] 缺少模板尺寸时使用安全 fallback 并返回 warning
- [x] 添加单章节布局测试
- [x] 添加多章节换行测试
- [x] 添加同标题多个 STEP 间距测试
- [x] 添加不同 TITLE 小队间距测试
- [x] 添加不同尺寸模板不重叠测试

## 完成标准

- [x] 每个 PagePlanItem 都有 placement
- [x] 生成位置不重叠
- [x] 布局计算不依赖 Figma API

