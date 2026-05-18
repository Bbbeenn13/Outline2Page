# NodeFactory 最小任务

## 模块目标

根据用户选择的模板生成页面节点，并放入生成 Section。

## 输入

- `page: PagePlanItem`
- `template: TemplateInfo`
- `section: SectionNode`
- `placement: { x: number; y: number }`

## 输出

- `node: SceneNode | null`
- `warnings: GenerationWarning[]`

## 最小任务清单

- [x] 创建 `src/figma/node-factory.ts`
- [x] 定义 `createNodeFromTemplate(input: NodeFactoryInput): NodeFactoryOutput`
- [x] 根据 template.id 获取 Figma 模板节点
- [x] 当模板是 Frame 时使用 `clone()`
- [x] 当模板是 Component 时使用 `createInstance()`
- [x] 当模板是 Instance 时使用 `clone()`
- [x] 其他可 clone 节点尝试 `clone()`
- [x] 复制失败时返回 warning
- [x] 不修改原模板节点
- [x] 设置生成节点名称为 `page.frameName`
- [x] 设置生成节点 x 坐标
- [x] 设置生成节点 y 坐标
- [x] 将生成节点追加到 Section
- [x] 为生成节点设置 pluginData 标记
- [x] 返回生成节点
- [x] 添加 Mock 测试：Frame clone
- [x] 添加 Mock 测试：Component createInstance
- [x] 添加 Mock 测试：Instance clone
- [x] 添加 Mock 测试：复制失败 warning
- [x] 添加 Mock 测试：名称和坐标正确
- [x] 添加 Mock 测试：节点加入 Section

## 完成标准

- [x] 模板节点不被修改
- [x] 生成节点类型符合复制策略
- [x] 复制失败不会中断全部生成流程

