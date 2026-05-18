# v11.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。
- Git 状态：进入本轮前已有 v6-v10 及源码未提交改动，本轮只在现有基础上前进，不回退用户或历史改动。

## 检查清单

- [x] 读取用户最新反馈和截图。
- [x] 读取 `AGENTS.md`、`FIX_GUIDE.md`、v10.0 `progress.md`、v10.0 `debrief.md`。
- [x] 检查 Git 状态。
- [x] 新建 v11.0 修复文档。
- [x] 补充 TOC 写入失败回归测试。
- [x] 补充 Figma 嵌套属性路径带 `#id` 后缀的识别测试。
- [x] 修复 TOC 写入器。
- [x] 修复 component property 名称归一化，避免第一个 `#` 截断整条嵌套路径。
- [x] 运行完整验证。
- [x] 更新 debrief、RETRO、FIX_GUIDE。

## 已确认决策

- 本轮继续使用当前模板规则：`TOC_NAV_item/TYPE + 对应 TEXT`。
- 不回加旧 TOC 兼容路径。
- 修复重点是 TOC 写入器必须避免 `SHOW` 写入失败拖死文本写入。
- Figma component property raw key 写入时必须保留完整 key；归一化只用于匹配业务属性名，不能破坏嵌套路径结构。

## 未解决问题

- 暂无。

## 风险

- 如果文本属性本身缺失，代码无法凭空注入，只能 warning。

## 下一步

交付用户重新加载插件后复测当前 `TOC_NAV_group` 模板。

## 验证命令与结果

- `npx vitest run tests/figma/toc-expander.test.ts`：先按预期失败，证明旧写入器会被 `SHOW` 失败拖死；修复后通过，8 个测试通过。
- `npm test`：通过，16 个测试文件、89 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。

## FIX_GUIDE 更新判断

已更新：追加 TOC 写入必须具备逐属性 fallback、component property 归一化不能截断嵌套路径的当前规则。
