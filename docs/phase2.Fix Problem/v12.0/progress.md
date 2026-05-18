# v12.0 修复进度

## 当前阶段

修复完成，完整验证通过。

## 基线状态

- 基线 commit：未创建。
- Git 状态：进入本轮前已有多轮 fix 未提交改动，并出现 phase1 文档移动/删除状态；本轮不回退、不删除这些既有改动。

## 检查清单

- [x] 读取用户确认。
- [x] 读取 `AGENTS.md`、`FIX_GUIDE.md`、v11.0 `progress.md`、v11.0 `debrief.md`。
- [x] 检查 Git 状态。
- [x] 读取当前 `toc-expander`、TOC 测试、property injector、类型定义。
- [x] 新建 v12.0 修复文档。
- [x] 改造 TOC 单测为扁平 item 协议。
- [x] 改造 TOC 实现为扁平扫描写入。
- [x] 运行完整验证。
- [x] 更新 debrief、RETRO、FIX_GUIDE。

## 已确认决策

- TOC 和 PAGE_NAV 统一为 container + 内部独立 item instance + `TYPE` + text + `SHOW` 的底层协议。
- TOC 不再以外层 `TOC_NAV_item/...` 嵌套暴露属性作为当前支持目标。
- TOC 文本写入和 `SHOW` 写入分离。
- `TOC_PAGE` + `TOC_PAGE_TEXT` 作为 `TOC_PAGE_RANGE` + `TOC_PAGE_RANGE_TEXT` 的页码范围别名支持。

## 未解决问题

- 暂无。

## 风险

- 现有 Figma 模板需要把 TOC item 从外层嵌套暴露属性改为内部独立 instance 协议。
- 如果模板完全封装内部 item，不暴露可访问 instance，插件无法按新协议写入。

## 下一步

交付用户按扁平协议调整当前 Figma TOC 模板后复测。

## 验证命令与结果

- `npx vitest run tests/figma/toc-expander.test.ts`：先按预期失败，旧实现找不到扁平 item；修复后通过，9 个测试通过。
- `npm test`：通过，16 个测试文件、90 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已生成 `code.js`。

## 收束复查

- `git diff --check`：通过，仅提示工作区文件未来会按 CRLF 处理，无 whitespace error。
- `npm test`：通过，16 个测试文件、90 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，`code.js` 保持同步。
- 当前仍有 phase1 文档目录迁移/删除状态和多轮 fix 文档未提交状态；本轮未回退、未删除、未 stage。

## FIX_GUIDE 更新判断

已更新：TOC/PAGE_NAV 统一扁平 item 协议，旧外层 `TOC_NAV_item/...` 不再作为支持目标。
