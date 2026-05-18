# Outline2Page Fix 2.0 Progress

## 当前状态

- 阶段：实现完成，已验证
- 基线参考：`164056d chore: backup outline2page 1.0 baseline`
- 本轮范围：修复 frame 完整命名与导航解析兼容

## 进度

- [x] 确认本轮修复应归档到 `doc/fix/2.0`
- [x] 保持 `doc/fix/1.0` 为上一轮历史记录
- [x] 创建 `doc/fix/2.0/proposal.md`
- [x] 创建 `doc/fix/2.0/task.md`
- [x] 创建 `doc/fix/2.0/progress.md`
- [x] 将 frame 命名改为 `<page>.<chapter>/<title>/<step>`
- [x] 导航解析支持完整层级路径
- [x] 导航解析兼容旧 `页数.kind` 短格式
- [x] 补充命名服务测试
- [x] 补充导航解析测试
- [x] 更新 `code.js`
- [x] 完整验证

## 关键结果

- `COVER`：`00.cover`
- `TOC`：`01.toc`
- `CHAPTER`：`02.第一章`
- `TITLE`：`03.第一章/门店洞察`
- `STEP`：`04.第一章/门店洞察/重点小节`

## 验证记录

- 针对性 `npm test -- tests/core/naming-service.test.ts`：通过，3 tests。
- 针对性 `npm test -- tests/figma/navigation-injector.test.ts`：通过，5 tests。
- `npm test`：通过，16 files / 67 tests。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，已更新 `code.js`。

## 风险

- `/` 是 Figma 图层名中的普通字符，本轮按用户指定格式保留；如果后续模板或外部导出流程把 `/` 当路径分隔符处理，需要再补转义策略。
- 完整路径的具体高亮序号仍由 page plan 提供；frame 名负责判断当前是章节、标题还是小节页。
