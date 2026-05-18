# TocExpander 最小任务

## 模块目标

在 TOC 页面中扩展 `NAV_group` 行，并注入 CHAPTER + TITLE 目录数据。

## 输入

- `tocNode: SceneNode`
- `document: OutlineDocument`
- `chapterRanges: Record<number, string>`

## 输出

- `expandedCount: number`
- `writtenCount: number`
- `warnings: TocWarning[]`

## 最小任务清单

- [x] 创建 `src/figma/toc-expander.ts`
- [x] 定义 `expandAndInjectToc(input: TocExpanderInput): Promise<TocExpanderOutput>`
- [x] 递归查找名称为 `NAV_group` 的节点
- [x] 根据大纲生成 TOC 行数据
- [x] TOC 行数据包含 CHAPTER 行
- [x] TOC 行数据包含 TITLE 行
- [x] TOC 行数据包含章节号
- [x] TOC 行数据包含章节页码跨度
- [x] 计算所需 `NAV_group` 数量
- [x] 当现有 `NAV_group` 不足时复制最后一个
- [x] 复制行后追加到相同父级
- [x] 至少两行时使用相邻行 y 差作为行距
- [x] 只有一行时使用行高加默认间距作为行距
- [x] 为复制出的 `NAV_group` 重新定位
- [x] 为每行写入 `TOC_CHAPTER_TEXT`
- [x] 为每行写入 `TOC_TITLE_TEXT`
- [x] 为每行写入 `TOC_NUM_TEXT`
- [x] 为每行写入 `TOC_PAGE_RANGE_TEXT`
- [x] 缺少 `NAV_group` 时返回 warning
- [x] 写入失败时返回 warning
- [x] 统计 expandedCount
- [x] 统计 writtenCount
- [x] 添加 Mock 测试：NAV_group 足够
- [x] 添加 Mock 测试：NAV_group 不足自动扩展
- [x] 添加 Mock 测试：缺少 NAV_group
- [x] 添加 Mock 测试：章节号写入正确
- [x] 添加 Mock 测试：页码跨度写入正确

## 完成标准

- [x] TOC 可展示 CHAPTER + TITLE
- [x] 行数不足时可自动复制 `NAV_group`
- [x] 扩展和注入结果进入生成报告

