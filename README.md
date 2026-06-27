# SaaS 基础平台 / 鲲鹏收费系统

基于 Vue 3 + Vite + TypeScript + Element Plus 的后台管理系统框架

## 📋 项目简介

本项目是 SaaS 平台的前端基础框架，基于现代化的技术栈构建。

**核心功能：**

- ✅ Vue 3 + Vite + TypeScript + Pinia 核心架构
- ✅ 国际化系统（vue-i18n）
- ✅ 系统管理模块（用户/角色/菜单/部门管理）
- ✅ 主题系统（主题色切换、暗黑模式）
- ✅ 高级表格功能（VXE Table）
- ✅ 权限控制系统（RBAC）
- ✅ 开发环境内置 Mock 数据

---

## 🚀 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.13.0
- pnpm >= 9

### 安装依赖

```bash
pnpm install
```

### 开发环境

```bash
pnpm dev
```

启动后访问：<http://localhost:8848>

**测试账号：**

- 管理员：admin / admin123
- 普通用户：common / common123

### 生产构建

```bash
pnpm build
```

### 代码检查

```bash
pnpm lint         # 运行所有检查
pnpm lint:eslint  # ESLint 检查
pnpm lint:prettier # Prettier 格式化
pnpm lint:stylelint # 样式检查
```

---

## 📦 技术栈

| 技术         | 版本    | 说明                   |
| ------------ | ------- | ---------------------- |
| Vue          | 3.5.22  | 渐进式 JavaScript 框架 |
| Vite         | 7.1.9   | 下一代前端构建工具     |
| TypeScript   | 5.9.3   | JavaScript 的超集      |
| Pinia        | 3.0.3   | Vue 状态管理库         |
| Element Plus | 2.11.4  | Vue 3 组件库           |
| VXE Table    | 4.6.25  | Vue 表格组件           |
| Vue Router   | 4.5.1   | Vue 路由管理器         |
| Vue I18n     | 11.1.12 | 国际化插件             |
| Tailwind CSS | 4.1.14  | CSS 框架               |
| Axios        | 1.12.2  | HTTP 客户端            |

---

## 📂 目录结构

```text
billing-system/
├── build/                      # 构建配置
│   ├── plugins.ts              # Vite 插件配置
│   ├── optimize.ts             # 依赖预构建
│   ├── cdn.ts                  # CDN 配置
│   ├── compress.ts             # 压缩配置
│   ├── info.ts                 # 构建信息
│   └── utils.ts                # 构建工具
├── docs/                       # 项目文档
├── examples/                   # 示例文档
├── locales/                    # 国际化
│   ├── zh-CN.yaml              # 中文
│   └── en.yaml                 # 英文
├── public/                     # 静态资源
├── src/
│   ├── api/                    # API 接口
│   │   ├── common/             # 通用 API
│   │   │   ├── region/         # 区域相关
│   │   │   └── ...
│   │   ├── fee-manage/         # 收费管理 API
│   │   ├── project-manage/     # 项目管理 API
│   │   │   ├── grid-manage/    # 网格管理
│   │   │   ├── project-manage-list/  # 项目列表
│   │   │   ├── property-vehicle-space-manage/  # 物业车位管理
│   │   │   └── user-manage/    # 用户管理
│   │   ├── user.ts             # 用户 API
│   │   └── routes.ts           # 路由 API
│   ├── assets/                 # 资源文件
│   │   ├── iconfont/           # 图标字体
│   │   ├── login/              # 登录页资源
│   │   ├── status/             # 状态图标
│   │   ├── svg/                # SVG 图标
│   │   └── table-bar/          # 表格工具栏图标
│   ├── components/             # 全局组件
│   │   ├── ReAnimateSelector/  # 动画选择器
│   │   ├── ReAuth/             # 权限组件
│   │   ├── ReCard/             # 卡片组件
│   │   ├── ReCol/              # 列组件
│   │   ├── ReCountTo/          # 数字动画
│   │   ├── ReDialog/           # 对话框组件
│   │   ├── ReDrawer/           # 抽屉组件
│   │   ├── ReFileUpload/       # 文件上传
│   │   ├── ReFlicker/          # 闪烁效果
│   │   ├── ReFormContainerHeader/  # 表单容器头部
│   │   ├── ReIcon/             # 图标组件
│   │   ├── ReLineTree/         # 线性树
│   │   ├── RePerms/            # 权限组件
│   │   ├── RePlusPage/         # 分页组件
│   │   ├── RePlusTree/         # 树组件
│   │   ├── ReSegmented/        # 分段控制器
│   │   ├── ReSelectV2/         # 选择器组件
│   │   ├── ReStatusDialog/     # 状态对话框
│   │   ├── ReSvgIcon/          # SVG 图标
│   │   ├── ReTabsWithFilter/   # 带过滤的标签页
│   │   └── ReText/             # 文本组件
│   ├── composables/            # 组合式函数
│   │   ├── useApiBuilder.ts    # API 构建器
│   │   ├── useListRequest.ts    # 列表请求
│   │   ├── usePlusProConfig.ts  # Plus Pro 配置
│   │   ├── useRegion.ts        # 区域相关
│   │   └── useSelectWithPagination.ts  # 分页选择
│   ├── config/                 # 配置文件
│   │   └── globalIcons.ts      # 全局图标配置
│   ├── directives/             # 自定义指令
│   │   ├── auth/               # 权限指令
│   │   ├── perms/              # 权限校验指令
│   │   ├── copy/               # 复制指令
│   │   ├── load-more/          # 加载更多指令
│   │   └── optimize/           # 防抖节流指令
│   ├── layout/                 # 布局组件
│   │   ├── components/         # 布局子组件
│   │   ├── hooks/              # 布局钩子
│   │   ├── frame.vue           # 框架组件
│   │   └── index.vue           # 布局入口
│   ├── plugins/                # 插件配置
│   │   ├── elementPlus.ts      # Element Plus 配置
│   │   ├── globalComponents.ts  # 全局组件注册
│   │   └── i18n.ts             # 国际化配置
│   ├── router/                 # 路由配置
│   │   └── modules/            # 路由模块
│   │       ├── fee.ts          # 收费管理路由
│   │       ├── home.ts         # 首页路由
│   │       ├── project.ts      # 项目管理路由
│   │       └── remaining.ts    # 其他路由
│   ├── services/               # 服务层
│   ├── store/                  # 状态管理
│   │   └── modules/            # Store 模块
│   │       ├── app.ts          # 应用状态
│   │       ├── epTheme.ts      # 主题状态
│   │       ├── fileUpload.ts   # 文件上传状态
│   │       ├── global.ts       # 全局状态
│   │       ├── multiTags.ts    # 多标签状态
│   │       ├── permission.ts   # 权限状态
│   │       ├── settings.ts     # 设置状态
│   │       └── user.ts         # 用户状态
│   ├── style/                  # 全局样式
│   │   ├── fonts/              # 字体文件
│   │   └── ...
│   ├── utils/                  # 工具函数
│   │   ├── http/               # HTTP 工具
│   │   ├── localforage/        # 本地存储
│   │   ├── money/              # 金额处理
│   │   └── progress/           # 进度条
│   ├── views/                  # 页面组件
│   │   ├── components/         # 页面级组件
│   │   │   ├── ProjectTreeSelect/  # 项目树选择
│   │   │   └── PropertyTree/   # 物业树
│   │   ├── error/              # 错误页
│   │   │   ├── 403.vue         # 403 错误
│   │   │   ├── 404.vue         # 404 错误
│   │   │   └── 500.vue         # 500 错误
│   │   ├── fee-manage/         # 收费管理
│   │   │   ├── meter-management/      # 表具管理
│   │   │   ├── meter-reading/         # 抄表管理
│   │   │   ├── receivable-management/ # 应收管理
│   │   │   ├── standard-binding/      # 标准绑定
│   │   │   ├── subject-standard-setting/  # 科目标准设置
│   │   │   └── tax-rate-setting/      # 税率设置
│   │   ├── login/              # 登录页
│   │   │   ├── components/     # 登录子组件
│   │   │   └── utils/          # 登录工具
│   │   ├── project-manage/     # 项目管理
│   │   │   ├── grid-manage/    # 网格管理
│   │   │   ├── project-manage-list/  # 项目列表
│   │   │   ├── property-vehicle-space-manage/  # 物业车位管理
│   │   │   └── user-manage/    # 用户管理
│   │   └── welcome/            # 欢迎页
│   ├── App.vue
│   └── main.ts
├── types/                      # TypeScript 类型定义
├── test/                       # 测试文件
├── .env                        # 环境变量
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── commitlint.config.js        # Commitlint 配置
├── Dockerfile                  # Docker 配置
├── eslint.config.js            # ESLint 配置
├── package.json
├── postcss.config.js           # PostCSS 配置
├── stylelint.config.js         # Stylelint 配置
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts            # Vitest 配置
└── vitest.setup.ts             # Vitest 设置
```

---

## 🔧 开发说明

### Mock 数据

开发环境使用内置的 Mock 数据，无需启动后端服务。

**Mock 数据位置：**

- `src/api/user.ts` - 登录、刷新 token
- `src/api/routes.ts` - 动态路由
- `src/api/system.ts` - 系统管理 CRUD

**切换到真实后端：**

删除或注释掉 API 文件中的 Mock 逻辑（`isDev` 判断部分）。

### 权限控制

**角色权限：**

- `admin` - 管理员，拥有所有权限
- `common` - 普通用户，部分权限

**使用方式：**

```vue
<!-- 按钮级权限（v-auth） -->
<el-button v-auth="'admin'">仅管理员可见</el-button>

<!-- 权限指令（v-perms） -->
<el-button v-perms="['permission:btn:add']">有权限才显示</el-button>

<!-- 权限组件 -->
<Auth :value="['admin']">
  <el-button>仅管理员可见</el-button>
</Auth>
```

### 主题定制

**修改主题色：**

系统设置面板 → 主题配置 → 选择主题色

**代码方式：**

```typescript
import { useEpThemeStoreHook } from "@/store/modules/epTheme";

useEpThemeStoreHook().setEpThemeColor("#409EFF");
```

---

## 🎨 自定义指令

| 指令       | 说明                   | 用法                               |
| ---------- | ---------------------- | ---------------------------------- |
| v-auth     | 按钮级权限控制（角色） | `v-auth="'admin'"`                 |
| v-perms    | 权限校验（权限标识）   | `v-perms="['permission:btn:add']"` |
| v-copy     | 一键复制文本           | `v-copy="'复制的内容'"`            |
| v-optimize | 防抖/节流优化          | `v-optimize`                       |

---

## 📝 开发规范

### Git 提交规范

```bash
feat:     新功能
fix:      修复 bug
docs:     文档更新
style:    代码格式（不影响代码运行）
refactor: 重构
perf:     性能优化
test:     测试相关
chore:    构建过程或辅助工具变动
```

### 代码风格

项目使用 ESLint + Prettier + Stylelint 进行代码规范检查。

提交前会自动运行 lint-staged 检查暂存的文件。

---

## 🔗 相关链接

- [Vue 3 官方文档](https://cn.vuejs.org/)
- [Vite 官方文档](https://cn.vitejs.dev/)
- [Element Plus 文档](https://element-plus.org/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)
- [Vue Router 文档](https://router.vuejs.org/zh/)

## 👥 团队

金碧智慧技术团队
