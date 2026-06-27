import {
  ref,
  unref,
  computed,
  reactive,
  onMounted,
  markRaw,
  type CSSProperties,
  getCurrentInstance
} from "vue";
import type { tagsViewsType, RouteConfigs } from "../types";
import type { multiType } from "@/store/types";
import { useRoute, useRouter } from "vue-router";
import { transformI18n, $t } from "@/plugins/i18n";
import { responsiveStorageNameSpace } from "@/config";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { isEqual, isBoolean } from "lodash-es";
import { storageLocal } from "@/utils/global";
import { toggleClass, hasClass } from "jinbi-utils";

// Element Plus Icons
import {
  FullScreen as FullscreenIcon,
  Minus as CloseAllTagsIcon,
  Operation as CloseOtherTagsIcon,
  Right as CloseRightTagsIcon,
  Back as CloseLeftTagsIcon,
  RefreshRight as RefreshRightIcon,
  Close as CloseIcon
} from "@element-plus/icons-vue";

/**
 * 使用 markRaw 包裹图标组件，避免 Vue 将其转换为响应式对象
 * @see https://vuejs.org/api/reactivity-advanced.html#markraw
 */
const Fullscreen = markRaw(FullscreenIcon);
const CloseAllTags = markRaw(CloseAllTagsIcon);
const CloseOtherTags = markRaw(CloseOtherTagsIcon);
const CloseRightTags = markRaw(CloseRightTagsIcon);
const CloseLeftTags = markRaw(CloseLeftTagsIcon);
const RefreshRight = markRaw(RefreshRightIcon);
const Close = markRaw(CloseIcon);

export function useTags() {
  const route = useRoute();
  const router = useRouter();
  const instance = getCurrentInstance();
  const pureSetting = useSettingStoreHook();

  const buttonTop = ref(0);
  const buttonLeft = ref(0);
  const translateX = ref(0);
  const visible = ref(false);
  const activeIndex = ref(-1);
  // 当前右键选中的路由信息
  const currentSelect = ref<RouteConfigs | null>(null);
  const isScrolling = ref(false);

  /** 显示模式，默认灵动模式 */
  const showModel = ref(
    storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.showModel || "smart"
  );
  /** 是否隐藏标签页，默认显示 */
  const showTags = ref(
    storageLocal().getItem<StorageConfigs>(
      `${responsiveStorageNameSpace()}configure`
    )?.hideTabs ?? "false"
  );
  const multiTags = computed<multiType[]>(() => {
    const tags = useMultiTagsStoreHook().multiTags;
    return Array.isArray(tags) ? (tags as multiType[]) : [];
  });

  const tagsViews = reactive<Array<tagsViewsType>>([
    {
      icon: RefreshRight,
      text: $t("buttons.pureReload"),
      divided: false,
      disabled: false,
      show: true
    },
    {
      icon: Close,
      text: $t("buttons.pureCloseCurrentTab"),
      divided: false,
      disabled: multiTags.value.length <= 1,
      show: true
    },
    {
      icon: CloseLeftTags,
      text: $t("buttons.pureCloseLeftTabs"),
      divided: true,
      disabled: multiTags.value.length <= 1,
      show: true
    },
    {
      icon: CloseRightTags,
      text: $t("buttons.pureCloseRightTabs"),
      divided: false,
      disabled: multiTags.value.length <= 1,
      show: true
    },
    {
      icon: CloseOtherTags,
      text: $t("buttons.pureCloseOtherTabs"),
      divided: true,
      disabled: multiTags.value.length <= 2,
      show: true
    },
    {
      icon: CloseAllTags,
      text: $t("buttons.pureCloseAllTabs"),
      divided: false,
      disabled: multiTags.value.length <= 1,
      show: true
    },
    {
      icon: Fullscreen,
      text: $t("buttons.pureContentFullScreen"),
      divided: true,
      disabled: false,
      show: true
    }
  ]);

  function conditionHandle(item: multiType, previous: unknown, next: unknown) {
    if (isBoolean(route?.meta?.showLink) && route?.meta?.showLink === false) {
      if (Object.keys(route.query).length > 0) {
        return isEqual(route.query, item.query) ? previous : next;
      } else {
        return isEqual(route.params, item.params) ? previous : next;
      }
    } else {
      return route.path === item.path ? previous : next;
    }
  }

  const isFixedTag = computed(() => {
    return (item: multiType) =>
      isBoolean(item?.meta?.fixedTag) && item?.meta?.fixedTag === true;
  });

  const iconIsActive = computed(() => {
    return (item: multiType, index: number) => {
      if (index === 0) return false;
      return conditionHandle(item, true, false) as boolean;
    };
  });

  const linkIsActive = computed(() => {
    return (item: multiType) => {
      return conditionHandle(item, "is-active", "") as string;
    };
  });

  const scheduleIsActive = computed(() => {
    return (item: multiType) => {
      return conditionHandle(item, "schedule-active", "") as string;
    };
  });

  const getTabStyle = computed((): CSSProperties => {
    return {
      transform: `translateX(${translateX.value}px)`,
      transition: isScrolling.value ? "none" : "transform 0.5s ease-in-out"
    };
  });

  const getContextMenuStyle = computed((): CSSProperties => {
    return { left: buttonLeft.value + "px", top: buttonTop.value + "px" };
  });

  const closeMenu = () => {
    visible.value = false;
  };

  const getRefEl = (key: string): HTMLElement | null => {
    const refVal = (instance?.refs as Record<string, unknown> | undefined)?.[
      key
    ];
    if (Array.isArray(refVal)) {
      return (refVal[0] as HTMLElement) ?? null;
    }
    return (refVal as HTMLElement) ?? null;
  };

  /** 鼠标移入添加激活样式 */
  function onMouseenter(index: number) {
    if (index) activeIndex.value = index;
    if (unref(showModel) === "smart") {
      const scheduleEl = getRefEl("schedule" + index);
      if (!scheduleEl) return;
      if (hasClass(scheduleEl, "schedule-active")) return;
      toggleClass(true, "schedule-in", scheduleEl);
      toggleClass(false, "schedule-out", scheduleEl);
    } else {
      const dynamicEl = getRefEl("dynamic" + index);
      if (!dynamicEl) return;
      if (hasClass(dynamicEl, "is-active")) return;
      toggleClass(true, "card-in", dynamicEl);
      toggleClass(false, "card-out", dynamicEl);
    }
  }

  /** 鼠标移出恢复默认样式 */
  function onMouseleave(index: number) {
    activeIndex.value = -1;
    if (unref(showModel) === "smart") {
      const scheduleEl = getRefEl("schedule" + index);
      if (!scheduleEl) return;
      if (hasClass(scheduleEl, "schedule-active")) return;
      toggleClass(false, "schedule-in", scheduleEl);
      toggleClass(true, "schedule-out", scheduleEl);
    } else {
      const dynamicEl = getRefEl("dynamic" + index);
      if (!dynamicEl) return;
      if (hasClass(dynamicEl, "is-active")) return;
      toggleClass(false, "card-in", dynamicEl);
      toggleClass(true, "card-out", dynamicEl);
    }
  }

  function onContentFullScreen() {
    pureSetting.hiddenSideBar
      ? pureSetting.changeSetting({ key: "hiddenSideBar", value: false })
      : pureSetting.changeSetting({ key: "hiddenSideBar", value: true });
  }

  onMounted(() => {
    if (!showModel.value) {
      const configure = storageLocal().getItem<StorageConfigs>(
        `${responsiveStorageNameSpace()}configure`
      );
      if (configure) {
        configure.showModel = "card";
        storageLocal().setItem(
          `${responsiveStorageNameSpace()}configure`,
          configure
        );
      }
    }
  });

  return {
    Close,
    route,
    router,
    visible,
    showTags,
    instance,
    multiTags,
    showModel,
    tagsViews,
    buttonTop,
    buttonLeft,
    translateX,
    isFixedTag,
    pureSetting,
    activeIndex,
    getTabStyle,
    isScrolling,
    iconIsActive,
    linkIsActive,
    currentSelect,
    scheduleIsActive,
    getContextMenuStyle,
    $t,
    closeMenu,
    onMounted,
    onMouseenter,
    onMouseleave,
    transformI18n,
    onContentFullScreen
  };
}
