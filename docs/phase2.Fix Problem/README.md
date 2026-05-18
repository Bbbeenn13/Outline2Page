# Phase 2 Fix Problem 工作流

本目录用于记录 Outline2Page 的所有结构化修复版本。

## 触发条件

当用户说要 `fix`、`修复`、`修 bug`、`bugfix`，或描述一个需要排查并修复的问题时，必须调用并遵循 `structured-fix-workflow` skill，同时采用本目录的版本约定。

## 版本目录

每一轮修复使用独立版本目录：

```txt
docs/phase2.Fix Problem/
  v1.0/
    proposal.md
    task.md
    progress.md
    debrief.md
  v2.0/
    proposal.md
    task.md
    progress.md
    debrief.md
```

本目录根部还必须维护总复盘文件：

```txt
docs/phase2.Fix Problem/RETRO.md
```

同时维护当前指南文件：

```txt
docs/phase2.Fix Problem/FIX_GUIDE.md
```

`FIX_GUIDE.md` 是当前开发、决策、修复、测试的行动地图。后续 agent 进入 fix 前优先阅读它，再读取当前最高版本目录的 `progress.md` 与 `debrief.md`。

`RETRO.md` 是历史索引，用于追溯每轮 fix 的关键根因和状态。它不再承担当前操作手册职责，也不要求每轮 fix 通读全文。

默认读取顺序：

1. `AGENTS.md`
2. `docs/phase2.Fix Problem/FIX_GUIDE.md`
3. 当前最高版本目录的 `progress.md` 与 `debrief.md`
4. 按需读取 `RETRO.md` 或更旧版本目录

### RETRO.md 更新规范

更新 `RETRO.md` 前必须先用 UTF-8 明确读取文件内容，例如 PowerShell 使用：

```powershell
Get-Content -LiteralPath 'docs\phase2.Fix Problem\RETRO.md' -Encoding utf8
```

如果终端默认输出出现乱码，不要据此判断文件结构不可匹配；应改用显式 UTF-8 读取后再定位章节。

新增版本历史索引必须合并到现有标准结构中：

- 新版本条目写入 `## 版本教训` 下，使用 `### vX.0 问题名`。
- 条目内部沿用现有格式，至少包含 `根因` 与 `沉淀`。
- 每个版本条目优先控制在 3-5 行，用于索引而不是复述完整过程。
- 可复用且当前仍有效的必测项、长期风险、决策规则应写入 `FIX_GUIDE.md`，而不是继续膨胀 `RETRO.md`。
- 禁止因为补丁上下文匹配失败，就把新版本内容临时追加到文件尾部。

复盘沉淀必须避免旧判断污染后续 agent：

- 先判断每条结论的当前有效性：仍有效、仅历史有效、已被后续版本推翻、只对特定模块有效。
- `FIX_GUIDE.md` 只放当前仍会指导实现和验证的内容。
- 已废弃的实现路径、模板结构、兼容策略或测试要求，不得继续放进 `FIX_GUIDE.md`。
- 如果旧版本总结仍有追溯价值但不再推荐执行，不删除整行；只有在刚好读到且确认会误导当前决策时，才用 Markdown 删除线 `~~...~~` 标注旧结论，并补一句当前版本修正，例如“v10 修正：不是优先，而是唯一支持路径”。
- 如果旧结论只对某个模块有效，必须写清模块边界；不要把局部经验写成全局规则。例如 `PAGE_NAV_group` 的 `HIGHLIGHT` 规则不能外推到当前 `TOC_NAV_group`。
- 当用户明确模板或业务规则已经升级，`FIX_GUIDE.md` 应同步移除旧兼容路径；`RETRO.md` 只需在本轮索引中说明“不再作为支持目标”“不要回加兼容”。

### FIX_GUIDE.md 更新规范

- 每轮 fix 收尾时判断是否需要更新 `FIX_GUIDE.md`。
- 只有当前仍有效、会指导未来开发/决策/修复/测试的内容才写入 `FIX_GUIDE.md`。
- 如果本轮只是历史修正、一次性排查或不会改变后续行动规则，不更新 `FIX_GUIDE.md`，但必须在 `progress.md` 写明无需更新。
- `FIX_GUIDE.md` 应保持短而可执行，优先使用模块边界、决策流程、必测项、禁止回加路径、验证命令。
- 不把完整复盘、旧版本细节、已废弃方案写入 `FIX_GUIDE.md`；这些内容留在对应版本 `debrief.md` 或 `RETRO.md` 索引中。

版本选择规则：

- 继续未完成修复：使用当前最高版本目录。
- 开启新一轮修复：在当前最高版本基础上递增主版本，例如 `v3.0` 之后创建 `v4.0`。
- 旧版本是历史记录，除非修正明显笔误或路径污染，否则不要回写新需求。

## 文档职责

### proposal.md

记录修复方案，必须包含：

- 背景
- 当前问题
- 目标方案
- 不做范围
- 待确认问题
- 验收标准
- 已知风险

### task.md

记录可执行任务，必须包含：

- 任务目标
- 涉及文件或模块
- 完成标准
- 测试要求

### progress.md

记录执行状态，必须包含：

- 当前阶段
- 基线状态或基线 commit
- 检查清单
- 已确认决策
- 未解决问题
- 风险
- 下一步
- 验证命令与结果

### debrief.md

记录本轮修复复盘指导，必须在最终交付前补齐，必须包含：

- 本轮问题根因
- 有效判断
- 走偏判断
- 有效测试或检查
- 下次同类问题操作准则
- 剩余风险

## 收尾标准

一轮 fix 只有在以下条件都满足时才算完成：

- `proposal.md`、`task.md`、`progress.md`、`debrief.md` 都存在。
- 已判断并记录是否需要更新 `FIX_GUIDE.md`；需要时已更新。
- 本轮 `debrief.md` 中需要追溯的历史索引已经同步写入 `RETRO.md`。
- 用户确认过的关键决策已经写入文档。
- 实现与文档范围一致。
- 测试覆盖本轮变更的核心行为。
- 项目可用验证命令已经运行，并把结果写入 `progress.md`。
- 最终回复说明改动、验证结果、剩余风险。
