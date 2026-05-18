# Phase 3 Patch 工作流

本目录用于记录 Outline2Page 的轻量级优化、视觉打磨、文案调整和非阻断性体验改进。

Patch 阶段的目标不是复刻 Phase 2 Fix 的完整排查流程，而是用更低成本把小改动做清楚、做完、可追踪、可验证。

## 适用范围

适合放入 Patch 的事项：

- UI 视觉细节优化，例如按钮状态、间距、颜色、滚动条、resize handle、面板质感。
- 不改变业务含义的文案微调。
- 不影响核心流程的小交互优化。
- 不改变数据结构、不改变生成规则、不引入新依赖的局部代码整理。
- 已知问题的低风险收尾，例如补一个遗漏的 hover/focus/disabled 状态。

不适合放入 Patch 的事项，应该升级到 `docs/phase2.Fix Problem/`：

- 生成结果错误、流程中断、数据丢失、模板写入异常。
- 需要排查根因的 bug。
- 交互规则、业务语义、验收标准不清楚。
- 会改变核心数据结构、消息协议、模板映射或生成逻辑。
- 修复失败会影响用户完成主要任务。

一句话判断：

```txt
不好看、不顺手、不够精致 -> Phase 3 Patch
不好用、会出错、会挡住、会生成错 -> Phase 2 Fix Problem
```

## 推荐目录结构

Patch 使用“单版本目录 + 单索引文件 + 单事项文档”的轻量结构。

```txt
docs/phase3.Patch/
  README.md
  v1.0/
    INDEX.md
    ui-panel-resize-handle-polish.md
    template-selector-spacing.md
```

版本规则：

- 同一轮连续的小型打磨，可以放在同一个版本目录中。
- 如果上一轮 Patch 已交付或主题明显变化，新建下一个版本目录，例如 `v1.0` 之后使用 `v2.0`。
- 一个 patch 事项对应一个 `.md` 文件，文件名使用英文短横线命名。
- 不强制创建 `proposal.md`、`task.md`、`progress.md`、`debrief.md` 四件套。
- 不强制维护 Patch 版 `RETRO.md`；只有出现可复用经验时，才写入本目录 README 的“长期规则”。

## INDEX.md 职责

每个版本目录建议包含一个 `INDEX.md`，作为本轮 Patch 的轻量总览。

模板：

```md
# Phase 3 Patch v1.0

## 范围

- [ ] ui-panel-resize-handle-polish.md
- [ ] template-selector-spacing.md

## 验证命令

- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

## 交付状态

- 状态：进行中 / 已交付
- 最后更新：YYYY-MM-DD
```

如果本轮只有一个非常小的 patch，可以省略 `INDEX.md`，但最终回复中必须说明改了什么、如何验证。

## 单事项文档模板

每个 patch 文档保持短小，建议包含以下内容：

```md
# UI Panel Resize Handle Polish

## 背景

右下角默认拖拽图标视觉过重，和暗色面板质感不匹配。

## 调整目标

- 降低 resize handle 的视觉存在感。
- 保留可发现性和可拖拽热区。
- 不改变面板尺寸、拖拽行为和生成流程。

## 涉及文件

- `src/ui.html`
- `code.js`

## 验收标准

- 右下角拖拽提示更细腻，不遮挡内容。
- 鼠标仍可拖拽调整面板尺寸。
- 小窗口和默认窗口下不出现重叠。

## 验证记录

- `npm run build`：待运行
- 浏览器/插件面板目视检查：待运行
```

## 执行原则

Patch 也必须做完整收尾，但记录方式可以轻：

- 先确认它不是 Fix 问题；如果会影响核心流程，立即升级到 Phase 2。
- 改动要小而完整，不做顺手重构。
- 每个 patch 必须有明确验收标准。
- 能自动测的就跑自动验证；纯视觉问题至少做截图或实际界面检查。
- 如果 patch 改了源码生成链路，必须同步验证 `code.js`。
- 如果发现问题比预期深，不要继续伪装成 Patch，改走 Phase 2 Fix 工作流。

## 收尾标准

一个 Patch 事项完成时，至少满足：

- 对应 `.md` 文档存在，或本轮 `INDEX.md` 中有清晰记录。
- 文档记录背景、目标、涉及文件、验收标准、验证记录。
- 代码改动和文档范围一致。
- 已运行可用验证命令，或明确说明为什么无法运行。
- 最终回复说明改动、验证结果、剩余风险。

## 长期规则

- UI polish 不等于随意改视觉；必须尊重现有界面风格和组件状态。
- 视觉 patch 要同时检查默认尺寸、小窗口尺寸和滚动状态。
- 影响 Figma 插件 UI 的 patch，优先验证 `src/ui.html` 和打包后的 `code.js` 是否同步。
- 如果 patch 需要多轮解释业务语义，说明它已经不是普通 patch，应升级为 Phase 2 Fix 或独立设计任务。
