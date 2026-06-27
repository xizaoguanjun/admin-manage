# billing-system 迁移到 yc-components 进度记录

**更新时间**: 2025-12-01  
**当前版本**: yc-components@0.1.30

---

## 一、已完成模块迁移

### 1. `/project-manage` 模块 ✅

| 路由 | 状态 | 说明 |
|------|------|------|
| `/project-manage/list` | ✅ 完成 | 项目管理列表 |
| `/project-manage/property-vehicle-space-manage` | ✅ 完成 | 物业/车位管理 |
| `/project-manage/grid-manage` | ✅ 完成 | 网格管理 |
| `/project-manage/user-manage` | ✅ 完成 | 用户管理 |

### 2. `/billing-manage` 模块 ✅

| 路由 | 状态 | 说明 |
|------|------|------|
| `/billing-manage/cashier` | ✅ 完成 | 收银台 |
| `/billing-manage/arrears-offset` | ✅ 完成 | 欠费冲抵 |
| `/billing-manage/refund-processing` | ✅ 完成 | 退款办理 |
| `/billing-manage/order-manage` | ✅ 完成 | 订单管理 |
| `/billing-manage/collection-manage` | ✅ 完成 | 交款管理 |
| `/billing-manage/penalty-reduction` | ✅ 完成 | 违约金减免 |
| `/billing-manage/payment-reminder` | ✅ 完成 | 催缴管理 |

### 3. `/fee-manage` 模块 ✅

| 路由 | 状态 | 说明 |
|------|------|------|
| `/fee-manage/meter-reading` | ✅ 完成 | 抄表管理 |
| `/fee-manage/meter-management` | ✅ 完成 | 仪表管理 |
| `/fee-manage/subject-standard-setting` | ✅ 完成 | 科目与标准设置 |
| `/fee-manage/standard-binding` | ✅ 完成 | 收费标准绑定 |
| `/fee-manage/receivable-management` | ✅ 完成 | 应收管理 |
| `/fee-manage/project-billing-setting` | ✅ 完成 | 项目计费设置 |

---

## 二、yc-components 修复记录

### 1. TSX 构建支持 (scripts/build/modules.ts)

**问题**: `YcMoreActions` 组件报错 "React is not defined"

**修复**:
- 添加 `@vitejs/plugin-vue-jsx` 插件
- glob 模式添加 `.tsx` 扩展名: `**/*.{js,ts,tsx,vue}`
- esbuild loaders 添加 `.tsx` 处理
- nodeResolve extensions 添加 `.tsx`

```typescript
// 修改前
await glob('**/*.{js,ts,vue}', { ... })

// 修改后
await glob('**/*.{js,ts,tsx,vue}', { ... })
```

### 2. YcDialog props 透传

**问题**: 弹窗 `title` 不显示，显示为默认的"弹窗"

**修复**: 
- 移除 `YcDialog` 中对 `title`、`modelValue` 等 props 的显式定义
- 让这些 props 通过 `$attrs` 透传给 `PlusDialog`

### 3. YcFormContainerHeader 主题色支持

**问题**: 渐变色竖条不显示

**修复**:
- 添加 CSS 变量 fallback 支持
- 支持 `gradientColors` prop 自定义颜色

```scss
background: linear-gradient(
  180deg,
  var(--yc-header-gradient-start, var(--pure-button-primary-gradient-start, var(--el-color-primary))) 0%,
  var(--yc-header-gradient-end, var(--pure-button-primary-gradient-end, var(--el-color-primary-light-3))) 100%
);
```

### 4. YcMoreActions context 类型

**问题**: `context` prop 类型推断为 `undefined`，无法接受 `Record<string, unknown>`

**修复** (packages/components/yc-more-actions/src/type.ts):
```typescript
// 修改前
context?: unknown

// 修改后
context?: Record<string, unknown> | object | null
```

### 5. YcSelectV2 modelValue 类型

**问题**: `renderField` 中使用时类型不兼容

**修复**: 将 `modelValue` 类型改为 `FieldValueType`

---

## 三、billing-system 全局配置

### App.vue 配置 YcConfigProvider

```vue
<template>
  <el-config-provider :locale="currentLocale">
    <YcConfigProvider :config="ycConfig">
      <router-view />
      <ReDrawer />
    </YcConfigProvider>
  </el-config-provider>
</template>
```

### main.ts 导入样式

```typescript
import "yc-components/index.css";
```

### globalComponents.ts 组件别名

```typescript
// 保持向后兼容的别名
app.component("ReSvgIcon", YcSvgIcon);
app.component("ReCard", YcCard);
app.component("ReStatusDialog", YcStatusDialog);
```

---

## 四、待迁移模块

- [x] `/fee-manage` - 费用管理 ✅
- [ ] `/report` - 报表
- [ ] `/system` - 系统设置
- [ ] 其他模块...

---

## 五、迁移组件映射表

| 本地组件 | yc-components |
|---------|---------------|
| `@/components/RePlusPage` | `RePlusPage` from `yc-components` |
| `@/components/ReSvgIcon` | `ReSvgIcon` from `yc-components` |
| `@/components/ReDialog` | `ReDialog` from `yc-components` |
| `@/components/ReDrawer` | `ReDrawer`, `addDrawer`, `closeDrawer` from `yc-components` |
| `@/components/ReSelectV2` | `ReSelectV2` from `yc-components` |
| `@/components/ReFormContainerHeader` | `ReFormContainerHeader` from `yc-components` |
| `@/components/ReTabsWithFilter` | `ReTabsWithFilter` from `yc-components` |
| `@/components/RePlusTree/type` | `TreeNodeData` from `yc-components` |
| `plus-pro-components` 类型 | `yc-components` |

### 类型导入示例

```typescript
// 修改前
import type { PlusColumn, PageInfo, ButtonsCallBackParams } from "yc-pro-components";
import { RePlusPage } from "@/components/RePlusPage";

// 修改后
import {
  RePlusPage,
  type PlusColumn,
  type PageInfo,
  type ButtonsCallBackParams
} from "yc-components";
```

---

## 六、注意事项

1. **IDE 类型缓存**: 修改 yc-components 后，可能需要重启 TypeScript 服务器
   - `Cmd+Shift+P` → "TypeScript: Restart TS Server"

2. **Vite 缓存**: 更新 yc-components 后清除缓存
   ```bash
   rm -rf node_modules/.vite
   ```

3. **yalc 更新流程**:
   ```bash
   # 在 yc-components 目录
   pnpm build && cd dist/yc-components && yalc push
   
   # 在 billing-system 目录
   npm run yalc-update  # 或手动清除 .vite 缓存并重启
   ```

---

## 七、验证清单

- [x] 收银台页面正常加载
- [x] 欠费冲抵 Tab 切换正常
- [x] 订单管理搜索/表格正常
- [x] 退款办理 Tab 切换正常
- [x] 无 "React is not defined" 错误
- [x] 无 YcMoreActions 类型错误
- [x] vue-tsc --noEmit 无相关报错

---

**下次继续**: 从 `/report` 或 `/system` 模块开始迁移

