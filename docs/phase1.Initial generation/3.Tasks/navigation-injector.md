# NavigationInjector 最小任务

## 模块目标

识别导航项，按大纲顺序写入导航文案、`SHOW` 和 `HIGHLIGHT`。

## 输入

- `node: SceneNode`
- `page: PagePlanItem`
- `document: OutlineDocument`

## 输出

- `showWrittenCount: number`
- `highlightWrittenCount: number`
- `warnings: NavigationWarning[]`

## 最小任务清单

- [x] 创建 `src/figma/navigation-injector.ts`
- [x] 定义 `injectNavigation(input: NavigationInjectorInput): Promise<NavigationInjectorOutput>`
- [x] 递归查找名称为 `NAV_CHAPTER` 或 `NAV_CHAPTER_01` 格式的节点
- [x] 递归查找名称为 `NAV_TITLE` 或 `NAV_TITLE_01` 格式的节点
- [x] 递归查找名称为 `NAV_STEP` 或 `NAV_STEP_01` 格式的节点
- [x] 解析显式后缀 `_NN`
- [x] 无显式后缀时按 y 从小到大排序
- [x] y 接近时按 x 从小到大排序
- [x] 为无后缀节点赋予逻辑序号
- [x] 根据当前页面上下文计算当前 CHAPTER
- [x] 根据当前页面上下文计算当前 TITLE
- [x] 根据当前页面上下文计算当前 STEP
- [x] 对存在对应大纲项的导航节点写 `SHOW=true`
- [x] 对超出大纲数量的导航节点写 `SHOW=false`
- [x] 对当前 CHAPTER 写 `HIGHLIGHT=on`
- [x] 对非当前 CHAPTER 写 `HIGHLIGHT=off`
- [x] 对当前 TITLE 写 `HIGHLIGHT=on`
- [x] 对非当前 TITLE 写 `HIGHLIGHT=off`
- [x] 对当前 STEP 写 `HIGHLIGHT=on`
- [x] 对非当前 STEP 写 `HIGHLIGHT=off`
- [x] TITLE 页无 STEP 时不强行高亮 STEP
- [x] 写入导航 CHAPTER 文案
- [x] 写入导航 TITLE 文案
- [x] 写入导航 STEP 文案
- [x] 缺少 SHOW 属性时记录 warning
- [x] 缺少 HIGHLIGHT 属性时记录 warning
- [x] 添加测试：显式后缀排序
- [x] 添加测试：无后缀视觉排序
- [x] 添加测试：多余 STEP 隐藏
- [x] 添加测试：当前 STEP 高亮
- [x] 添加测试：TITLE 页无 STEP
- [x] 添加测试：缺少 SHOW / HIGHLIGHT 不崩溃

## 完成标准

- [x] 有后缀和无后缀导航项都能稳定排序
- [x] SHOW 使用布尔值
- [x] HIGHLIGHT 使用 `on/off`
- [x] 当前页导航状态正确

