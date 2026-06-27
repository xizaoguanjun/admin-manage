import { ref } from "vue";
import { getConfig, responsiveStorageNameSpace } from "@/config";
import { useLayout } from "./useLayout";
import { removeToken } from "@/utils/auth";
import { routerArrays } from "@/layout/types";
import { router, resetRouter } from "@/router";
import type { themeColorsType } from "../types";
import { useAppStoreHook } from "@/store/modules/app";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { darken, lighten } from "jinbi-utils";
import { useGlobal, storageLocal } from "@/utils/global";

/* Singleton State */
const dataTheme = ref<boolean>(false);
const overallStyle = ref<string>("system");
const themeColors = ref<Array<themeColorsType>>([
  /* 亮白色 */
  { color: "#ffffff", themeColor: "light" },
  /* 道奇蓝 */
  { color: "#1b2a47", themeColor: "default" },
  /* 深紫罗兰色 */
  { color: "#7b52fe", themeColor: "saucePurple" },
  /* 深粉色 */
  { color: "#eb2f96", themeColor: "pink" },
  /* 猩红色 */
  { color: "#f5222d", themeColor: "dusk" },
  /* 橙红色 */
  { color: "#fa541c", themeColor: "volcano" },
  /* 绿宝石 */
  { color: "#13c2c2", themeColor: "mingQing" },
  /* 酸橙绿 */
  { color: "#52c41a", themeColor: "auroraGreen" }
]);

/**
 * 按主题色分类的 CSS 变量覆盖配置
 * 这些变量不会随主题色动态计算，而是根据主题使用预设的固定值
 * 用于确保某些 UI 元素的背景色、边框色等在特定主题下保持一致
 *
 * 键为主题色名称（对应 themeColors 中的 themeColor）
 * 值为该主题下需要覆盖的 CSS 变量
 */
const THEME_FIXED_VARS: Record<string, Record<string, string>> = {
  // 深紫罗兰色主题
  saucePurple: {
    "--el-color-primary-light-9": "#f7f7ff"
  },
  // 其他主题可在此添加，例如：
  // pink: {
  //   "--el-color-primary-light-9": "#fff0f6"
  // },
  // 默认配置（用于没有特定配置的主题）
  _default: {}
};

/**
 * 获取当前主题的固定变量配置
 * @param themeColor 当前主题色名称
 * @returns 需要覆盖的 CSS 变量配置
 */
const getFixedVarsForTheme = (themeColor: string): Record<string, string> => {
  return THEME_FIXED_VARS[themeColor] || THEME_FIXED_VARS._default || {};
};

const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
let initialized = false;

export function useDataThemeChange() {
  const { layoutTheme, layout } = useLayout();
  const { $storage } = useGlobal<GlobalPropertiesApi>();

  // 懒加载初始化，仅执行一次
  if (!initialized) {
    // 直接从 localStorage 读取，确保在 Pinia store 初始化之前也能获取到正确的值
    const storedLayout = storageLocal().getItem<ResponsiveStorage["layout"]>(
      `${responsiveStorageNameSpace()}layout`
    );
    if (storedLayout?.overallStyle) {
      overallStyle.value = storedLayout.overallStyle;
    } else if ($storage?.layout?.overallStyle) {
      // 回退到 $storage（兼容性）
      overallStyle.value = $storage.layout.overallStyle;
    }
    // 如果都没有，保持默认值 "system"

    // 根据 overallStyle 设置 dataTheme（暗黑模式状态）
    if (overallStyle.value === "system") {
      dataTheme.value = mediaQueryList.matches;
    } else if (overallStyle.value === "dark") {
      dataTheme.value = true;
    } else {
      // 亮色或默认模式
      dataTheme.value = false;
    }

    initialized = true;
  }

  const body = document.documentElement as HTMLElement;

  function toggleClass(flag: boolean, clsName: string, target?: HTMLElement) {
    const targetEl = target || document.body;
    let { className } = targetEl;
    className = className.replace(clsName, "").trim();
    targetEl.className = flag ? `${className} ${clsName}` : className;
  }

  /** 设置导航主题色 */
  function setLayoutThemeColor(
    theme = getConfig().Theme ?? "light",
    isClick = true
  ) {
    layoutTheme.value.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    const storageThemeColor = $storage.layout?.themeColor;
    const newLayout = {
      layout: layout.value,
      theme,
      darkMode: dataTheme.value,
      sidebarStatus: $storage.layout?.sidebarStatus,
      epThemeColor: $storage.layout?.epThemeColor ?? "",
      themeColor: isClick ? theme : storageThemeColor,
      overallStyle: overallStyle.value
    };
    $storage.layout = newLayout;
    // 显式写入 localStorage 确保 overallStyle 等配置持久化
    storageLocal().setItem(`${responsiveStorageNameSpace()}layout`, newLayout);

    const fallbackColor = getConfig().EpThemeColor ?? "";
    if (theme === "default" || theme === "light") {
      setEpThemeColor(fallbackColor, theme);
    } else {
      const colors = themeColors.value.find(v => v.themeColor === theme);
      setEpThemeColor(colors?.color ?? fallbackColor, theme);
    }
  }

  function setPropertyPrimary(mode: string, i: number, color: string) {
    document.documentElement.style.setProperty(
      `--el-color-primary-${mode}-${i}`,
      dataTheme.value ? darken(color, i / 10) : lighten(color, i / 10)
    );
  }

  /** 设置 `element-plus` 主题色 */
  const setEpThemeColor = (color: string, themeColor?: string) => {
    useEpThemeStoreHook().setEpThemeColor(color);
    document.documentElement.style.setProperty("--el-color-primary", color);
    for (let i = 1; i <= 2; i++) {
      setPropertyPrimary("dark", i, color);
    }
    for (let i = 1; i <= 9; i++) {
      setPropertyPrimary("light", i, color);
    }
    // 应用当前主题的固定变量覆盖
    const fixedVars = getFixedVarsForTheme(themeColor || "");
    Object.entries(fixedVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  };

  /** 浅色、深色整体风格切换 */
  function dataThemeChange(overall?: string) {
    overallStyle.value = overall ?? overallStyle.value;
    if (useEpThemeStoreHook().epTheme === "light" && dataTheme.value) {
      setLayoutThemeColor("default", false);
    } else {
      setLayoutThemeColor(useEpThemeStoreHook().epTheme ?? "light", false);
    }

    if (dataTheme.value) {
      document.documentElement.classList.add("dark");
    } else {
      if ($storage.layout?.themeColor === "light") {
        setLayoutThemeColor("light", false);
      }
      document.documentElement.classList.remove("dark");
    }
  }

  /** 根据操作系统主题设置 */
  function updateTheme() {
    console.log(
      "updateTheme triggered. OverallStyle:",
      overallStyle.value,
      "Matches:",
      mediaQueryList.matches
    );
    if (overallStyle.value !== "system") return;
    if (mediaQueryList.matches) {
      dataTheme.value = true;
    } else {
      dataTheme.value = false;
    }
    dataThemeChange(overallStyle.value);
  }

  function removeMatchMedia() {
    if (mediaQueryList.removeEventListener) {
      mediaQueryList.removeEventListener("change", updateTheme);
    } else if (mediaQueryList.removeListener) {
      mediaQueryList.removeListener(updateTheme);
    }
  }

  /** 监听操作系统主题改变 */
  function watchSystemThemeChange() {
    // 根据 overallStyle 应用主题
    if (overallStyle.value === "system") {
      // 系统模式：根据系统主题设置
      updateTheme();
    } else {
      // 非系统模式：直接应用已保存的主题设置
      dataThemeChange(overallStyle.value);
    }
    removeMatchMedia();
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", updateTheme);
    } else if (mediaQueryList.addListener) {
      mediaQueryList.addListener(updateTheme);
    }
  }

  /** 清空缓存并返回登录页 */
  function onReset() {
    removeToken();
    storageLocal().clear();
    // Reset singletons defaults
    initialized = false;
    dataTheme.value = false;
    overallStyle.value = "system";

    const { Grey, Weak, MultiTagsCache, EpThemeColor, Layout } = getConfig();
    useAppStoreHook().setLayout(Layout ?? "vertical");
    setEpThemeColor(EpThemeColor ?? "");

    // Must persist the default layout to storage, ensuring overallStyle is 'system'
    const defaultLayout = {
      layout: Layout ?? "vertical",
      theme: getConfig().Theme ?? "light",
      darkMode: false,
      sidebarStatus: getConfig().SidebarStatus ?? true,
      epThemeColor: EpThemeColor ?? "#409EFF",
      themeColor: getConfig().Theme ?? "light",
      overallStyle: "system"
    };
    storageLocal().setItem(
      `${responsiveStorageNameSpace()}layout`,
      defaultLayout
    );
    // Update global storage state if valid
    if ($storage) {
      $storage.layout = defaultLayout;
    }
    useMultiTagsStoreHook().multiTagsCacheChange(!!MultiTagsCache);
    toggleClass(
      !!Grey,
      "html-grey",
      document.querySelector("html") || undefined
    );
    toggleClass(
      !!Weak,
      "html-weakness",
      document.querySelector("html") || undefined
    );
    router.push("/login");
    useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
    resetRouter();
  }

  return {
    body,
    dataTheme,
    overallStyle,
    layoutTheme,
    themeColors,
    onReset,
    toggleClass,
    dataThemeChange,
    setEpThemeColor,
    setLayoutThemeColor,
    watchSystemThemeChange // Changed: Exported
  };
}
