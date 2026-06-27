<script setup lang="ts">
import { $t } from "@/plugins/i18n";
import { emitter } from "@/utils/mitt";
import NProgress from "@/utils/progress";
import { RouteConfigs } from "../../types";
import { useTags } from "../../hooks/useTag";
import { routerArrays } from "@/layout/types";
import type { multiType } from "@/store/types";
import { onClickOutside } from "@vueuse/core";
import TagChrome from "./components/TagChrome.vue";
import { handleAliveRoute, getTopMenu } from "@/router/utils";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import { usePermissionStoreHook } from "@/store/modules/permission";
import {
  ref,
  watch,
  unref,
  toRaw,
  nextTick,
  onBeforeUnmount,
  markRaw
} from "vue";
import { delay, isAllEmpty } from "jinbi-utils";
import { isEqual } from "lodash-es";
import { useResizeObserver } from "@vueuse/core";
import type { LocationQueryRaw, RouteParamsRawGeneric } from "vue-router";

// Element Plus Icons
import {
  FullScreen as FullscreenIcon,
  ArrowDown as ArrowDownIcon,
  ArrowRight as ArrowRightSLineIcon,
  ArrowLeft as ArrowLeftSLineIcon
} from "@element-plus/icons-vue";

/**
 * 使用 markRaw 包裹图标组件，避免 Vue 将其转换为响应式对象
 * 这些图标会在模板中直接使用，或者赋值给响应式对象的属性
 * @see https://vuejs.org/api/reactivity-advanced.html#markraw
 */
const ExitFullscreen = markRaw(FullscreenIcon);
const Fullscreen = markRaw(FullscreenIcon);
const ArrowDown = markRaw(ArrowDownIcon);
const ArrowRightSLine = markRaw(ArrowRightSLineIcon);
const ArrowLeftSLine = markRaw(ArrowLeftSLineIcon);

const toLocationQuery = (
  query?: Record<string, unknown>
): LocationQueryRaw | undefined => {
  if (!query) return undefined;
  const result: LocationQueryRaw = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      result[key] = value.map(v => String(v));
    } else if (value === null) {
      result[key] = null;
    } else {
      result[key] = String(value);
    }
  });
  return result;
};

const toRouteParams = (
  params?: Record<string, unknown>
): RouteParamsRawGeneric | undefined => {
  if (!params) return undefined;
  const result: RouteParamsRawGeneric = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    if (Array.isArray(value)) {
      result[key] = value.map(v => String(v));
    } else {
      result[key] = String(value);
    }
  });
  return result;
};

const normalizeRoute = (item: multiType): RouteConfigs => ({
  path: item.path ?? "",
  name: typeof item.name === "string" ? item.name : undefined,
  query: toLocationQuery(item.query as Record<string, unknown> | undefined),
  params: toRouteParams(item.params as Record<string, unknown> | undefined),
  meta: item.meta as RouteConfigs["meta"]
});

const {
  Close,
  route,
  router,
  visible,
  showTags,
  instance,
  multiTags,
  tagsViews,
  buttonTop,
  buttonLeft,
  showModel,
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
  closeMenu,
  onMounted,
  onMouseenter,
  onMouseleave,
  transformI18n,
  onContentFullScreen
} = useTags();

const tabDom = ref();
const containerDom = ref();
const scrollbarDom = ref();
const contextmenuRef = ref();
const isShowArrow = ref(false);
const topPath = getTopMenu()?.path;
const { VITE_HIDE_HOME } = import.meta.env;
const fixedTags = [
  ...routerArrays,
  ...usePermissionStoreHook().flatteningRoutes.filter(v => v?.meta?.fixedTag)
];

const dynamicTagView = async () => {
  await nextTick();
  const index = multiTags.value.findIndex(item => {
    if (!isAllEmpty(route.query)) {
      return isEqual(route.query, item.query);
    } else if (!isAllEmpty(route.params)) {
      return isEqual(route.params, item.params);
    } else {
      return route.path === item.path;
    }
  });
  moveToView(index);
};

const moveToView = async (index: number): Promise<void> => {
  await nextTick();
  const tabNavPadding = 10;
  if (!instance?.refs?.["dynamic" + index]) return;
  const refValue = instance.refs["dynamic" + index];
  const tabItemElArray = (
    Array.isArray(refValue) ? refValue : [refValue]
  ) as HTMLElement[];
  if (!tabItemElArray?.[0]) return;
  const tabItemEl = tabItemElArray[0];
  const tabItemElOffsetLeft = tabItemEl?.offsetLeft ?? 0;
  const tabItemOffsetWidth = tabItemEl?.offsetWidth ?? 0;
  // 标签页导航栏可视长度（不包含溢出部分）
  const scrollbarDomWidth = scrollbarDom.value
    ? scrollbarDom.value?.offsetWidth
    : 0;

  // 已有标签页总长度（包含溢出部分）
  const tabDomWidth = tabDom.value ? tabDom.value?.offsetWidth : 0;

  scrollbarDomWidth <= tabDomWidth
    ? (isShowArrow.value = true)
    : (isShowArrow.value = false);
  if (tabDomWidth < scrollbarDomWidth || tabItemElOffsetLeft === 0) {
    translateX.value = 0;
  } else if (tabItemElOffsetLeft < -translateX.value) {
    // 标签在可视区域左侧
    translateX.value = -tabItemElOffsetLeft + tabNavPadding;
  } else if (
    tabItemElOffsetLeft > -translateX.value &&
    tabItemElOffsetLeft + tabItemOffsetWidth <
      -translateX.value + scrollbarDomWidth
  ) {
    // 标签在可视区域
    translateX.value = Math.min(
      0,
      scrollbarDomWidth -
        tabItemOffsetWidth -
        tabItemElOffsetLeft -
        tabNavPadding
    );
  } else {
    // 标签在可视区域右侧
    translateX.value = -(
      tabItemElOffsetLeft -
      (scrollbarDomWidth - tabNavPadding - tabItemOffsetWidth)
    );
  }
};

const handleScroll = (offset: number): void => {
  const scrollbarDomWidth = scrollbarDom.value
    ? scrollbarDom.value?.offsetWidth
    : 0;
  const tabDomWidth = tabDom.value ? tabDom.value.offsetWidth : 0;
  if (offset > 0) {
    translateX.value = Math.min(0, translateX.value + offset);
  } else {
    if (scrollbarDomWidth < tabDomWidth) {
      if (translateX.value >= -(tabDomWidth - scrollbarDomWidth)) {
        translateX.value = Math.max(
          translateX.value + offset,
          scrollbarDomWidth - tabDomWidth
        );
      }
    } else {
      translateX.value = 0;
    }
  }
  isScrolling.value = false;
};

const handleWheel = (event: WheelEvent): void => {
  isScrolling.value = true;
  const scrollIntensity = Math.abs(event.deltaX) + Math.abs(event.deltaY);
  let offset = 0;
  if (event.deltaX < 0) {
    offset = scrollIntensity > 0 ? scrollIntensity : 100;
  } else {
    offset = scrollIntensity > 0 ? -scrollIntensity : -100;
  }

  smoothScroll(offset);
};

const smoothScroll = (offset: number): void => {
  // 每帧滚动的距离
  const scrollAmount = 20;
  let remaining = Math.abs(offset);

  const scrollStep = () => {
    const scrollOffset = Math.sign(offset) * Math.min(scrollAmount, remaining);
    handleScroll(scrollOffset);
    remaining -= Math.abs(scrollOffset);

    if (remaining > 0) {
      requestAnimationFrame(scrollStep);
    }
  };

  requestAnimationFrame(scrollStep);
};

function dynamicRouteTag(value: string): void {
  const hasValue = multiTags.value.some(item => {
    return item.path === value;
  });

  function concatPath(arr: RouteConfigs[], value: string) {
    if (!hasValue) {
      arr.forEach((arrItem: RouteConfigs) => {
        if (arrItem.path === value) {
          useMultiTagsStoreHook().handleTags("push", {
            path: value,
            meta: arrItem.meta ?? {},
            name: String(arrItem.name ?? "")
          });
        } else {
          if (arrItem.children && arrItem.children.length > 0) {
            concatPath(arrItem.children, value);
          }
        }
      });
    }
  }
  concatPath(router.options.routes as any, value);
}

/** 刷新路由 */
function onFresh() {
  NProgress.start();
  const { fullPath, query } = unref(route);
  router.replace({
    path: "/redirect" + fullPath,
    query
  });
  handleAliveRoute(route as ToRouteType, "refresh");
  NProgress.done();
}

function deleteDynamicTag(obj: multiType, current: multiType, tag?: string) {
  const valueIndex: number = multiTags.value.findIndex((item: multiType) => {
    if (item.query) {
      if (item.path === obj.path) {
        return item.query === obj.query;
      }
    } else if (item.params) {
      if (item.path === obj.path) {
        return item.params === obj.params;
      }
    } else {
      return item.path === obj.path;
    }
  });

  const spliceRoute = (
    startIndex?: number,
    length?: number,
    other?: boolean
  ): void => {
    if (other) {
      useMultiTagsStoreHook().handleTags(
        "equal",
        [
          VITE_HIDE_HOME === "false" ? fixedTags : toRaw(getTopMenu()),
          obj
        ].flat()
      );
    } else {
      useMultiTagsStoreHook().handleTags("splice", "", {
        startIndex,
        length
      }) as any;
    }
    dynamicTagView();
  };

  if (tag === "other") {
    spliceRoute(1, 1, true);
  } else if (tag === "left") {
    spliceRoute(fixedTags.length, valueIndex - fixedTags.length);
  } else if (tag === "right") {
    spliceRoute(valueIndex + 1, multiTags.value.length);
  } else {
    // 从当前匹配到的路径中删除
    spliceRoute(valueIndex, 1);
  }
  const newRoute = useMultiTagsStoreHook().handleTags("slice") as
    | RouteConfigs[]
    | undefined;
  if (!newRoute || newRoute.length === 0) return;
  if (current.path === route.path) {
    // 如果删除当前激活tag就自动切换到最后一个tag
    if (tag === "left") return;
    const firstRoute = newRoute[0];
    if (firstRoute?.query) {
      router.push({
        name: firstRoute.name as string,
        query: firstRoute.query as Record<string, string>
      });
    } else if (firstRoute?.params) {
      router.push({
        name: firstRoute.name as string,
        params: firstRoute.params as Record<string, string>
      });
    } else {
      router.push({ path: firstRoute.path });
    }
  } else {
    if (!multiTags.value.length) return;
    if (multiTags.value.some(item => item.path === route.path)) return;
    const firstRoute = newRoute[0];
    if (firstRoute?.query) {
      router.push({
        name: firstRoute.name as string,
        query: firstRoute.query as Record<string, string>
      });
    } else if (firstRoute?.params) {
      router.push({
        name: firstRoute.name as string,
        params: firstRoute.params as Record<string, string>
      });
    } else {
      router.push({ path: firstRoute.path });
    }
  }
}

function deleteMenu(item: multiType, tag?: string) {
  const routeCfg = normalizeRoute(item) as multiType;
  deleteDynamicTag(routeCfg, routeCfg, tag);
  handleAliveRoute(route as ToRouteType);
}

function onClickDrop(
  key: number,
  item: { disabled?: boolean } | null,
  selectRoute?: RouteConfigs
) {
  if (item && item.disabled) return;

  let selectTagRoute: multiType | undefined;
  if (selectRoute) {
    selectTagRoute = {
      path: selectRoute.path ?? "",
      meta: (selectRoute.meta ?? {}) as Record<string, unknown>,
      name: (selectRoute.name as string) ?? "",
      query: selectRoute?.query as Record<string, unknown>,
      params: selectRoute?.params as Record<string, unknown>
    };
  } else {
    selectTagRoute = {
      path: route.path,
      meta: (route.meta ?? {}) as Record<string, unknown>,
      name: (route.name as string) ?? "",
      query: route.query as Record<string, unknown>,
      params: route.params as Record<string, unknown>
    };
  }

  // 当前路由信息
  switch (key) {
    case 0:
      // 刷新路由
      onFresh();
      break;
    case 1:
      // 关闭当前标签页
      if (selectTagRoute) deleteMenu(selectTagRoute);
      break;
    case 2:
      // 关闭左侧标签页
      if (selectTagRoute) deleteMenu(selectTagRoute, "left");
      break;
    case 3:
      // 关闭右侧标签页
      if (selectTagRoute) deleteMenu(selectTagRoute, "right");
      break;
    case 4:
      // 关闭其他标签页
      if (selectTagRoute) deleteMenu(selectTagRoute, "other");
      break;
    case 5:
      // 关闭全部标签页
      useMultiTagsStoreHook().handleTags("splice", "", {
        startIndex: fixedTags.length,
        length: multiTags.value.length
      });
      if (topPath) router.push(topPath);
      // router.push(fixedTags[fixedTags.length - 1]?.path);
      handleAliveRoute(route as ToRouteType);
      break;
    case 6:
      // 内容区全屏
      onContentFullScreen();
      setTimeout(() => {
        if (pureSetting.hiddenSideBar) {
          tagsViews[6].icon = ExitFullscreen;
          tagsViews[6].text = $t("buttons.pureContentExitFullScreen");
        } else {
          tagsViews[6].icon = Fullscreen;
          tagsViews[6].text = $t("buttons.pureContentFullScreen");
        }
      }, 100);
      break;
  }
  setTimeout(() => {
    showMenuModel(route.fullPath, route.query);
  });
}

function handleCommand(command: { key: string; item: multiType }) {
  const { key, item } = command;
  onClickDrop(Number(key), null);
}

/** 触发右键中菜单的点击事件 */
function selectTag(key: number, item: { disabled?: boolean } | null) {
  closeMenu();
  onClickDrop(key, item, currentSelect.value ?? undefined);
}

function showMenus(value: boolean) {
  Array.of(1, 2, 3, 4, 5).forEach(v => {
    tagsViews[v].show = value;
  });
}

function disabledMenus(value: boolean, fixedTag = false) {
  Array.of(1, 2, 3, 4, 5).forEach(v => {
    tagsViews[v].disabled = value;
  });
  if (fixedTag) {
    tagsViews[2].show = false;
    tagsViews[2].disabled = true;
  }
}

/** 检查当前右键的菜单两边是否存在别的菜单，如果左侧的菜单是顶级菜单，则不显示关闭左侧标签页，如果右侧没有菜单，则不显示关闭右侧标签页 */
function showMenuModel(
  currentPath: string,
  query: LocationQueryRaw = {},
  refresh = false
) {
  const allRoute = multiTags.value;
  const routeLength = multiTags.value.length;
  let currentIndex = -1;
  if (isAllEmpty(query)) {
    currentIndex = allRoute.findIndex(v => v.path === currentPath);
  } else {
    currentIndex = allRoute.findIndex(v => isEqual(v.query, query));
  }
  function fixedTagDisabled() {
    if (allRoute[currentIndex]?.meta?.fixedTag) {
      // 只禁用针对当前固定标签的操作
      // 1: 关闭当前标签页
      // 2: 关闭左侧标签页
      // 3: 关闭右侧标签页
      // 注意：不在这里禁用 4(关闭其他) 和 5(关闭全部)，由后续统一判断
      Array.of(1, 2, 3).forEach(v => {
        tagsViews[v].disabled = true;
      });
    }
  }

  showMenus(true);

  if (refresh) {
    tagsViews[0].show = true;
  }

  /**
   * currentIndex为1时，左侧的菜单顶级菜单，则不显示关闭左侧标签页
   * 如果currentIndex等于routeLength-1，右侧没有菜单，则不显示关闭右侧标签页
   */
  if (currentIndex === 1 && routeLength !== 2) {
    // 左侧的菜单是顶级菜单，右侧存在别的菜单
    tagsViews[2].show = false;
    Array.of(1, 3, 4, 5).forEach(v => {
      tagsViews[v].disabled = false;
    });
    tagsViews[2].disabled = true;
    fixedTagDisabled();
  } else if (currentIndex === 1 && routeLength === 2) {
    disabledMenus(false);
    // 左侧的菜单是顶级菜单，右侧不存在别的菜单
    Array.of(2, 3, 4).forEach(v => {
      tagsViews[v].show = false;
      tagsViews[v].disabled = true;
    });
    fixedTagDisabled();
  } else if (routeLength - 1 === currentIndex && currentIndex !== 0) {
    // 当前路由是所有路由中的最后一个
    tagsViews[3].show = false;
    Array.of(1, 2, 4, 5).forEach(v => {
      tagsViews[v].disabled = false;
    });
    tagsViews[3].disabled = true;
    if (allRoute[currentIndex - 1]?.meta?.fixedTag) {
      tagsViews[2].show = false;
      tagsViews[2].disabled = true;
    }
    fixedTagDisabled();
  } else if (currentIndex === 0 || currentPath === `/redirect${topPath}`) {
    // 当前路由为顶级菜单
    disabledMenus(true);
  } else {
    disabledMenus(false, !!allRoute[currentIndex - 1]?.meta?.fixedTag);
    fixedTagDisabled();
  }

  // 统一处理"关闭其他"和"关闭全部"的可用性
  // 检查是否有可关闭的标签（非固定标签）
  const hasClosableTags = allRoute.length > fixedTags.length;

  if (hasClosableTags) {
    // 如果有可关闭的标签，"关闭全部标签页"应该始终可用
    tagsViews[5].disabled = false;

    // 检查除当前标签外是否还有其他可关闭的标签
    const hasOtherClosableTags = allRoute.some(
      (item, idx) => idx >= fixedTags.length && idx !== currentIndex
    );

    // 如果有其他可关闭的标签，"关闭其他标签页"也应该可用
    if (hasOtherClosableTags) {
      tagsViews[4].disabled = false;
    }
  }
}

function openMenu(tag: multiType, e: MouseEvent) {
  closeMenu();
  const routeCfg = normalizeRoute(tag);
  if (routeCfg.path === topPath || routeCfg?.meta?.fixedTag) {
    // 右键菜单为顶级菜单或拥有 fixedTag 属性，只显示刷新
    showMenus(false);
    tagsViews[0].show = true;
  } else if (route.path !== routeCfg.path && route.name !== routeCfg.name) {
    // 右键菜单不匹配当前路由，隐藏刷新
    tagsViews[0].show = false;
    showMenuModel(routeCfg.path ?? "", (tag.query ?? {}) as LocationQueryRaw);
  } else if (multiTags.value.length === 2 && route.path !== routeCfg.path) {
    showMenus(true);
    // 只有两个标签时不显示关闭其他标签页
    tagsViews[4].show = false;
  } else if (route.path === routeCfg.path) {
    // 右键当前激活的菜单
    showMenuModel(routeCfg.path, (tag.query ?? {}) as LocationQueryRaw, true);
  }

  currentSelect.value = routeCfg;
  const menuMinWidth = 140;
  const offsetLeft = unref(containerDom).getBoundingClientRect().left;
  const offsetWidth = unref(containerDom).offsetWidth;
  const maxLeft = offsetWidth - menuMinWidth;
  const left = e.clientX - offsetLeft + 5;
  if (left > maxLeft) {
    buttonLeft.value = maxLeft;
  } else {
    buttonLeft.value = left;
  }
  useSettingStoreHook().hiddenSideBar
    ? (buttonTop.value = e.clientY)
    : (buttonTop.value = e.clientY - 40);
  nextTick(() => {
    visible.value = true;
  });
}

/** 触发tags标签切换 */
function tagOnClick(item: multiType) {
  const target = normalizeRoute(item);
  const { name, path } = target;
  if (name) {
    if (target.query) {
      router.push({
        name,
        query: target.query
      });
    } else if (target.params) {
      router.push({
        name,
        params: target.params
      });
    } else {
      router.push({ name });
    }
  } else {
    router.push({ path });
  }
  emitter.emit("tagOnClick", path);
}

onClickOutside(contextmenuRef, closeMenu, {
  detectIframe: true
});

watch(route, () => {
  activeIndex.value = -1;
  dynamicTagView();
});

onMounted(() => {
  if (!instance) return;

  // 根据当前路由初始化操作标签页的禁用状态
  showMenuModel(route.fullPath);

  // 触发隐藏标签页
  emitter.on("tagViewsChange", (key: string) => {
    if (unref(showTags) === key) return;
    showTags.value = key;
  });

  // 改变标签风格
  emitter.on("tagViewsShowModel", key => {
    showModel.value = key;
  });

  //  接收侧边栏切换传递过来的参数
  emitter.on("changLayoutRoute", indexPath => {
    dynamicRouteTag(indexPath);
    setTimeout(() => {
      showMenuModel(indexPath);
    });
  });

  useResizeObserver(scrollbarDom, dynamicTagView);
  delay(100).then(() => dynamicTagView());
});

onBeforeUnmount(() => {
  // 解绑`tagViewsChange`、`tagViewsShowModel`、`changLayoutRoute`公共事件，防止多次触发
  emitter.off("tagViewsChange");
  emitter.off("tagViewsShowModel");
  emitter.off("changLayoutRoute");
});
</script>

<template>
  <div v-if="!showTags" ref="containerDom" class="tags-view">
    <span v-show="isShowArrow" class="arrow-left">
      <IconifyIconOffline :icon="ArrowLeftSLine" @click="handleScroll(200)" />
    </span>
    <div
      ref="scrollbarDom"
      class="scroll-container"
      :class="showModel === 'chrome' && 'chrome-scroll-container'"
      @wheel.prevent="handleWheel"
    >
      <div ref="tabDom" class="tab select-none" :style="getTabStyle">
        <div
          v-for="(item, index) in multiTags"
          :ref="'dynamic' + index"
          :key="index"
          :class="[
            'scroll-item is-closable',
            linkIsActive(item),
            showModel === 'chrome' && 'chrome-item',
            isFixedTag(item) && 'fixed-tag'
          ]"
          @contextmenu.prevent="openMenu(item, $event)"
          @mouseenter.prevent="onMouseenter(index)"
          @mouseleave.prevent="onMouseleave(index)"
          @click="tagOnClick(item)"
        >
          <template v-if="showModel !== 'chrome'">
            <span
              class="tag-title dark:text-text_color_primary! dark:hover:text-primary!"
            >
              {{ transformI18n(item.meta.title) }}
            </span>
            <span
              v-if="
                isFixedTag(item)
                  ? false
                  : iconIsActive(item, index) ||
                    (index === activeIndex && index !== 0)
              "
              class="el-icon-close"
              @click.stop="deleteMenu(item)"
            >
              <IconifyIconOffline :icon="Close" />
            </span>
            <span
              v-if="showModel !== 'card'"
              :ref="'schedule' + index"
              :class="[scheduleIsActive(item)]"
            />
          </template>
          <div v-else class="chrome-tab">
            <div class="chrome-tab__bg">
              <TagChrome />
            </div>
            <span class="tag-title">
              {{ transformI18n(item.meta.title) }}
            </span>
            <span
              v-if="isFixedTag(item) ? false : index !== 0"
              class="chrome-close-btn"
              @click.stop="deleteMenu(item)"
            >
              <IconifyIconOffline :icon="Close" />
            </span>
            <span class="chrome-tab-divider" />
          </div>
        </div>
      </div>
    </div>
    <span v-show="isShowArrow" class="arrow-right">
      <IconifyIconOffline :icon="ArrowRightSLine" @click="handleScroll(-200)" />
    </span>
    <!-- 右键菜单按钮 -->
    <transition name="el-zoom-in-top">
      <ul
        v-show="visible"
        ref="contextmenuRef"
        :key="Math.random()"
        :style="getContextMenuStyle"
        class="contextmenu"
      >
        <div
          v-for="(item, key) in tagsViews.slice(0, 6)"
          :key="key"
          style="display: flex; align-items: center"
        >
          <li v-if="item.show" @click="selectTag(key, item)">
            <IconifyIconOffline :icon="item.icon" />
            {{ transformI18n(item.text) }}
          </li>
        </div>
      </ul>
    </transition>
    <!-- 右侧功能按钮 -->
    <!-- <el-dropdown
      trigger="click"
      placement="bottom-end"
      @command="handleCommand"
    >
      <span class="arrow-down">
        <IconifyIconOffline :icon="ArrowDown" class="dark:text-white" />
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="(item, key) in tagsViews"
            :key="key"
            :command="{ key, item }"
            :divided="item.divided"
            :disabled="item.disabled"
          >
            <IconifyIconOffline :icon="item.icon" />
            {{ transformI18n(item.text) }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown> -->
  </div>
</template>

<style lang="scss" scoped>
@import url("./index.scss");
</style>
