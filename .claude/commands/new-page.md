# 创建新页面

请按照以下步骤为 billing-system 创建新页面：$ARGUMENTS

## 步骤

1. **分析需求**
   - 理解页面功能和数据结构
   - 确定需要的 API 接口

2. **创建文件结构**
   - 在 `src/views/` 对应模块下创建文件夹
   - 创建 `index.vue` 主页面
   - 如有复杂组件，创建 `components/` 子目录

3. **参考现有实现**
   - 列表页参考：`src/views/fee-manage/standard-binding/`
   - 表单页参考：`src/views/project-manage/user-manage/`

4. **遵循规范**
   - 使用 RePlusPage 组件（列表页）
   - 使用 PlusDialogForm（表单弹窗）
   - API 在 `src/api/common/unified-builder.ts` 注册
   - 类型定义无 any

5. **添加路由**
   - 在 `src/router/modules/` 对应文件添加路由

6. **验证**
   - 运行 `pnpm typecheck` 检查类型
   - 运行 `pnpm lint` 检查代码风格
