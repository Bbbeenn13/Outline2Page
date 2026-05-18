# UI Panel Resize Handle Polish

## 背景

右下角面板拖拽图标视觉过重，和当前暗色插件面板的精细质感不匹配。

## 调整目标

- 降低 resize handle 的视觉存在感。
- 保留右下角拖拽热区和可发现性。
- 不改变面板尺寸规则、拖拽逻辑和生成流程。

## 涉及文件

- `src/ui.html`

## 验收标准

- 右下角只显示克制的细线拖拽提示。
- 拖拽热区仍位于面板右下角。
- 不遮挡底部按钮和滚动条。
- 默认窗口与小窗口下视觉稳定。

## 验证记录

- `npm test`：通过，16 个测试文件、86 个测试通过。
- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm run build`：通过，生成 `code.js`。
- 浏览器预览检查：通过，右下角热区为 24x24，细线提示为 13x13，cursor 保持 `nwse-resize`。
