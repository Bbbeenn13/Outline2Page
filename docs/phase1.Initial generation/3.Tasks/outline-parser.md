# OutlineParser 最小任务

## 模块目标

解析用户粘贴的 Markdown 大纲，输出结构化 `OutlineDocument` 和解析警告。

## 输入

- `markdown: string`

## 输出

- `document: OutlineDocument`
- `warnings: ParseWarning[]`

## 最小任务清单

- [x] 创建 `src/core/outline-parser.ts`
- [x] 定义 `parseOutline(markdown: string): ParseOutput`
- [x] 按行切分 Markdown，并保留 `sourceLine`
- [x] 识别 `《...》` 为 Vision
- [x] 支持 `《Vision》= 主题` 格式，提取等号后的主题文本
- [x] 识别 `# ...` 为 TOC
- [x] 识别 `## ...` 为 CHAPTER
- [x] 识别 `### ...` 为 TITLE
- [x] 识别 `##### ...` 为 STEP
- [x] 将 TITLE 挂到最近的 CHAPTER 下
- [x] 将 STEP 挂到最近的 TITLE 下
- [x] 为 CHAPTER / TITLE / STEP 生成稳定 id
- [x] 为 CHAPTER / TITLE / STEP 生成从 1 开始的 index
- [x] 缺少 Vision 时添加警告
- [x] 缺少 TOC 时添加警告
- [x] TITLE 没有上级 CHAPTER 时添加警告
- [x] STEP 没有上级 TITLE 时添加警告
- [x] 遇到 `####` 或其他未定义层级时添加警告
- [x] 遇到空标题时添加警告
- [x] 保证解析警告不阻断输出
- [x] 为完整大纲添加单元测试
- [x] 为只有 CHAPTER 的大纲添加单元测试
- [x] 为 CHAPTER + TITLE 大纲添加单元测试
- [x] 为 CHAPTER + TITLE + STEP 大纲添加单元测试
- [x] 为缺少上级的 TITLE / STEP 添加单元测试
- [x] 为未定义层级添加单元测试

## 完成标准

- [x] 所有测试通过
- [x] 输出结构符合模块设计文档
- [x] 异常层级只产生警告，不抛出运行错误

