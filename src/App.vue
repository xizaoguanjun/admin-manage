<template>
  <el-config-provider :locale="currentLocale">
    <YcConfigProvider :config="ycConfig">
      <router-view />
      <ReDrawer />
    </YcConfigProvider>
  </el-config-provider>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  watch,
  nextTick
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { checkVersion } from "version-rocket";
import { ElConfigProvider } from "element-plus";
// 从 yc-components 导入
import { YcConfigProvider, ReDrawer } from "yc-pro-components";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
// 使用 yc-pro-components 的 locale（与 plus 保持兼容）
import plusEn from "yc-pro-components/es/locale/lang/en";
import plusZhCn from "yc-pro-components/es/locale/lang/zh-cn";
import { providePlusProConfig } from "@/composables/usePlusProConfig";
import { userKey } from "@/utils/auth";
import { storageLocal } from "@/utils/global";
// 权限函数
import { hasAuth } from "@/router/utils";
import { hasPerms } from "@/utils/auth";
// Store
import { useSettingStoreHook } from "@/store/modules/settings";
import type { DataInfo } from "@/utils/auth";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { getTopMenu } from "@/router/utils";
import { routerArrays } from "@/layout/types";

export default defineComponent({
  name: "app",
  components: {
    ElConfigProvider,
    YcConfigProvider,
    ReDrawer
  },
  setup() {
    // 提供 Plus Pro Components 全局配置
    providePlusProConfig();

    // 获取 settings store
    const settingStore = useSettingStoreHook();

    // 获取路由和应用实例
    const route = useRoute();
    const router = useRouter();
    const currentAppIdRef = ref<number | string | null>(null);
    const multiTagsStore = useMultiTagsStoreHook();

    // 切换应用时清空标签并返回首页
    const resetTagsAndGoHome = () => {
      multiTagsStore.handleTags("equal", routerArrays);
      const homePath =
        getTopMenu()?.path ?? routerArrays[0]?.path ?? "/welcome";
      router.push(homePath);
    };

    // 通知父应用路由元信息的辅助函数
    // 使用 window.__PARENT_SET_GLOBAL_STATE__ 代替 props.setGlobalState
    // 因为 vite-plugin-qiankun 会将 qiankun 内部的 setGlobalState 注入到 props 中
    const notifyParentRouteMeta = () => {
      // 尝试使用父应用挂载到 window 上的 setGlobalState
      const setGlobalState = (window as any).__PARENT_SET_GLOBAL_STATE__;
      if (setGlobalState) {
        const meta = route.meta;
        setGlobalState({
          hideLayActions: meta.hideLayActions === true,
          hideDefaultFilter: meta.hideDefaultFilter === true
        });
        return true;
      }
      return false;
    };

    // 监听路由变化，将子应用的 hideLayActions/hideDefaultFilter 配置传递给父应用
    // 不使用 immediate，改为在 onMounted 中手动调用以确保 $setGlobalState 已注入
    watch(
      () => route.meta,
      () => {
        notifyParentRouteMeta();
      }
    );

    // 在组件挂载后延迟调用，确保 $setGlobalState 已经被注入
    onMounted(() => {
      // 使用 nextTick + setTimeout 确保父应用的 props 已经注入
      nextTick(() => {
        if (!notifyParentRouteMeta()) {
          // 如果首次失败，延迟重试
          setTimeout(() => {
            notifyParentRouteMeta();
          }, 100);
        }
      });
    });

    // 组件卸载时，重置父应用的状态
    onUnmounted(() => {
      const setGlobalState = (window as any).__PARENT_SET_GLOBAL_STATE__;
      if (setGlobalState) {
        setGlobalState({
          hideLayActions: false,
          hideDefaultFilter: false
        });
      }
    });

    // 监听主应用 showPageSearch 同步到子应用
    const syncShowPageSearch = (val: boolean) => {
      if (settingStore.showPageSearch !== val) {
        settingStore.setPageSearch(val);
      }
    };

    onMounted(() => {
      const onGlobalStateChange =
        (window as any).$onGlobalStateChange ||
        (window as any).__PARENT_ON_GLOBAL_STATE_CHANGE__;
      const getGlobalState =
        (window as any).$getGlobalState ||
        (window as any).__PARENT_GET_GLOBAL_STATE__;

      // 首次拉取
      if (getGlobalState) {
        const state = getGlobalState();
        if (state && typeof state.showPageSearch === "boolean") {
          syncShowPageSearch(state.showPageSearch);
        }
        if (state && state.currentAppId !== undefined) {
          currentAppIdRef.value = state.currentAppId as number | string | null;
        }
      }

      // 订阅变化
      if (onGlobalStateChange) {
        onGlobalStateChange((state: Record<string, unknown>) => {
          if (typeof state.showPageSearch === "boolean") {
            syncShowPageSearch(state.showPageSearch);
          }
          if (
            state.currentAppId !== undefined &&
            state.currentAppId !== currentAppIdRef.value
          ) {
            currentAppIdRef.value = state.currentAppId as
              | number
              | string
              | null;
            resetTagsAndGoHome();
          }
        });
      }
    });

    // Yc 组件库全局配置
    const ycConfig = {
      // 权限检查函数（YcAuth 使用）
      hasAuth,
      // 操作权限检查函数（YcPerms 使用）
      hasPerms,
      // 页面搜索栏显示状态（响应式，用于 YcPlusPage、YcTabsWithFilter）
      showPageSearch: toRef(settingStore, "showPageSearch"),
      // CDN 配置
      cdn: {
        base: "https://staticcdn.jinbizhihui.com",
        images: "https://staticcdn.jinbizhihui.com/images/data-center-admin",
        fonts: "https://staticcdn.jinbizhihui.com/fonts",
        icons: "https://staticcdn.jinbizhihui.com/icons"
      }
    };

    return {
      ycConfig
    };
  },
  computed: {
    currentLocale() {
      return this.$storage.locale?.locale === "zh"
        ? { ...zhCn, ...plusZhCn }
        : { ...en, ...plusEn };
    }
  },
  beforeCreate() {
    const { version, name: title } = __APP_INFO__.pkg;
    const { VITE_PUBLIC_PATH, MODE } = import.meta.env;
    // https://github.com/guMcrey/version-rocket/blob/main/README.zh-CN.md#api
    if (MODE === "production") {
      // 版本实时更新检测，只作用于线上环境
      checkVersion(
        // config
        {
          // 5分钟检测一次版本
          pollingTime: 300000,
          localPackageVersion: version,
          originVersionFileUrl: `${location.origin}${VITE_PUBLIC_PATH}version.json`
        },
        // options
        {
          title,
          description: "检测到新版本",
          buttonText: "立即更新"
        }
      );
    }
  }
});
</script>
