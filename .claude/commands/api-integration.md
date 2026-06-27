# API 接口联调

请按照以下步骤进行 API 接口联调：$ARGUMENTS

## 步骤

1. **阅读接口文档**
   - 确认接口路径、方法、参数、返回值
   - 理解业务逻辑

2. **在 unified-builder.ts 注册接口**
   - 文件：`src/api/common/unified-builder.ts`
   - 使用 createApi 或 createPageApi

3. **创建类型定义**
   - 在对应模块的 `types.ts` 中定义
   - 禁止使用 any，必要时用 unknown 并注释原因

4. **更新组件调用**
   - 替换 mock 数据为真实接口
   - 如接口缺少字段，保留 mock 并标记 TODO

5. **验证**
   - 运行 `pnpm typecheck`
   - 测试接口调用

## 重要规则

- 不要在 catch 中写 ElMessage.error（http 拦截器已处理）
- 字段名必须与后端接口一致，不做二次映射
- 缺失字段标记 TODO，告知用户
