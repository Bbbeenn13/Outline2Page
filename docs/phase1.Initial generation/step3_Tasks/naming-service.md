# NamingService 最小任务

## 模块目标

为每个生成页面生成稳定、可读、能反映大纲层级的节点名称。

## 输入

- `page: PagePlanItem`

## 输出

- `frameName: string`

## 最小任务清单

- [x] 创建 `src/core/naming-service.ts`
- [x] 定义 `createFrameName(page: PagePlanItem): string`
- [x] 为 COVER 生成 `00_COVER_主题名`
- [x] 为 TOC 生成 `01_TOC`
- [x] 为 CHAPTER 生成包含页码、`CHAPTER`、章节名的名称
- [x] 为 TITLE 生成包含页码、`TITLE`、章节名、标题名的名称
- [x] 为 STEP 生成包含页码、`STEP`、章节名、标题名、小节名的名称
- [x] 清理换行符
- [x] 清理连续空格
- [x] 清理首尾空格
- [x] 对空文本使用可读 fallback
- [x] 保持中文文本不丢失
- [x] 添加 COVER 命名单元测试
- [x] 添加 TOC 命名单元测试
- [x] 添加 CHAPTER 命名单元测试
- [x] 添加 TITLE 命名单元测试
- [x] 添加 STEP 命名单元测试
- [x] 添加换行和多空格清理测试

## 完成标准

- [x] 生成名称包含页面类型
- [x] 生成名称包含对应大纲文本
- [x] 生成名称稳定可预测

