import { storeToRefs } from "pinia";
import { getConfig, getCdnUrl } from "@/config";
import { useRouter } from "vue-router";
import { emitter } from "@/utils/mitt";
import { getTopMenu } from "@/router/utils";
import { useFullscreen } from "@vueuse/core";
import type { routeMetaType } from "../types";
import { transformI18n } from "@/plugins/i18n";
import { router, remainingPaths } from "@/router";
import { computed, type CSSProperties } from "vue";
import { useAppStoreHook } from "@/store/modules/app";
import { useUserStoreHook } from "@/store/modules/user";
import { useGlobal } from "@/utils/global";
import { isAllEmpty } from "jinbi-utils";
import { useEpThemeStoreHook } from "@/store/modules/epTheme";
import { usePermissionStoreHook } from "@/store/modules/permission";

// 默认头像 CDN 地址
const defaultAvatarUrl = getCdnUrl("images", "default_avatar.png");
// Element Plus Icons
import {
  FullScreen as Fullscreen,
  FullScreen as ExitFullscreen
} from "@element-plus/icons-vue";

const errorInfo =
  "The current routing configuration is incorrect, please check the configuration";

export function useNav() {
  const pureApp = useAppStoreHook();
  const routers = useRouter().options.routes;
  const { isFullscreen, toggle } = useFullscreen();
  const { wholeMenus } = storeToRefs(usePermissionStoreHook());
  /** 平台`layout`中所有`el-tooltip`的`effect`配置，默认`light` */
  const tooltipEffect = getConfig()?.TooltipEffect ?? "light";

  const getDivStyle = computed((): CSSProperties => {
    return {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      overflow: "hidden"
    };
  });

  /** 头像（如果头像为空则使用 CDN 默认头像） */
  const userAvatar = computed(() => {
    const avatar = useUserStoreHook()?.avatar;
    // 检查头像是否为空（空字符串、null、undefined 都视为空）
    if (!avatar || (typeof avatar === "string" && avatar.trim() === "")) {
      return defaultAvatarUrl;
    }
    return avatar;
  });

  /** 昵称（如果昵称为空则显示用户名） */
  const username = computed(() => {
    return isAllEmpty(useUserStoreHook()?.nickname)
      ? useUserStoreHook()?.username
      : useUserStoreHook()?.nickname;
  });

  /** 设置国际化选中后的样式 */
  const getDropdownItemStyle = computed(() => {
    return (locale: string, t: string) => {
      return {
        background: locale === t ? useEpThemeStoreHook().epThemeColor : "",
        color: locale === t ? "#f4f4f5" : "#000"
      };
    };
  });

  const getDropdownItemClass = computed(() => {
    return (locale: string, t: string) => {
      return locale === t ? "" : "dark:hover:text-primary!";
    };
  });

  const avatarsStyle = computed(() => {
    return username.value ? { marginRight: "10px" } : "";
  });

  const isCollapse = computed(() => {
    return !pureApp.getSidebarStatus;
  });

  const device = computed(() => {
    return pureApp.getDevice;
  });

  const { $storage, $config } = useGlobal<GlobalPropertiesApi>();
  const layout = computed(() => {
    return $storage?.layout?.layout;
  });

  const title = computed(() => {
    return $config.Title;
  });

  /** 动态title */
  function changeTitle(meta: routeMetaType) {
    const Title = getConfig().Title;
    const translated = String(transformI18n(meta.title));
    document.title = Title ? `${translated} | ${Title}` : translated;
  }

  /** 退出登录 */
  function logout() {
    useUserStoreHook().logOut();
  }

  function backTopMenu() {
    const top = getTopMenu();
    if (top?.path) {
      router.push(top.path);
    }
  }

  function onPanel() {
    emitter.emit("openPanel" as never);
  }

  function toAccountSettings() {
    router.push({ name: "AccountSettings" });
  }

  function toggleSideBar() {
    pureApp.toggleSideBar();
  }

  function handleResize(menuRef: { handleResize?: () => void } | null) {
    if (menuRef?.handleResize) {
      menuRef.handleResize();
    }
  }

  function resolvePath(
    route: routeMetaType & { children?: Array<{ path?: string }> }
  ) {
    if (!route.children || route.children.length === 0) {
      return console.error(errorInfo);
    }
    const httpReg = /^http(s?):\/\//;
    const routeChildPath = route.children[0]?.path ?? "";
    if (!routeChildPath) {
      return (route as { path?: string }).path;
    }
    if (httpReg.test(routeChildPath)) {
      return `${(route as { path?: string }).path ?? ""}/${routeChildPath}`;
    } else {
      return routeChildPath;
    }
  }

  function menuSelect(indexPath: string) {
    if (wholeMenus.value.length === 0 || isRemaining(indexPath)) return;
    emitter.emit("changLayoutRoute", indexPath);
  }

  /** 判断路径是否参与菜单 */
  function isRemaining(path: string) {
    return remainingPaths.includes(path);
  }

  /** 获取`logo` */
  function getLogo() {
    // return new URL("/logo.svg", import.meta.url).href;
    console.log("globalIcons.logoIcon", globalIcons.logoIcon);

    return globalIcons.logoIcon;
  }

  return {
    title,
    device,
    layout,
    logout,
    routers,
    $storage,
    isFullscreen,
    Fullscreen,
    ExitFullscreen,
    toggle,
    backTopMenu,
    onPanel,
    getDivStyle,
    changeTitle,
    toggleSideBar,
    menuSelect,
    handleResize,
    resolvePath,
    getLogo,
    isCollapse,
    pureApp,
    username,
    userAvatar,
    avatarsStyle,
    tooltipEffect,
    toAccountSettings,
    getDropdownItemStyle,
    getDropdownItemClass
  };
}
