<script setup lang="ts">
import "animate.css";
// Element Plus Icons 已在 offlineIcon.ts 中统一管理，无需额外导入
import { setType } from "./types";
import { useI18n } from "vue-i18n";
import { useLayout } from "./hooks/useLayout";
import { useAppStoreHook } from "@/store/modules/app";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import {
  h,
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeMount,
  defineComponent
} from "vue";
import { useDark, useResizeObserver } from "@vueuse/core";
import { useGlobal } from "@/utils/global";
import { deviceDetection } from "jinbi-utils";

import LayNavbar from "./components/lay-navbar/index.vue";
import LayActions from "./components/lay-actions/index.vue";
import LayContent from "./components/lay-content/index.vue";
import LaySetting from "./components/lay-setting/index.vue";
import NavVertical from "./components/lay-sidebar/NavVertical.vue";
import LayTag from "./components/lay-tag/index.vue";
import BackTopIcon from "@/assets/svg/back_top.svg?component";

const { t } = useI18n();
const appWrapperRef = ref();
const isDark = useDark();
const { layout } = useLayout();
const isMobile = deviceDetection();
const pureSetting = useSettingStoreHook();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const set: setType = reactive({
  sidebar: computed(() => {
    return useAppStoreHook().sidebar;
  }),

  device: computed(() => {
    return useAppStoreHook().device;
  }),

  fixedHeader: computed(() => {
    return pureSetting.fixedHeader;
  }),

  classes: computed(() => {
    return {
      hideSidebar: !set.sidebar.opened,
      openSidebar: set.sidebar.opened,
      withoutAnimation: set.sidebar.withoutAnimation,
      mobile: set.device === "mobile"
    };
  }),

  hideTabs: computed(() => {
    return $storage?.configure.hideTabs ?? false;
  })
});

function toggle(device: string, bool: boolean) {
  useAppStoreHook().toggleDevice(device);
  useAppStoreHook().toggleSideBar(bool, "resize");
}

// 判断是否可自动关闭菜单栏
let isAutoCloseSidebar = true;

useResizeObserver(appWrapperRef, entries => {
  if (isMobile) return;
  const entry = entries[0];
  const [{ inlineSize: width, blockSize: height }] = entry.borderBoxSize;
  useAppStoreHook().setViewportSize({ width, height });
  /** width app-wrapper类容器宽度
   * 0 < width <= 760 隐藏侧边栏
   * 760 < width <= 990 折叠侧边栏
   * width > 990 展开侧边栏
   */
  if (width > 0 && width <= 760) {
    toggle("mobile", false);
    isAutoCloseSidebar = true;
  } else if (width > 760 && width <= 990) {
    if (isAutoCloseSidebar) {
      toggle("desktop", false);
      isAutoCloseSidebar = false;
    }
  } else if (width > 990 && !set.sidebar.isClickCollapse) {
    toggle("desktop", true);
    isAutoCloseSidebar = true;
  } else {
    toggle("desktop", false);
    isAutoCloseSidebar = false;
  }
});

onMounted(() => {
  if (isMobile) {
    toggle("mobile", false);
  }
});

onBeforeMount(() => {
  const { dataThemeChange, watchSystemThemeChange } = useDataThemeChange();

  dataThemeChange();
  watchSystemThemeChange();
});

const LayHeader = defineComponent({
  name: "LayHeader",
  render() {
    return h(
      "div",
      {
        class: { "fixed-header": set.fixedHeader }
      },
      {
        default: () => [
          !pureSetting.hiddenSideBar ? h(LayNavbar) : null,
          h(LayActions)
        ]
      }
    );
  }
});
</script>

<template>
  <div ref="appWrapperRef" :class="['app-wrapper', set.classes]">
    <div
      v-show="set.device === 'mobile' && set.sidebar.opened"
      class="app-mask"
      @click="useAppStoreHook().toggleSideBar()"
    />
    <NavVertical v-show="!pureSetting.hiddenSideBar" />
    <div
      :class="[
        'main-container',
        pureSetting.hiddenSideBar ? 'main-hidden' : ''
      ]"
    >
      <div v-if="set.fixedHeader">
        <LayHeader />
        <!-- 主体内容 -->
        <LayContent :fixed-header="set.fixedHeader" />
      </div>
      <el-scrollbar v-else>
        <el-backtop
          :title="t('buttons.pureBackTop')"
          target=".main-container .el-scrollbar__wrap"
        >
          <BackTopIcon />
        </el-backtop>
        <LayHeader />
        <!-- 主体内容 -->
        <LayContent :fixed-header="set.fixedHeader" />
      </el-scrollbar>
    </div>
    <!-- 系统设置 -->
    <LaySetting />
  </div>
</template>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  width: 100%;
  height: 100%;

  /* 使用伪元素实现背景的透明度，避免影响子元素 */
  &::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    content: "";
    background: linear-gradient(
      0deg,
      color-mix(
          in srgb,
          var(--pure-bg-gradient-start),
          transparent calc((1 - var(--pure-bg-gradient-opacity)) * 100%)
        )
        0%,
      color-mix(
          in srgb,
          var(--pure-bg-gradient-end),
          transparent calc((1 - var(--pure-bg-gradient-opacity)) * 100%)
        )
        100%
    );
  }

  &::after {
    clear: both;
    display: table;
    content: "";
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }

  /* 确保子元素在渐变背景之上 */
  & > * {
    position: relative;
    z-index: 1;
  }
}

.app-mask {
  position: absolute;
  top: 0;
  z-index: 2001;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.3;
}

.re-screen {
  margin-top: 12px;
}
</style>
