# Phase 2 Fix 当前指南

本文件是后续 fix 的当前行动地图，只记录仍有效、会指导开发/决策/修复/测试的规则。历史细节看 `RETRO.md` 和具体版本目录。

## 读取顺序

进入 fix 前默认读取：

1. `AGENTS.md`
2. 本文件
3. 当前最高版本目录的 `progress.md` 与 `debrief.md`
4. 按需读取 `RETRO.md` 或更旧版本目录

不要默认通读所有旧版本。只有当问题线索指向旧版本、旧模板、旧兼容路径或历史决策时，才追溯对应版本。

## 决策原则

- 不清楚用户意图、业务含义、验收标准或实现边界时，先问清楚再实现。
- Figma 模板结构以扫描结果和用户确认作为准则，不根据组件名或字段名猜测真实语义。
- 新模板或新业务规则确认后，代码和测试应跟随收敛；不要长期保留会干扰判断的旧兼容路径。
- 安全兜底不等于历史兼容。布局 fallback、旧生成 Section 清理这类安全机制可以保留；旧模板结构兼容需要明确是否仍支持。
- 修改源码后必须同步验证构建产物 `code.js`。

## 模块边界

### PAGE_NAV

- `PAGE_NAV_group` 当前使用内部 `NAV_item` 及其暴露的 `_TEXT`、`SHOW`、`HIGHLIGHT` 属性。
- `HIGHLIGHT` 是 PAGE_NAV 的当前正确实现，不属于 TOC 历史冗余。
- PAGE_NAV 写入器只负责 `PAGE_*` 文本，不写 `TOC_*_TEXT`。
- PAGE_NAV 的嵌套属性 key 需要继续支持，例如 `NAV_item/PAGE_TITLE_TEXT#...`。
- PAGE_NAV 的推荐模板协议是扁平 item：container + 内部独立 item instance + item 自身 `TYPE` + item 自身 text + `SHOW/HIGHLIGHT`。

### TOC

- TOC 当前只支持扁平 item 协议：`TOC_NAV_group` 是章节行容器，内部独立 item instance 自己暴露 `TYPE`、对应 `TOC_*_TEXT` 和可选 `SHOW`。
- `TYPE` 是 TOC item 的唯一角色来源，必须位于 item 自身。
- 支持的 TOC `TYPE` 值：`TOC_NUM`、`TOC_CHAPTER`、`TOC_PAGE_RANGE`、`TOC_PAGE`、`TOC_TITLE`。
- `TOC_PAGE` + `TOC_PAGE_TEXT` 作为 `TOC_PAGE_RANGE` + `TOC_PAGE_RANGE_TEXT` 的页码范围别名。
- 不再支持旧 TOC `HIGHLIGHT`、外层 `TOC_NAV_item/...` 嵌套暴露属性、旧 `NAV_item/TOC_*`、row-level `TOC_*_TEXT`、按文本名猜角色。
- TOC 行数必须随大纲章节变化扩展；多余 title 槽必须清空并写入 `SHOW=false`。
- TOC 标题槽不足时 clone 最后一个扁平 `TOC_TITLE` item；可复制行不足或写入失败时输出 warning，不回退旧兼容路径。

### 属性注入

- 字段写入优先走 `propertyMapping`，默认映射只作为当前仍有效的兜底。
- 实际调用 `setProperties` 时必须使用 Figma 返回的完整 raw key；归一化后的名称只用于匹配业务语义。
- component property 名称归一化要移除各路径段的 `#id` 后缀，但不能在第一个 `#` 处截断整条嵌套路径。
- 专属注入器一次写多个 component properties 时，必须在批量写入失败后逐属性 fallback，避免 `SHOW`、`HIGHLIGHT` 或 variant 失败拖死文本写入。
- 普通属性注入器跳过导航/目录专属容器时，不应把专属注入器负责的目标误报为缺失。
- UI 展示字段使用业务语言，例如“封面主题”“章节标题”“小节文字”，不要暴露内部类型术语。

### 命名与生成清理

- frame 名可用于判断页面层级，但精确 chapter/title/step 索引优先来自结构化 page plan。
- frame 命名规则变化时，必须同步检查依赖 frame 名的解析逻辑，尤其是导航高亮。
- 重新生成时必须清理旧生成 Section。带 pluginData 的旧结果和历史默认命名生成 Section 都需要覆盖。

## 必测项

相关 fix 至少考虑：

- `toc-expander`：扁平 TOC item 自身 `TYPE` 对位写入。
- `toc-expander`：`TOC_NUM`、`TOC_CHAPTER`、`TOC_PAGE_RANGE`、`TOC_TITLE` 分别写入对应 TEXT，不串位。
- `toc-expander`：`TOC_PAGE` / `TOC_PAGE_TEXT` 页码范围别名。
- `toc-expander`：TOC 行数随章节数变化，多余 title 清空并隐藏。
- `toc-expander`：title 槽不足时 clone 内部 `TOC_TITLE` item，不复制整行。
- `toc-expander`：槽位不足或写入失败时 warning，不回退旧 TOC 兼容。
- `toc-expander`：`SHOW` 写入失败时，`TOC_*_TEXT` 仍要逐属性写入成功。
- `navigation-injector`：PAGE_NAV 的 SHOW/HIGHLIGHT/text 写入。
- `navigation-injector`：PAGE_NAV 不写 `TOC_*_TEXT`。
- `property-injector`：默认映射、用户映射、warning 不中断。
- `generated-section-manager`：旧版本默认命名生成 Section 即使缺少 pluginData，也要清理。
- 修改 UI 到主线程消息结构时补集成测试，防止 payload 漏字段。

## 验证命令

完整验证优先运行：

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

如果某条命令缺失或无法运行，必须在 `progress.md` 和最终回复中说明。

## 收尾沉淀

- `debrief.md` 写完整复盘。
- `FIX_GUIDE.md` 只吸收当前仍有效的行动规则。
- `RETRO.md` 只追加本轮短历史索引。
- 不默认回写旧版本历史；只有旧索引仍会误导当前指南或最新判断时，才按需标注删除线和修正说明。
