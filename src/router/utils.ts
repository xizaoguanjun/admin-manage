import {
  type RouterHistory,
  type RouteRecordRaw,
  createWebHistory,
  createWebHashHistory
} from "vue-router";
import { router } from "./index";
import { isProxy, toRaw } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import { isString, cloneDeep } from "lodash-es";
import { isAllEmpty, intersection, isIncludeAllChildren } from "jinbi-utils";
import { storageLocal } from "@/utils/global";
import { getConfig } from "@/config";
import { buildHierarchyTree, type TreeNode } from "@/utils/tree";
import { userKey, type DataInfo } from "@/utils/auth";
import { type menuType, routerArrays } from "@/layout/types";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
const IFrame = () => import("@/layout/frame.vue");
// 404 页面组件，用于没有对应组件的动态路由
const NotFoundPage = () => import("@/views/error/404.vue");
// https://cn.vitejs.dev/guide/features.html#glob-import
const modulesRoutes = import.meta.glob("/src/views/**/*.{vue,tsx}");

// 用于防止 initRouter 重复调用的锁
let initRouterPromise: Promise<typeof router> | null = null;
// 标记路由是否已经初始化完成
let isRouterInitialized = false;

// 动态路由
import { getAsyncRoutes } from "@/api/routes";

// 扩展 RouteRecordRaw 类型，支持后端返回的额外属性
type ExtendedRouteRecordRaw = RouteRecordRaw & {
  parentId?: string | number;
};

function handRank(routeInfo: RouteRecordRaw) {
  const extendedRoute = routeInfo as ExtendedRouteRecordRaw;
  const { name, path, meta } = routeInfo;
  const parentId = extendedRoute.parentId;
  return isAllEmpty(parentId)
    ? isAllEmpty(meta?.rank) ||
      (meta?.rank === 0 && name !== "Home" && path !== "/")
      ? true
      : false
    : false;
}

/** 按照路由中meta下的rank等级升序来排序路由 */
function ascending(arr: RouteRecordRaw[]) {
  arr.forEach((v, index) => {
    // 当rank不存在时，根据顺序自动创建，首页路由永远在第一位
    if (handRank(v) && v.meta) {
      v.meta.rank = index + 2;
    }
  });
  return arr.sort((a: RouteRecordRaw, b: RouteRecordRaw) => {
    return ((a?.meta?.rank as number) ?? 0) - ((b?.meta?.rank as number) ?? 0);
  });
}

/** 过滤meta中showLink为false的菜单 */
function filterTree(data: RouteRecordRaw[]): RouteRecordRaw[] {
  const newTree = cloneDeep(data).filter(v => v.meta?.showLink !== false);
  newTree.forEach(v => {
    if (v.children) {
      v.children = filterTree(v.children);
    }
  });
  return newTree;
}

/** 过滤children长度为0的的目录，当目录下没有菜单时，会过滤此目录，目录没有赋予roles权限，当目录下只要有一个菜单有显示权限，那么此目录就会显示 */
function filterChildrenTree(data: RouteRecordRaw[]): RouteRecordRaw[] {
  const newTree = cloneDeep(data).filter(v => v?.children?.length !== 0);
  newTree.forEach(v => {
    if (v.children) {
      v.children = filterTree(v.children);
    }
  });
  return newTree;
}

/** 判断两个数组彼此是否存在相同值 */
function isOneOfArray(a: Array<string> | undefined, b: Array<string>): boolean {
  if (!a) return true;
  return Array.isArray(a) && Array.isArray(b)
    ? intersection(a, b).length > 0
    : true;
}

/** 从localStorage里取出当前登录用户的角色roles，过滤无权限的菜单 */
function filterNoPermissionTree(data: RouteRecordRaw[]): RouteRecordRaw[] {
  const currentRoles =
    storageLocal().getItem<DataInfo<number>>(userKey)?.roles ?? [];
  const newTree = cloneDeep(data).filter(v =>
    isOneOfArray(v.meta?.roles as string[] | undefined, currentRoles)
  );
  newTree.forEach(v => {
    if (v.children) {
      v.children = filterNoPermissionTree(v.children);
    }
  });
  return filterChildrenTree(newTree);
}

/** 通过指定 `key` 获取父级路径集合，默认 `key` 为 `path` */
function getParentPaths(
  value: string,
  routes: RouteRecordRaw[],
  key: keyof RouteRecordRaw = "path"
): string[] {
  // 深度遍历查找
  function dfs(
    routes: RouteRecordRaw[],
    value: string,
    parents: string[]
  ): string[] {
    for (let i = 0; i < routes.length; i++) {
      const item = routes[i];
      // 返回父级path
      if (item[key] === value) return parents;
      // children不存在或为空则不递归
      if (!item.children || !item.children.length) continue;
      // 往下查找时将当前path入栈
      parents.push(item.path);

      if (dfs(item.children, value, parents).length) return parents;
      // 深度遍历查找未找到时当前path 出栈
      parents.pop();
    }
    // 未找到时返回空数组
    return [];
  }

  return dfs(routes, value, []);
}

/** 查找对应 `path` 的路由信息 */
function findRouteByPath(
  path: string,
  routes: RouteRecordRaw[]
): RouteRecordRaw | null {
  let res: RouteRecordRaw | null | undefined = routes.find(
    item => item.path === path
  );
  if (res) {
    return isProxy(res) ? toRaw(res) : res;
  } else {
    for (let i = 0; i < routes.length; i++) {
      const children = routes[i].children;
      if (children instanceof Array && children.length > 0) {
        res = findRouteByPath(path, children);
        if (res) {
          return isProxy(res) ? toRaw(res) : res;
        }
      }
    }
    return null;
  }
}

/** 动态路由注册完成后，再添加全屏404（页面不存在）页面，避免刷新动态路由页面时误跳转到404页面 */
function addPathMatch() {
  if (!router.hasRoute("pathMatch")) {
    router.addRoute({
      path: "/:pathMatch(.*)*",
      name: "PageNotFound",
      component: () => import("@/views/error/404.vue"),
      meta: {
        title: "menus.purePageNotFound",
        showLink: false
      }
    });
  }
}

/** 处理动态路由（后端返回的路由） */
function handleAsyncRoutes(routeList: RouteRecordRaw[]) {
  // 如果路由已经初始化，跳过处理
  if (isRouterInitialized && usePermissionStoreHook().wholeMenus.length > 0) {
    return;
  }

  if (routeList.length === 0) {
    usePermissionStoreHook().handleWholeMenus(routeList);
  } else {
    const flatRoutes = formatFlatteningRoutes(
      addAsyncRoutes(routeList)
    ) as RouteRecordRaw[];
    const rootRoute = router.options.routes[0];
    if (!rootRoute || !rootRoute.children) {
      console.error("[路由错误] 根路由不存在或没有 children");
      return;
    }
    flatRoutes.forEach((v: RouteRecordRaw) => {
      // 防止重复添加路由
      const existingIndex = rootRoute.children!.findIndex(
        value => value.path === v.path
      );
      if (existingIndex !== -1) {
        // 路径相同时，用动态路由的 meta.title 更新静态路由的 meta.title
        // 确保顶部标签页和左侧菜单栏显示的名称与接口返回的菜单名称一致
        const existingRoute = rootRoute.children![existingIndex];
        if (v.meta?.title && existingRoute.meta) {
          existingRoute.meta.title = v.meta.title;
        }
        return;
      }
      // 切记将路由push到routes后还需要使用addRoute，这样路由才能正常跳转
      rootRoute.children!.push(v);
      // 使用 addRoute 添加到路由表（添加到根路由下）
      if (v.name && !router.hasRoute(v.name)) {
        router.addRoute("/", v);
      }
    });
    // 最终路由进行升序
    ascending(rootRoute.children);
    usePermissionStoreHook().handleWholeMenus(routeList);
  }
  if (!useMultiTagsStoreHook().getMultiTagsCache) {
    const flatRoutes = usePermissionStoreHook()
      .flatteningRoutes as RouteRecordRaw[];
    useMultiTagsStoreHook().handleTags("equal", [
      ...routerArrays,
      ...flatRoutes.filter(v => v?.meta?.fixedTag)
    ]);
  }
  addPathMatch();
  // 标记路由初始化完成
  isRouterInitialized = true;
}

/** 初始化路由（`new Promise` 写法防止在异步请求中造成无限循环）*/
function initRouter() {
  // 如果已经有正在进行的初始化，直接返回该 Promise，防止重复调用
  if (initRouterPromise) {
    return initRouterPromise;
  }

  // 如果路由已经初始化完成且有菜单数据，直接返回
  if (isRouterInitialized && usePermissionStoreHook().wholeMenus.length > 0) {
    return Promise.resolve(router);
  }

  if (getConfig()?.CachingAsyncRoutes) {
    // 开启动态路由缓存本地localStorage
    const key = "async-routes";
    const asyncRouteList = storageLocal().getItem<RouteRecordRaw[]>(key);
    if (asyncRouteList && asyncRouteList?.length > 0) {
      initRouterPromise = new Promise(resolve => {
        handleAsyncRoutes(asyncRouteList);
        initRouterPromise = null;
        resolve(router);
      });
      return initRouterPromise;
    } else {
      initRouterPromise = new Promise(resolve => {
        getAsyncRoutes()
          .then(({ data }) => {
            handleAsyncRoutes(cloneDeep(data || []));
            storageLocal().setItem(key, data || []);
            initRouterPromise = null;
            resolve(router);
          })
          .catch(error => {
            console.error("获取路由失败:", error);
            // 接口失败时使用空路由数组
            handleAsyncRoutes([]);
            initRouterPromise = null;
            resolve(router);
          });
      });
      return initRouterPromise;
    }
  } else {
    initRouterPromise = new Promise(resolve => {
      getAsyncRoutes()
        .then(({ data }) => {
          handleAsyncRoutes(cloneDeep(data || []));
          initRouterPromise = null;
          resolve(router);
        })
        .catch(error => {
          console.error("获取路由失败:", error);
          // 接口失败时使用空路由数组
          handleAsyncRoutes([]);
          initRouterPromise = null;
          resolve(router);
        });
    });
    return initRouterPromise;
  }
}

/** 重置路由初始化状态（用于退出登录时） */
function resetRouterInitState() {
  initRouterPromise = null;
  isRouterInitialized = false;
}

/**
 * 将多级嵌套路由处理成一维数组
 * @param routesList 传入路由
 * @returns 返回处理后的一维路由
 */
function formatFlatteningRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  // buildHierarchyTree 期望 TreeNode[]，但 RouteRecordRaw 与 TreeNode 结构兼容
  let hierarchyList = buildHierarchyTree(
    routesList as unknown as TreeNode[]
  ) as unknown as RouteRecordRaw[];
  for (let i = 0; i < hierarchyList.length; i++) {
    const children = hierarchyList[i].children;
    if (children) {
      hierarchyList = hierarchyList
        .slice(0, i + 1)
        .concat(children, hierarchyList.slice(i + 1));
    }
  }
  return hierarchyList;
}

/**
 * 一维数组处理成多级嵌套数组（三级及以上的路由全部拍成二级，keep-alive 只支持到二级缓存）
 * https://github.com/pure-admin/vue-pure-admin/issues/67
 * @param routesList 处理后的一维路由菜单数组
 * @returns 返回将一维数组重新处理成规定路由的格式
 */
function formatTwoStageRoutes(routesList: RouteRecordRaw[]) {
  if (routesList.length === 0) return routesList;
  const newRoutesList: RouteRecordRaw[] = [];
  routesList.forEach((v: RouteRecordRaw) => {
    if (v.path === "/") {
      newRoutesList.push({
        component: v.component,
        name: v.name,
        path: v.path,
        redirect: v.redirect,
        meta: v.meta,
        children: []
      });
    } else {
      const firstRoute = newRoutesList[0];
      if (firstRoute && firstRoute.children) {
        firstRoute.children.push({ ...v });
      }
    }
  });
  return newRoutesList;
}

/** 处理缓存路由（添加、删除、刷新） */
function handleAliveRoute({ name }: ToRouteType, mode?: string) {
  switch (mode) {
    case "add":
      usePermissionStoreHook().cacheOperate({
        mode: "add",
        name
      });
      break;
    case "delete":
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name
      });
      break;
    case "refresh":
      usePermissionStoreHook().cacheOperate({
        mode: "refresh",
        name
      });
      break;
    default:
      usePermissionStoreHook().cacheOperate({
        mode: "delete",
        name
      });
      useTimeoutFn(() => {
        usePermissionStoreHook().cacheOperate({
          mode: "add",
          name
        });
      }, 100);
  }
}

// 定义可写的路由记录类型，用于动态路由处理
interface WritableRouteRecord {
  path: string;
  name?: string;
  component?: unknown;
  redirect?: string;
  meta?: Record<string, unknown>;
  children?: WritableRouteRecord[];
}

/** 过滤后端传来的动态路由 重新生成规范路由 */
function addAsyncRoutes(arrRoutes: Array<RouteRecordRaw>) {
  if (!arrRoutes || !arrRoutes.length) return [];
  const modulesRoutesKeys = Object.keys(modulesRoutes);
  arrRoutes.forEach(route => {
    // 使用可写类型来处理动态路由
    const v = route as WritableRouteRecord;
    // 确保 meta 存在
    if (!v.meta) v.meta = { title: "" };
    // 将backstage属性加入meta，标识此路由为后端返回路由
    v.meta.backstage = true;
    // 父级的redirect属性取值：如果子级存在且父级的redirect属性不存在，默认取第一个子级的path；如果子级存在且父级的redirect属性存在，取存在的redirect属性，会覆盖默认值
    if (v.children && v.children.length && !v.redirect) {
      v.redirect = v.children[0].path;
    }
    // 父级的name属性取值：如果子级存在且父级的name属性不存在，默认取第一个子级的name；如果子级存在且父级的name属性存在，取存在的name属性，会覆盖默认值（注意：测试中发现父级的name不能和子级name重复，如果重复会造成重定向无效（跳转404），所以这里给父级的name起名的时候后面会自动加上`Parent`，避免重复）
    if (v.children && v.children.length && !v.name) {
      v.name = (v.children[0].name as string) + "Parent";
    }
    if (v.meta?.frameSrc) {
      v.component = IFrame;
    } else {
      // 对后端传component组件路径和不传做兼容（如果后端传component组件路径，那么path可以随便写，如果不传，component组件路径会跟path保持一致）
      const componentPath =
        typeof v.component === "string" ? (v.component as string) : null;
      const index = componentPath
        ? modulesRoutesKeys.findIndex(ev => ev.includes(componentPath))
        : modulesRoutesKeys.findIndex(ev => ev.includes(v.path));

      // 如果找到对应组件则使用，否则跳转 404 页面
      if (index !== -1 && modulesRoutesKeys[index]) {
        v.component = modulesRoutes[modulesRoutesKeys[index]];
      } else {
        // 没有找到对应组件，跳转 404 页面
        console.warn(
          `[路由警告] 未找到路由 "${v.path}" 对应的组件，将跳转 404 页面`
        );
        v.component = NotFoundPage;
      }
    }
    if (v.children && v.children.length) {
      addAsyncRoutes(v.children as RouteRecordRaw[]);
    }
  });
  return arrRoutes;
}

/** 获取路由历史模式 https://next.router.vuejs.org/zh/guide/essentials/history-mode.html */
/**
 * 微前端 base 路径（由 qiankun 传递）
 * 在 qiankun 环境中，此值会在 main.ts 中设置
 */
let qiankunBasePath: string | undefined;

/**
 * 设置微前端 base 路径
 * @param basePath qiankun 传递的 basePath
 */
export function setQiankunBasePath(basePath: string | undefined) {
  qiankunBasePath = basePath;
}

/**
 * 获取微前端 base 路径
 */
export function getQiankunBasePath(): string | undefined {
  return qiankunBasePath;
}

function getHistoryMode(routerHistory: string): RouterHistory {
  // len为1 代表只有历史模式 为2 代表历史模式中存在base参数 https://next.router.vuejs.org/zh/api/#%E5%8F%82%E6%95%B0-1
  const historyMode = routerHistory.split(",");
  const leftMode = historyMode[0];
  const rightMode = historyMode[1];

  // 优先使用 qiankun 传递的 basePath
  const basePath = qiankunBasePath || rightMode || "";
  console.log("historyMode", historyMode);

  // no param
  if (historyMode.length === 1) {
    if (leftMode === "hash") {
      return createWebHashHistory(basePath);
    } else if (leftMode === "h5") {
      return createWebHistory(basePath);
    }
  } //has param
  else if (historyMode.length === 2) {
    if (leftMode === "hash") {
      return createWebHashHistory(basePath);
    } else if (leftMode === "h5") {
      return createWebHistory(basePath);
    }
  }
  // 默认返回 hash 模式
  return createWebHashHistory(basePath);
}

/** 获取当前页面按钮级别的权限 */
function getAuths(): Array<string> {
  return router.currentRoute.value.meta.auths as Array<string>;
}

/** 是否有按钮级别的权限（根据路由`meta`中的`auths`字段进行判断）*/
function hasAuth(value: string | Array<string>): boolean {
  if (!value) return false;
  /** 从当前路由的`meta`字段里获取按钮级别的所有自定义`code`值 */
  const metaAuths = getAuths();
  if (!metaAuths) return false;
  const isAuths = isString(value)
    ? metaAuths.includes(value)
    : isIncludeAllChildren(value, metaAuths);
  return isAuths ? true : false;
}

function handleTopMenu(
  route: RouteRecordRaw | undefined
): RouteRecordRaw | undefined {
  if (route?.children && route.children.length > 1) {
    if (route.redirect) {
      return route.children.find(cur => cur.path === route.redirect);
    } else {
      return route.children[0];
    }
  } else {
    return route;
  }
}

/** 获取所有菜单中的第一个菜单（顶级菜单）*/
function getTopMenu(tag = false): menuType | undefined {
  const wholeMenus = usePermissionStoreHook().wholeMenus as RouteRecordRaw[];
  const firstMenu = wholeMenus[0];
  const firstChild = firstMenu?.children?.[0] as RouteRecordRaw | undefined;
  const topMenu = handleTopMenu(firstChild);
  if (tag && topMenu) {
    useMultiTagsStoreHook().handleTags("push", topMenu);
  }
  return topMenu as menuType | undefined;
}

export {
  hasAuth,
  getAuths,
  ascending,
  filterTree,
  initRouter,
  getTopMenu,
  addPathMatch,
  isOneOfArray,
  getHistoryMode,
  addAsyncRoutes,
  getParentPaths,
  findRouteByPath,
  handleAliveRoute,
  formatTwoStageRoutes,
  formatFlatteningRoutes,
  filterNoPermissionTree,
  resetRouterInitState
};
