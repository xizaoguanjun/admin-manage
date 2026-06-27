import "@/utils/sso";
// TODO: 目前还没用到 cookie，暂时注释掉 Cookies 导入
// import Cookies from "js-cookie";
import { getConfig } from "@/config";
import NProgress from "@/utils/progress";
import { transformI18n } from "@/plugins/i18n";
import { buildHierarchyTree, type TreeNode } from "@/utils/tree";
import remainingRouter from "./modules/remaining";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { isUrl, isAllEmpty, openLink } from "jinbi-utils";
import { cloneDeep } from "lodash-es";
import { storageLocal } from "@/utils/global";
import {
  ascending,
  getTopMenu,
  initRouter,
  isOneOfArray,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes,
  resetRouterInitState,
  getQiankunBasePath
} from "./utils";
import { isQiankunEnv } from "./layout";
import {
  type Router,
  type RouteRecordRaw,
  createRouter,
  createWebHashHistory
} from "vue-router";
import { type DataInfo, userKey, removeToken } from "@/utils/auth";
import { restoreCacheFromTags } from "@/composables/useKeepAliveCache";

/** 自动导入全部静态路由，无需再手动引入！匹配 src/router/modules 目录（任何嵌套级别）中具有 .ts 扩展名的所有文件，除了 remaining.ts 文件
 * 如何匹配所有文件请看：https://github.com/mrmlnc/fast-glob#basic-syntax
 * 如何排除文件请看：https://cn.vitejs.dev/guide/features.html#negative-patterns
 */
const modules = import.meta.glob<{ default: RouteRecordRaw }>(
  "./modules/**/*.ts",
  {
    eager: true
  }
);

/** 原始静态路由（未做任何处理） */
const routes: RouteRecordRaw[] = [];

Object.keys(modules).forEach(key => {
  if (key.includes("remaining")) return;
  routes.push(modules[key].default);
});

const flatRoutes = routes.flat(Infinity) as RouteRecordRaw[];

/** 导出处理后的静态路由（三级及以上的路由全部拍成二级） */
export const constantRoutes: Array<RouteRecordRaw> = formatTwoStageRoutes(
  formatFlatteningRoutes(
    buildHierarchyTree(
      ascending(flatRoutes) as unknown as TreeNode[]
    ) as unknown as RouteRecordRaw[]
  ) as RouteRecordRaw[]
);

/** 初始的静态路由，用于退出登录时重置路由 */
const initConstantRoutes: Array<RouteRecordRaw> = cloneDeep(constantRoutes);

/** 用于渲染菜单，保持原始层级 */
export const constantMenus: Array<RouteRecordRaw> = ascending(
  flatRoutes as RouteRecordRaw[]
).concat(...remainingRouter);

/** 不参与菜单的路由 */
export const remainingPaths: string[] = remainingRouter.map(v => {
  return v.path;
});

// qiankun 专用布局组件
const QiankunLayout = () => import("@/layout/qiankun-layout.vue");

/**
 * 将路由配置中的 Layout 组件替换为 qiankun-layout
 * 用于在 qiankun 环境中创建简化布局的路由
 */
function createQiankunRoutes(
  routes: Array<RouteRecordRaw>
): Array<RouteRecordRaw> {
  console.log(
    "[createQiankunRoutes] 开始处理路由配置，路由数量:",
    routes.length
  );

  return routes.map((route, index) => {
    // 检查是否是使用 Layout 的路由（有 children 且 component 是函数）
    const hasChildren = route.children && route.children.length > 0;
    const isFunction = typeof route.component === "function";

    console.log(
      `[createQiankunRoutes] 路由 ${index}: path=${route.path}, hasChildren=${hasChildren}, isFunction=${isFunction}`
    );

    if (hasChildren && isFunction) {
      console.log(
        `[createQiankunRoutes] 替换路由 ${route.path} 的 Layout 为 QiankunLayout`
      );
      return {
        ...route,
        component: QiankunLayout, // 替换为 qiankun 简化布局
        children: route.children
      };
    }
    return route;
  });
}

/** 创建路由实例（默认使用完整布局） */
export const router: Router = createRouter({
  routes: constantRoutes.concat(...remainingRouter),
  strict: true,
  // 使用 Hash 路由模式，便于微前端集成
  history: createWebHashHistory(),
  scrollBehavior(_to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (from.meta.saveSrollTop) {
      const top: number =
        document.documentElement.scrollTop || document.body.scrollTop;
      return { left: 0, top };
    }
    return { left: 0, top: 0 };
  }
});

/**
 * 创建 qiankun 专用路由实例
 * 使用简化布局，只渲染内容区域
 */
export function createQiankunRouter(): Router {
  console.log("[createQiankunRouter] ===== 创建 qiankun 专用路由实例 =====");
  console.log(
    "[createQiankunRouter] constantRoutes 数量:",
    constantRoutes.length
  );

  const qiankunRoutes = createQiankunRoutes(constantRoutes).concat(
    ...remainingRouter
  );

  console.log(
    "[createQiankunRouter] qiankunRoutes 数量:",
    qiankunRoutes.length
  );

  const qiankunRouter = createRouter({
    routes: qiankunRoutes,
    strict: true,
    // 使用 Hash 路由模式，便于微前端集成
    history: createWebHashHistory(),
    scrollBehavior() {
      // qiankun 环境下禁用滚动行为
      return { left: 0, top: 0 };
    }
  });

  // 检查当前 URL 是否属于该子应用
  const currentPathname = window.location.pathname;
  // 根据激活规则判断是否属于当前子应用
  const basePath = getQiankunBasePath() || "/data-center-admin";
  const isMyRoute = currentPathname.startsWith(basePath);
  if (!isMyRoute) {
    console.log(
      "[createQiankunRouter] 当前 URL 不属于该子应用，将阻止初始导航:",
      currentPathname
    );
  }

  // ========================================================================
  // 为 qiankun 路由实例注册 beforeEach 守卫
  // 关键：独立模式的守卫只注册在 router 上，qiankun 模式需要单独注册
  // 这是 keep-alive 在 qiankun 模式下工作的根本修复
  // ========================================================================
  qiankunRouter.beforeEach((to: ToRouteType, _from, next) => {
    // 检查当前主应用 URL 是否属于该子应用
    // 如果主应用已切换到其他页面，则阻止子应用的路由导航
    const currentPathname = window.location.pathname;
    // 根据激活规则判断是否属于当前子应用
    const basePath = getQiankunBasePath() || "/data-center-admin";
    const isMyRoute = currentPathname.startsWith(basePath);

    if (!isMyRoute) {
      // 主应用已不在该子应用的路由，阻止导航
      // 这防止子应用在主应用切换页面时修改 URL
      console.log("[data-center-admin] 主应用不在子应用路由，阻止导航:", {
        currentPathname,
        to: to.path
      });
      next(false);
      return;
    }

    // 默认启用所有页面的 keepAlive 缓存（除非 meta.keepAlive 明确设为 false）
    if (to.meta?.keepAlive !== false && to.name) {
      handleAliveRoute(to, "add");
    }

    // qiankun 环境下简化守卫逻辑，直接放行
    next();
  });

  console.log("[createQiankunRouter] 路由实例创建完成（已注册缓存守卫）");
  return qiankunRouter;
}

/** 记录已经加载的页面路径 */
const loadedPaths = new Set<string>();

/** 重置已加载页面记录 */
export function resetLoadedPaths() {
  loadedPaths.clear();
}

/** 重置路由 */
export function resetRouter() {
  router.clearRoutes();
  for (const route of initConstantRoutes.concat(...remainingRouter)) {
    router.addRoute(route);
  }
  router.options.routes = formatTwoStageRoutes(
    formatFlatteningRoutes(
      buildHierarchyTree(
        ascending(flatRoutes) as unknown as TreeNode[]
      ) as unknown as RouteRecordRaw[]
    ) as RouteRecordRaw[]
  );
  usePermissionStoreHook().clearAllCachePage();
  resetLoadedPaths();
  // 重置路由初始化状态
  resetRouterInitState();
}

/** 路由白名单 */
const whiteList = ["/login"];

const { VITE_HIDE_HOME } = import.meta.env;

router.beforeEach((to: ToRouteType, _from, next) => {
  to.meta.loaded = loadedPaths.has(to.path);

  if (!to.meta.loaded) {
    NProgress.start();
  }

  // 默认启用所有页面的 keepAlive 缓存（除非 meta.keepAlive 明确设为 false）
  // 这样可以确保切换标签页时页面状态被保留
  if (to.meta?.keepAlive !== false && to.name) {
    handleAliveRoute(to, "add");
    // 页面整体刷新和点击标签页刷新
    if (_from.name === undefined || _from.name === "Redirect") {
      handleAliveRoute(to);
    }
  }

  // 在 qiankun 环境下，简化路由守卫逻辑，避免阻塞挂载
  if (isQiankunEnv()) {
    // qiankun 环境下直接放行，由主应用处理权限
    next();
    return;
  }

  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const externalLink = isUrl(to?.name as string);
  if (!externalLink) {
    to.matched.some(item => {
      if (!item.meta.title) return "";
      const Title = getConfig().Title;
      const translatedTitle = String(transformI18n(item.meta.title) ?? "");
      if (Title) document.title = `${translatedTitle} | ${Title}`;
      else document.title = translatedTitle;
    });
  }
  /** 如果已经登录并存在登录信息后不能跳转到路由白名单，而是继续保持在当前页面 */
  function toCorrectRoute() {
    if (whiteList.includes(to.fullPath)) {
      next(_from.fullPath);
    } else {
      next();
    }
  }
  // TODO: 目前还没用到 cookie，改为从 localStorage 判断用户是否已登录
  // if (Cookies.get(multipleTabsKey) && userInfo) {
  if (userInfo) {
    // 无权限跳转403页面
    if (
      to.meta?.roles &&
      userInfo?.roles &&
      !isOneOfArray(to.meta.roles, userInfo.roles)
    ) {
      next({ path: "/error/403" });
      return;
    }
    // 开启隐藏首页后在浏览器地址栏手动输入首页welcome路由则跳转到404页面
    if (VITE_HIDE_HOME === "true" && to.fullPath === "/welcome") {
      next({ path: "/error/404" });
      return;
    }
    if (_from?.name) {
      // name为超链接
      if (externalLink) {
        openLink(to?.name as string);
        NProgress.done();
      } else {
        toCorrectRoute();
      }
    } else {
      // 刷新
      if (
        usePermissionStoreHook().wholeMenus.length === 0 &&
        to.path !== "/login"
      ) {
        initRouter().then((router: Router) => {
          // 页面刷新时，从持久化的 tags 恢复 KeepAlive 缓存列表
          restoreCacheFromTags();

          if (!useMultiTagsStoreHook().getMultiTagsCache) {
            const { path } = to;
            const route = findRouteByPath(
              path,
              router.options.routes[0]?.children || []
            );
            getTopMenu(true);
            // query、params模式路由传参数的标签页不在此处处理
            if (route && route.meta?.title) {
              // buildHierarchyTree 会给路由添加 parentId 属性
              const routeWithParentId = route as RouteRecordRaw & {
                parentId?: number | string | null;
              };
              if (
                isAllEmpty(routeWithParentId.parentId) &&
                route.meta?.backstage &&
                route.children?.[0]
              ) {
                // 此处为动态顶级路由（目录）
                const { path, name, meta } = route.children[0];
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              } else {
                const { path, name, meta } = route;
                useMultiTagsStoreHook().handleTags("push", {
                  path,
                  name,
                  meta
                });
              }
            }
          }
          // 确保动态路由完全加入路由列表并且不影响静态路由（注意：动态路由刷新时router.beforeEach可能会触发两次，第一次触发动态路由还未完全添加，第二次动态路由才完全添加到路由列表，如果需要在router.beforeEach做一些判断可以在to.name存在的条件下去判断，这样就只会触发一次）
          if (isAllEmpty(to.name)) router.push(to.fullPath);
        });
      }
      toCorrectRoute();
    }
  } else {
    if (to.path !== "/login") {
      if (whiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        removeToken();
        next({ path: "/login" });
      }
    } else {
      next();
    }
  }
});

router.afterEach(to => {
  loadedPaths.add(to.path);
  NProgress.done();
});

export default router;
