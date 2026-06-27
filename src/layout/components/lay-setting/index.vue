<script setup lang="ts">
import {
  ref,
  unref,
  watch,
  reactive,
  computed,
  nextTick,
  onUnmounted,
  onBeforeMount
} from "vue";
import { useI18n } from "vue-i18n";
import { emitter } from "@/utils/mitt";
import LayPanel from "../lay-panel/index.vue";
import { useNav } from "@/layout/hooks/useNav";
import { useAppStoreHook } from "@/store/modules/app";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { ReSegmented } from "@/components/ReSegmented";
import type { OptionsType } from "@/components/ReSegmented";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import { useGlobal, storageLocal } from "@/utils/global";
import { responsiveStorageNameSpace } from "@/config";
import { debounce, isNumber } from "lodash-es";

// Element Plus Icons
import {
  Check,
  ArrowLeft as LeftArrow,
  ArrowRight as RightArrow
} from "@element-plus/icons-vue";
import DayIcon from "@/assets/svg/day.svg?component";
import DarkIcon from "@/assets/svg/dark.svg?component";
import SystemIcon from "@/assets/svg/system.svg?component";

const { t } = useI18n();
const { device } = useNav();

const { $storage } = useGlobal<GlobalPropertiesApi>();

const verticalRef = ref();

const {
  dataTheme,
  overallStyle,
  layoutTheme,
  themeColors,
  toggleClass,
  dataThemeChange,
  setLayoutThemeColor,
  watchSystemThemeChange
} = useDataThemeChange();

/* body添加layout属性，作用于src/style/sidebar.scss */
if (unref(layoutTheme)) {
  const layout = unref(layoutTheme).layout ?? "vertical";
  const theme = unref(layoutTheme).theme ?? "light";
  document.documentElement.setAttribute("data-theme", theme);
  setLayoutModel(layout);
}

/** 默认灵动模式 */
const markValue = ref($storage.configure?.showModel ?? "smart");

const logoVal = ref($storage.configure?.showLogo ?? true);

const settings = reactive({
  greyVal: $storage.configure.grey,
  weakVal: $storage.configure.weak,
  tabsVal: $storage.configure.hideTabs,
  showLogo: $storage.configure.showLogo,
  showModel: $storage.configure.showModel,
  hideFooter: $storage.configure.hideFooter,
  multiTagsCache: $storage.configure.multiTagsCache,
  stretch: $storage.configure.stretch
});

const getThemeColorStyle = computed(() => {
  return (color: string) => {
    return { background: color };
  };
});

/** 当网页整体为暗色风格时不显示亮白色主题配色切换选项 */
const showThemeColors = computed(() => {
  return (themeColor: string) => {
    return themeColor === "light" && dataTheme.value ? false : true;
  };
});

function storageConfigureChange<T>(key: keyof StorageConfigs, val: T): void {
  const storageConfigure = $storage.configure;
  (storageConfigure as Record<string, T>)[key] = val;
  $storage.configure = storageConfigure;
}

/** 灰色模式设置 */
const greyChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html") ?? undefined;
  toggleClass(settings.greyVal ?? false, "html-grey", htmlEl);
  storageConfigureChange("grey", value);
};

/** 色弱模式设置 */
const weekChange = (value: boolean): void => {
  const htmlEl = document.querySelector("html") ?? undefined;
  toggleClass(settings.weakVal ?? false, "html-weakness", htmlEl);
  storageConfigureChange("weak", value);
};

/** 隐藏标签页设置 */
const tagsChange = () => {
  const showVal = settings.tabsVal;
  storageConfigureChange("hideTabs", showVal);
  emitter.emit("tagViewsChange", showVal as unknown as string);
};

/** 隐藏页脚设置 */
const hideFooterChange = () => {
  const hideFooter = settings.hideFooter;
  storageConfigureChange("hideFooter", hideFooter);
};

/** 标签页持久化设置 */
const multiTagsCacheChange = () => {
  const multiTagsCache = settings.multiTagsCache ?? false;
  storageConfigureChange("multiTagsCache", multiTagsCache);
  useMultiTagsStoreHook().multiTagsCacheChange(multiTagsCache);
};

function onChange({ option }: { option: OptionsType }) {
  const { value } = option;
  const strValue = String(value ?? "");
  markValue.value = strValue;
  storageConfigureChange("showModel", strValue);
  emitter.emit("tagViewsShowModel", strValue);
}

/** 侧边栏Logo */
function logoChange() {
  if (unref(logoVal)) {
    storageConfigureChange("showLogo", true);
  } else {
    storageConfigureChange("showLogo", false);
  }
  emitter.emit("logoChange", unref(logoVal));
}

/** 页宽 */
const stretchTypeOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: t("panel.pureStretchFixed"),
      tip: t("panel.pureStretchFixedTip"),
      value: "fixed"
    },
    {
      label: t("panel.pureStretchCustom"),
      tip: t("panel.pureStretchCustomTip"),
      value: "custom"
    }
  ];
});

const setStretch = (value: number | false) => {
  settings.stretch = value;
  storageConfigureChange("stretch", value);
};

const stretchTypeChange = ({ option }: { option: OptionsType }) => {
  const { value } = option;
  if (value === "custom") {
    setStretch(1440);
  } else {
    setStretch(false);
  }
};

/** 主题色 激活选择项 */
const getThemeColor = computed(() => {
  return (current: string) => {
    if (
      current === layoutTheme.value.theme &&
      layoutTheme.value.theme !== "light"
    ) {
      return "#fff";
    } else if (
      current === layoutTheme.value.theme &&
      layoutTheme.value.theme === "light"
    ) {
      return "#1d2b45";
    } else {
      return "transparent";
    }
  };
});

const pClass = computed(() => {
  return ["mb-[12px]!", "font-medium", "text-sm", "dark:text-white"];
});

const themeOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: t("panel.pureOverallStyleLight"),
      icon: DayIcon,
      theme: "light",
      tip: t("panel.pureOverallStyleLightTip"),
      iconAttrs: { fill: dataTheme.value ? "#fff" : "#000" }
    },
    {
      label: t("panel.pureOverallStyleDark"),
      icon: DarkIcon,
      theme: "dark",
      tip: t("panel.pureOverallStyleDarkTip"),
      iconAttrs: { fill: dataTheme.value ? "#fff" : "#000" }
    },
    {
      label: t("panel.pureOverallStyleSystem"),
      icon: SystemIcon,
      theme: "system",
      tip: t("panel.pureOverallStyleSystemTip"),
      iconAttrs: { fill: dataTheme.value ? "#fff" : "#000" }
    }
  ];
});

const markOptions = computed<Array<OptionsType>>(() => {
  return [
    {
      label: t("panel.pureTagsStyleSmart"),
      tip: t("panel.pureTagsStyleSmartTip"),
      value: "smart"
    },
    {
      label: t("panel.pureTagsStyleCard"),
      tip: t("panel.pureTagsStyleCardTip"),
      value: "card"
    },
    {
      label: t("panel.pureTagsStyleChrome"),
      tip: t("panel.pureTagsStyleChromeTip"),
      value: "chrome"
    }
  ];
});

/** 设置导航模式 */
function setLayoutModel(layout: string) {
  layoutTheme.value.layout = layout;
  window.document.body.setAttribute("layout", layout);
  const newLayout = {
    layout,
    theme: layoutTheme.value.theme,
    darkMode: $storage.layout?.darkMode,
    sidebarStatus: $storage.layout?.sidebarStatus,
    epThemeColor: $storage.layout?.epThemeColor,
    themeColor: $storage.layout?.themeColor,
    overallStyle: $storage.layout?.overallStyle
  };
  $storage.layout = newLayout;
  // 显式写入 localStorage 确保布局配置持久化
  storageLocal().setItem(`${responsiveStorageNameSpace()}layout`, newLayout);
  useAppStoreHook().setLayout(layout);
}

watch($storage, ({ layout }) => {
  if (layout["layout"] === "vertical") {
    toggleClass(true, "is-select", unref(verticalRef));
  }
});

onBeforeMount(() => {
  /* 初始化系统配置 */
  nextTick(() => {
    watchSystemThemeChange();
    if (settings.greyVal) {
      document.querySelector("html")?.classList.add("html-grey");
    }
    if (settings.weakVal) {
      document.querySelector("html")?.classList.add("html-weakness");
    }
    if (settings.tabsVal) {
      tagsChange();
    }
    if (settings.hideFooter) {
      hideFooterChange();
    }
  });
});
</script>

<template>
  <LayPanel>
    <div class="p-5">
      <p :class="pClass">{{ t("panel.pureOverallStyle") }}</p>
      <ReSegmented
        resize
        class="select-none"
        :modelValue="overallStyle === 'system' ? 2 : dataTheme ? 1 : 0"
        :options="themeOptions"
        @change="
          theme => {
            theme.index === 1 && theme.index !== 2
              ? (dataTheme = true)
              : (dataTheme = false);
            overallStyle = theme.option.theme;
            dataThemeChange(theme.option.theme);
            theme.index === 2 && watchSystemThemeChange();
          }
        "
      />

      <p :class="['mt-5!', pClass]">{{ t("panel.pureThemeColor") }}</p>
      <ul class="theme-color">
        <li
          v-for="(item, index) in themeColors"
          v-show="showThemeColors(item.themeColor)"
          :key="index"
          :style="getThemeColorStyle(item.color)"
          @click="setLayoutThemeColor(item.themeColor)"
        >
          <el-icon
            style="margin: 0.1em 0.1em 0 0"
            :size="17"
            :color="getThemeColor(item.themeColor)"
          >
            <IconifyIconOffline :icon="Check" />
          </el-icon>
        </li>
      </ul>

      <!-- 页签风格配置 - 已隐藏 -->
      <!-- <p :class="['mt-4!', pClass]">{{ t("panel.pureTagsStyle") }}</p>
      <ReSegmented
        resize
        class="select-none"
        :modelValue="markValue === 'smart' ? 0 : markValue === 'card' ? 1 : 2"
        :options="markOptions"
        @change="onChange"
      /> -->

      <!-- 界面显示配置 - 已隐藏 -->
      <!-- <p class="mt-5! font-medium text-sm dark:text-white">
        {{ t("panel.pureInterfaceDisplay") }}
      </p>
      <ul class="setting">
        <li>
          <span class="dark:text-white">{{ t("panel.pureGreyModel") }}</span>
          <el-switch
            v-model="settings.greyVal"
            inline-prompt
            :active-text="t('buttons.pureOpenText')"
            :inactive-text="t('buttons.pureCloseText')"
            @change="greyChange"
          />
        </li>
        <li>
          <span class="dark:text-white">
            {{ t("panel.pureMultiTagsCache") }}
          </span>
          <el-switch
            v-model="settings.multiTagsCache"
            inline-prompt
            :active-text="t('buttons.pureOpenText')"
            :inactive-text="t('buttons.pureCloseText')"
            @change="multiTagsCacheChange"
          />
        </li>
      </ul> -->
    </div>
  </LayPanel>
</template>

<style lang="scss" scoped>
:deep(.el-divider__text) {
  font-size: 16px;
  font-weight: 700;
}

:deep(.el-switch__core) {
  --el-switch-off-color: var(--pure-switch-off-color);

  min-width: 36px;
  height: 18px;
}

:deep(.el-switch__core .el-switch__action) {
  height: 14px;
}

.theme-color {
  height: 20px;

  li {
    float: left;
    height: 20px;
    margin-right: 8px;
    cursor: pointer;
    border-radius: 4px;

    &:nth-child(1) {
      border: 1px solid #ddd;
    }
  }
}

.pure-theme {
  display: flex;
  gap: 12px;

  li {
    position: relative;
    width: 46px;
    height: 36px;
    overflow: hidden;
    cursor: pointer;
    background: #f0f2f5;
    border-radius: 4px;
    box-shadow: 0 1px 2.5px 0 rgb(0 0 0 / 18%);

    &:nth-child(1) {
      div {
        &:nth-child(1) {
          width: 30%;
          height: 100%;
          background: #1b2a47;
        }

        &:nth-child(2) {
          position: absolute;
          top: 0;
          right: 0;
          width: 70%;
          height: 30%;
          background: #fff;
          box-shadow: 0 0 1px #888;
        }
      }
    }

    &:nth-child(2) {
      div {
        &:nth-child(1) {
          width: 100%;
          height: 30%;
          background: #1b2a47;
          box-shadow: 0 0 1px #888;
        }
      }
    }

    &:nth-child(3) {
      div {
        &:nth-child(1) {
          width: 100%;
          height: 30%;
          background: #1b2a47;
          box-shadow: 0 0 1px #888;
        }

        &:nth-child(2) {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30%;
          height: 70%;
          background: #fff;
          box-shadow: 0 0 1px #888;
        }
      }
    }
  }
}

.is-select {
  border: 2px solid var(--el-color-primary);
}

.setting {
  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 14px;
  }
}
</style>
