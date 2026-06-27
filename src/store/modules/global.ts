/**
 * 全局配置 Store
 * 管理全局配置和响应式存储
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { responsiveStorageNameSpace } from "@/config";
import { routerArrays } from "@/layout/types";
import Storage from "responsive-storage";

export const useGlobalStore = defineStore("pure-global", () => {
  const nameSpace = responsiveStorageNameSpace();

  // 平台配置（从 platform-config.json 读取）
  const config = ref<PlatformConfigs>({} as PlatformConfigs);

  // 响应式存储对象
  const storage = ref<ResponsiveStorage>({
    locale: { locale: "zh" },
    layout: {
      layout: "vertical",
      theme: "light",
      darkMode: false,
      sidebarStatus: true,
      epThemeColor: "#409EFF",
      themeColor: "light",
      overallStyle: "light"
    },
    configure: {
      grey: false,
      weak: false,
      hideTabs: false,
      hideFooter: true,
      showLogo: true,
      showModel: "smart",
      multiTagsCache: true,
      stretch: false
    },
    tags: []
  });

  /**
   * 初始化配置
   */
  function initConfig(platformConfig: PlatformConfigs) {
    config.value = platformConfig;

    // 初始化存储，优先使用 localStorage 中的值
    const locale = Storage.getData("locale", nameSpace) ?? {
      locale: platformConfig.Locale ?? "zh"
    };

    const layout = Storage.getData("layout", nameSpace) ?? {
      layout: platformConfig.Layout ?? "vertical",
      theme: platformConfig.Theme ?? "light",
      darkMode: platformConfig.DarkMode ?? false,
      sidebarStatus: platformConfig.SidebarStatus ?? true,
      epThemeColor: platformConfig.EpThemeColor ?? "#409EFF",
      themeColor: platformConfig.Theme ?? "light",
      overallStyle: platformConfig.OverallStyle ?? "light"
    };

    const configure = Storage.getData("configure", nameSpace) ?? {
      grey: platformConfig.Grey ?? false,
      weak: platformConfig.Weak ?? false,
      hideTabs: platformConfig.HideTabs ?? false,
      hideFooter: platformConfig.HideFooter ?? true,
      showLogo: platformConfig.ShowLogo ?? true,
      showModel: platformConfig.ShowModel ?? "smart",
      multiTagsCache: platformConfig.MultiTagsCache ?? true,
      stretch: platformConfig.Stretch ?? false
    };

    const tags = platformConfig.MultiTagsCache
      ? (Storage.getData("tags", nameSpace) ?? routerArrays)
      : [];

    storage.value = {
      locale,
      layout,
      configure,
      tags
    };
  }

  /**
   * 更新存储数据并同步到 localStorage
   */
  function updateStorage<K extends keyof ResponsiveStorage>(
    key: K,
    value: ResponsiveStorage[K]
  ) {
    (storage.value as ResponsiveStorage)[key] = value;
    Storage.set(`${nameSpace}${key}`, JSON.stringify(value));
  }

  /**
   * 获取存储数据
   */
  function getStorage<T = unknown>(key: string): T | null {
    return Storage.getData(key, nameSpace);
  }

  /**
   * 设置存储数据
   */
  function setStorage(key: string, value: unknown) {
    Storage.set(`${nameSpace}${key}`, JSON.stringify(value));
  }

  /**
   * 清空所有存储
   */
  function clearStorage() {
    if (nameSpace) {
      Storage.clearAll(nameSpace, storage.value);
    }
  }

  return {
    config: computed(() => config.value),
    storage: computed(() => storage.value),
    initConfig,
    updateStorage,
    getStorage,
    setStorage,
    clearStorage
  };
});

/**
 * 在 setup 外使用
 */
export function useGlobalStoreHook() {
  return useGlobalStore();
}
