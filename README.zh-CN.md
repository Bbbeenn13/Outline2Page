<div align="center">

# Outline2Page

把结构化 Markdown 大纲转成可复用的 Figma 页面。

[中文](README.zh-CN.md) · [English](README.en.md)

![项目理解图](docs/outline2page-architecture.svg)

</div>

## 项目简介

Outline2Page 是一个 Figma 插件，用来把内容大纲快速落成页面结构。

它负责解析 Markdown 层级、匹配 `PAGE_TEMP` 模板、复制 Frame、写入内容、同步导航状态，并在生成后返回报告。

## 核心能力

- 支持 `COVER / TOC / CHAPTER / TITLE / STEP` 页面结构。
- 扫描当前 Figma 页面中的模板。
- 自动显示可选模板并完成映射。
- 写入章节、标题、小节、页码、目录、显示状态和高亮状态。
- TOC 内容不足时自动扩展。
- 再次生成时覆盖上一次插件产物。

## 使用流程

1. 准备 Markdown 大纲。
2. 在当前 Figma 页面创建 `PAGE_TEMP` 模板。
3. 打开插件并粘贴大纲。
4. 检查解析结果、模板映射和警告。
5. 点击生成。
6. 查看输出 Section 和报告。

## 大纲示例

```md
《产品演示》
# TOC
## 第一章
### 关键问题
##### 现状洞察
```

## 模板命名

```text
PAGE_TEMP:COVER
PAGE_TEMP:TOC
PAGE_TEMP:CHAPTER
PAGE_TEMP:TITLE
PAGE_TEMP:STEP
```

也支持中文冒号：

```text
PAGE_TEMP：COVER
```

## 仓库结构

```text
src/
  core/       解析、规划、布局、命名、报告
  figma/      Figma API 适配层
  ui.html     插件 UI
tests/        单元、集成、适配测试
docs/         项目理解图
```

## 开发

```bash
npm install
npm run build
npm test
npm run typecheck
npm run lint
```

## License

UNLICENSED
