import { defineStore } from "pinia";
import type { RouteRecordRaw, RouteRecordName } from "vue-router";
import { cloneDeep } from "lodash-es";
import {
  type cacheType,
  store,
  ascending,
  getKeyList,
  filterTree,
  constantMenus,
  filterNoPermissionTree,
  formatFlatteningRoutes
} from "../utils";
import { useMultiTagsStoreHook } from "./multiTags";
import {
  getCachedPageList,
  setCachedPageList,
  clearCachedPageList,
  getMultiTagsCacheEnabled
} from "@/composables/useKeepAliveCache";

/**
 * 是否显示所有路由（静态 + 动态）
 * - 开发环境（dev）：显示所有路由，方便开发调试
 * - 生产环境（production）：仅显示动态路由（后端返回的菜单）
 */
const showAllRoutes = true;

/**
 * 收集路由树中所有路径
 * @param routes 路由数组
 * @returns 路径集合
 */
function collectAllPaths(routes: RouteRecordRaw[]): Set<string> {
  const paths = new Set<string>();
  function traverse(items: RouteRecordRaw[]) {
    for (const item of items) {
      if (item.path) {
        paths.add(item.path);
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  }
  traverse(routes);
  return paths;
}

/**
 * 过滤路由树，移除已存在的路径
 * @param routes 路由数组
 * @param existingPaths 已存在的路径集合
 * @returns 过滤后的路由数组
 */
function filterExistingRoutes(
  routes: RouteRecordRaw[],
  existingPaths: Set<string>
): RouteRecordRaw[] {
  return routes
    .filter(route => !existingPaths.has(route.path))
    .map(route => {
      if (route.children && route.children.length > 0) {
        return {
          ...route,
          children: filterExistingRoutes(route.children, existingPaths)
        };
      }
      return route;
    });
}

export const usePermissionStore = defineStore("pure-permission", {
  state: () => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [] as RouteRecordRaw[],
    // 整体路由（一维数组格式）
    flatteningRoutes: [] as RouteRecordRaw[],
    // 缓存页面 keepAlive（从 localStorage 恢复）
    cachePageList: getCachedPageList() as RouteRecordName[]
  }),
  actions: {
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: RouteRecordRaw[]) {
      let baseMenus: RouteRecordRaw[];

      if (showAllRoutes) {
        // 开发环境：合并静态路由和动态路由
        // 根据 path 去重，优先保留静态路由（因为静态路由的 name 已正确注册）
        const staticPaths = collectAllPaths(this.constantMenus);
        const filteredDynamicRoutes = filterExistingRoutes(
          cloneDeep(routes),
          staticPaths
        );
        baseMenus = this.constantMenus.concat(filteredDynamicRoutes);
      } else {
        // 生产环境：仅显示动态路由
        baseMenus = routes;
      }

      this.wholeMenus = filterNoPermissionTree(
        filterTree(ascending(baseMenus))
      );
      this.flatteningRoutes = formatFlatteningRoutes(baseMenus);
    },
    /** 监听缓存页面是否存在于标签页，不存在则删除 */
    clearCache() {
      let cacheLength = this.cachePageList.length;
      const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
      while (cacheLength > 0) {
        const currentCache = this.cachePageList[cacheLength - 1];
        if (nameList.findIndex(v => v === currentCache) === -1) {
          this.cachePageList.splice(
            this.cachePageList.indexOf(currentCache),
            1
          );
        }
        cacheLength--;
      }
      // 同步到持久化存储
      if (getMultiTagsCacheEnabled()) {
        setCachedPageList(this.cachePageList);
      }
    },
    cacheOperate({ mode, name }: cacheType) {
      const delIndex = this.cachePageList.findIndex(v => v === name);
      // 最大缓存页面数量
      const MAX_CACHE_SIZE = 10;

      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter(v => v !== name);
          this.clearCache();
          break;
        case "add":
          // 避免重复添加
          if (!this.cachePageList.includes(name)) {
            // 如果超过最大缓存数量，移除最早的缓存（保留首页）
            if (this.cachePageList.length >= MAX_CACHE_SIZE) {
              // 找到第一个非首页的缓存项并移除
              const indexToRemove = this.cachePageList.findIndex(
                v => v !== "Home" && v !== "Welcome"
              );
              if (indexToRemove !== -1) {
                this.cachePageList.splice(indexToRemove, 1);
              }
            }
            this.cachePageList.push(name);
          }
          break;
        case "delete":
          if (delIndex !== -1) {
            this.cachePageList.splice(delIndex, 1);
          }
          this.clearCache();
          break;
      }
      // 同步到持久化存储（add 模式）
      if (mode === "add" && getMultiTagsCacheEnabled()) {
        setCachedPageList(this.cachePageList);
      }
    },
    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.cachePageList = [];
      // 清除持久化存储
      clearCachedPageList();
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}
