/**
 * KeepAlive 缓存管理 Composable
 *
 * @description 统一管理 KeepAlive 缓存列表的持久化和恢复
 *
 * 功能：
 * 1. 与 multiTagsCache 配置联动
 * 2. 持久化缓存列表到 localStorage
 * 3. 页面刷新时恢复缓存
 * 4. 与标签页同步清理
 *
 * @module composables/useKeepAliveCache
 */

import type { RouteRecordName } from "vue-router";
import { watch } from "vue";
import { storageLocal } from "@/utils/global";
import { responsiveStorageNameSpace } from "@/config";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";

/**
 * localStorage 存储 key
 */
const CACHE_KEY = () => `${responsiveStorageNameSpace()}cachePageList`;

/**
 * 获取当前是否开启页签持久化
 */
export function getMultiTagsCacheEnabled(): boolean {
  return (
    storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.multiTagsCache ?? false
  );
}

/**
 * 从 localStorage 获取持久化的缓存列表
 */
export function getCachedPageList(): RouteRecordName[] {
  if (!getMultiTagsCacheEnabled()) {
    return [];
  }
  return storageLocal().getItem<RouteRecordName[]>(CACHE_KEY()) ?? [];
}

/**
 * 将缓存列表持久化到 localStorage
 */
export function setCachedPageList(cacheList: RouteRecordName[]): void {
  if (!getMultiTagsCacheEnabled()) {
    return;
  }
  storageLocal().setItem(CACHE_KEY(), cacheList);
}

/**
 * 清除持久化的缓存列表
 */
export function clearCachedPageList(): void {
  storageLocal().removeItem(CACHE_KEY());
}

/**
 * 根据持久化的标签页恢复缓存列表
 *
 * @description 页面刷新时，根据持久化的 multiTags 重建 cachePageList
 */
export function restoreCacheFromTags(): void {
  // 仅在开启持久化时执行
  if (!getMultiTagsCacheEnabled()) {
    return;
  }

  const permissionStore = usePermissionStoreHook();
  const multiTagsStore = useMultiTagsStoreHook();

  // 获取持久化的标签页
  const tags = multiTagsStore.multiTags;
  if (!Array.isArray(tags) || tags.length === 0) {
    return;
  }

  // 遍历标签页，将需要缓存的页面添加到 cachePageList
  // 默认缓存所有有 name 的标签页（除非 keepAlive 明确设为 false）
  tags.forEach(tag => {
    if (tag.meta?.keepAlive !== false && tag.name) {
      const name = tag.name as RouteRecordName;
      // 避免重复添加
      if (!permissionStore.cachePageList.includes(name)) {
        permissionStore.cacheOperate({ mode: "add", name });
      }
    }
  });

  // 持久化恢复后的缓存列表
  setCachedPageList(permissionStore.cachePageList);
}

/**
 * 同步缓存列表到持久化存储
 *
 * @description 当 cachePageList 变化时，同步到 localStorage
 */
export function syncCacheToStorage(): void {
  if (!getMultiTagsCacheEnabled()) {
    return;
  }
  const permissionStore = usePermissionStoreHook();
  setCachedPageList(permissionStore.cachePageList);
}

/**
 * 处理持久化开关变化
 *
 * @param enabled 是否开启持久化
 */
export function handleCacheSettingChange(enabled: boolean): void {
  if (enabled) {
    // 开启持久化：保存当前缓存列表
    syncCacheToStorage();
  } else {
    // 关闭持久化：清除存储的缓存列表
    clearCachedPageList();
  }
}

/**
 * KeepAlive 缓存管理 Composable
 *
 * @description 提供缓存管理的响应式 API
 *
 * @example
 * ```ts
 * import { useKeepAliveCache } from '@/composables/useKeepAliveCache';
 *
 * // 在路由守卫中使用
 * const { restoreCache, syncCache } = useKeepAliveCache();
 *
 * // 页面刷新时恢复缓存
 * restoreCache();
 * ```
 */
export function useKeepAliveCache() {
  const permissionStore = usePermissionStoreHook();
  const multiTagsStore = useMultiTagsStoreHook();

  /**
   * 监听 multiTags 变化，同步清理缓存
   *
   * @description 当标签页被关闭时，同步清理对应的缓存
   */
  const watchTagsChange = () => {
    watch(
      () => multiTagsStore.multiTags,
      () => {
        // 清理不在标签页中的缓存
        permissionStore.clearCache();
        // 同步到持久化存储
        syncCacheToStorage();
      },
      { deep: true }
    );
  };

  /**
   * 监听持久化配置变化
   */
  const watchCacheSettingChange = () => {
    watch(
      () => multiTagsStore.multiTagsCache,
      enabled => {
        handleCacheSettingChange(enabled ?? false);
      }
    );
  };

  return {
    /**
     * 恢复缓存列表
     */
    restoreCache: restoreCacheFromTags,

    /**
     * 同步缓存到存储
     */
    syncCache: syncCacheToStorage,

    /**
     * 清除缓存存储
     */
    clearCache: clearCachedPageList,

    /**
     * 获取持久化状态
     */
    isEnabled: getMultiTagsCacheEnabled,

    /**
     * 初始化监听器
     */
    initWatchers: () => {
      watchTagsChange();
      watchCacheSettingChange();
    }
  };
}

export default useKeepAliveCache;
