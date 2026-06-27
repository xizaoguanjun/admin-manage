import { defineStore } from "pinia";
import { type setType, store, getConfig } from "../utils";

export const useSettingStore = defineStore("pure-setting", {
  state: (): setType => ({
    title: getConfig().Title ?? "",
    fixedHeader: getConfig().FixedHeader ?? true,
    hiddenSideBar: getConfig().HiddenSideBar ?? false,
    showPageSearch: true // 全局控制页面搜索表单显示/隐藏
  }),
  getters: {
    getTitle(state) {
      return state.title;
    },
    getFixedHeader(state) {
      return state.fixedHeader;
    },
    getHiddenSideBar(state) {
      return state.hiddenSideBar;
    },
    getShowPageSearch(state) {
      return state.showPageSearch;
    }
  },
  actions: {
    CHANGE_SETTING({ key, value }: { key: keyof setType; value: unknown }) {
      if (Reflect.has(this, key)) {
        (this as Record<keyof setType, unknown>)[key] = value;
      }
    },
    changeSetting(data: { key: keyof setType; value: unknown }) {
      this.CHANGE_SETTING(data);
    },
    // 切换页面搜索表单显示/隐藏
    togglePageSearch() {
      this.showPageSearch = !this.showPageSearch;
    },
    // 设置页面搜索表单显示/隐藏
    setPageSearch(show: boolean) {
      this.showPageSearch = show;
    }
  }
});

export function useSettingStoreHook() {
  return useSettingStore(store);
}
