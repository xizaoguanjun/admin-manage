import { defineStore } from "pinia";
import {
  type multiType,
  type positionType,
  store,
  isUrl,
  isEqual,
  isNumber,
  isBoolean,
  getConfig,
  routerArrays,
  storageLocal,
  responsiveStorageNameSpace
} from "../utils";
import { usePermissionStoreHook } from "./permission";
import { handleCacheSettingChange } from "@/composables/useKeepAliveCache";

export const useMultiTagsStore = defineStore("pure-multiTags", {
  state: () => ({
    // 存储标签页信息（路由信息）
    multiTags: (storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.multiTagsCache
      ? (storageLocal().getItem<multiType[]>(
          `${responsiveStorageNameSpace()}tags`
        ) ?? [])
      : [
          ...routerArrays,
          ...usePermissionStoreHook().flatteningRoutes.filter(
            v => v?.meta?.fixedTag
          )
        ]) as multiType[],
    multiTagsCache: storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.multiTagsCache
  }),
  getters: {
    getMultiTagsCache(state) {
      return state.multiTagsCache;
    }
  },
  actions: {
    multiTagsCacheChange(multiTagsCache: boolean) {
      this.multiTagsCache = multiTagsCache;
      if (multiTagsCache) {
        storageLocal().setItem(
          `${responsiveStorageNameSpace()}tags`,
          this.multiTags
        );
      } else {
        storageLocal().removeItem(`${responsiveStorageNameSpace()}tags`);
      }
      // 联动处理 KeepAlive 缓存持久化
      handleCacheSettingChange(multiTagsCache);
    },
    tagsCache(multiTags: multiType[]) {
      this.getMultiTagsCache &&
        storageLocal().setItem(
          `${responsiveStorageNameSpace()}tags`,
          multiTags
        );
    },
    handleTags<T>(
      mode: string,
      value?: T | multiType,
      position?: positionType
    ): T | multiType[] | void {
      // 确保 multiTags 是数组
      const tags = this.multiTags as multiType[];
      switch (mode) {
        case "equal":
          this.multiTags = (value ?? []) as multiType[];
          this.tagsCache(this.multiTags);
          break;
        case "push":
          {
            const tagVal = value as multiType;
            // 不添加到标签页
            if (tagVal?.meta?.hiddenTag) return;
            // 如果是外链无需添加信息到标签页
            if (isUrl(tagVal?.name)) return;
            // 如果title为空拒绝添加空信息到标签页
            const title = tagVal?.meta?.title;
            if (typeof title === "string" && title.length === 0) return;
            // showLink:false 不添加到标签页
            if (isBoolean(tagVal?.meta?.showLink) && !tagVal?.meta?.showLink)
              return;
            const tagPath = tagVal.path;
            // 判断tag是否已存在
            const tagHasExits = tags.some((tag: multiType) => {
              return tag.path === tagPath;
            });

            // 判断tag中的query键值是否相等
            const tagQueryHasExits = tags.some((tag: multiType) => {
              return isEqual(tag?.query, tagVal?.query);
            });

            // 判断tag中的params键值是否相等
            const tagParamsHasExits = tags.some((tag: multiType) => {
              return isEqual(tag?.params, tagVal?.params);
            });

            if (tagHasExits && tagQueryHasExits && tagParamsHasExits) return;

            // 动态路由可打开的最大数量
            const dynamicLevel = tagVal?.meta?.dynamicLevel ?? -1;
            if (typeof dynamicLevel === "number" && dynamicLevel > 0) {
              if (
                tags.filter((e: multiType) => e?.path === tagPath).length >=
                dynamicLevel
              ) {
                // 如果当前已打开的动态路由数大于dynamicLevel，替换第一个动态路由标签
                const index = tags.findIndex(
                  (item: multiType) => item?.path === tagPath
                );
                index !== -1 && tags.splice(index, 1);
              }
            }
            tags.push(tagVal);
            this.tagsCache(tags);
            const maxTagsLevel = getConfig()?.MaxTagsLevel;
            if (maxTagsLevel && isNumber(maxTagsLevel)) {
              if (tags.length > maxTagsLevel) {
                tags.splice(1, 1);
              }
            }
          }
          break;
        case "splice":
          if (!position) {
            const index = tags.findIndex(
              (v: multiType) => v.path === (value as string)
            );
            if (index === -1) return;
            tags.splice(index, 1);
          } else {
            const startIdx = position.startIndex ?? 0;
            const len = position.length ?? 1;
            tags.splice(startIdx, len);
          }
          this.tagsCache(tags);
          return tags;
        case "slice":
          return tags.slice(-1);
      }
    }
  }
});

export function useMultiTagsStoreHook() {
  return useMultiTagsStore(store);
}
