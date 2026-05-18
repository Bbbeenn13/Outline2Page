# GeneratedSectionManager 最小任务

## 模块目标

删除旧生成 Section，创建新 Section，设置内部标记，并在生成后选中新 Section。

## 输入

- `currentPage: PageNode`
- `sectionName: string`

## 输出

- `section: SectionNode`
- `removedCount: number`

## 最小任务清单

- [x] 创建 `src/figma/generated-section-manager.ts`
- [x] 定义 `prepareGeneratedSection(input: SectionManagerInput): SectionManagerOutput`
- [x] 在当前 Page 中查找 Section
- [x] 使用 `getPluginData("outline2page.generated")` 判断旧生成 Section
- [x] 只删除标记值为 `true` 的旧 Section
- [x] 不删除 `PAGE_TEMP：` 模板
- [x] 不删除无 pluginData 的普通节点
- [x] 不删除用户放在旧 Section 外部的节点
- [x] 创建新 Section
- [x] 设置 Section 名称为 `Outline2Page_GENERATED`
- [x] 设置 `pluginData: outline2page.generated = true`
- [x] 设置 `pluginData: outline2page.generatedAt`
- [x] 返回删除数量
- [x] 提供 `selectGeneratedSection(section)` 方法
- [x] 生成完成后设置 `figma.currentPage.selection = [section]`
- [x] 添加 Mock 测试：删除旧 Section
- [x] 添加 Mock 测试：保留普通 Section
- [x] 添加 Mock 测试：保留模板节点
- [x] 添加 Mock 测试：新 Section 带 pluginData
- [x] 添加 Mock 测试：选中新 Section

## 完成标准

- [x] 覆盖只影响插件生成 Section
- [x] 模板和用户外部内容不受影响
- [x] 生成后用户可直接移动整个 Section

