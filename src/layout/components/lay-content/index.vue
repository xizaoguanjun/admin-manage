<script setup lang="ts">
import { useI18n } from "vue-i18n";
import LayFrame from "../lay-frame/index.vue";
import { useGlobal } from "@/utils/global";
import { isNumber } from "lodash-es";
import BackTopIcon from "@/assets/svg/back_top.svg?component";
import {
  h,
  computed,
  Transition,
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  nextTick
} from "vue";
import type { RouteLocationNormalized } from "vue-router";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useRoute } from "vue-router";

const props = defineProps({
  fixedHeader: Boolean
});

const { t } = useI18n();
const { $storage, $config } = useGlobal<GlobalPropertiesApi>();

const route = useRoute();

const isKeepAlive = computed(() => {
  return $config?.KeepAlive;
});

/**
 * 缓存页面列表（转换为 string[] 类型以兼容 keep-alive 的 include 属性）
 */
const cachePageList = computed(() => {
  return usePermissionStoreHook().cachePageList.filter(
    (name): name is string => typeof name === "string"
  );
});

const transitions = computed(() => {
  return (route: RouteLocationNormalized) => {
    return route.meta.transition;
  };
});

const stretch = computed(() => {
  return $storage?.configure.stretch;
});

const getMainWidth = computed(() => {
  return isNumber(stretch.value)
    ? stretch.value + "px"
    : stretch.value
      ? "1440px"
      : "100%";
});

const layActionsHeight = ref(0);

const measureLayActions = () => {
  const layActions = document.querySelector(".lay-actions");
  if (!layActions) {
    layActionsHeight.value = 0;
    return;
  }
  const { height } = layActions.getBoundingClientRect();
  layActionsHeight.value = height;
};

let observer: MutationObserver | null = null;

const teardownObserver = () => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
};

const setupObserver = () => {
  teardownObserver();
  const layActions = document.querySelector(".lay-actions");
  if (!layActions) return;

  observer = new MutationObserver(() => {
    measureLayActions();
  });

  observer.observe(layActions, {
    attributes: true,
    attributeFilter: ["style", "class"],
    childList: true,
    subtree: true
  });
};

const getSectionStyle = computed(() => {
  // navbar 高度：48px
  const navbarHeight = 48;
  const totalHeight =
    layActionsHeight.value > 0
      ? navbarHeight + layActionsHeight.value
      : navbarHeight;

  return [
    props.fixedHeader
      ? `padding-top: ${totalHeight}px;`
      : `padding-top: 0; min-height: calc(100vh - ${totalHeight}px);`
  ];
});

onMounted(() => {
  nextTick(() => {
    measureLayActions();
    setupObserver();
  });
});

watch(
  () => route.fullPath,
  () => {
    nextTick(() => {
      measureLayActions();
      setupObserver();
    });
  }
);

onUnmounted(() => {
  teardownObserver();
});

const transitionMain = defineComponent({
  props: {
    route: {
      type: Object as () => RouteLocationNormalized,
      required: true
    }
  },
  render() {
    const route = this.route as RouteLocationNormalized;
    const transitionName = transitions.value(route)?.name || "fade-transform";
    const enterTransition = transitions.value(route)?.enterTransition;
    const leaveTransition = transitions.value(route)?.leaveTransition;
    return h(
      Transition,
      {
        name: enterTransition ? "pure-classes-transition" : transitionName,
        enterActiveClass: enterTransition
          ? `animate__animated ${enterTransition}`
          : undefined,
        leaveActiveClass: leaveTransition
          ? `animate__animated ${leaveTransition}`
          : undefined,
        mode: "out-in",
        appear: true
      },
      {
        default: () => [this.$slots.default?.()]
      }
    );
  }
});
</script>

<template>
  <section
    :class="[fixedHeader ? 'app-main' : 'app-main-nofixed-header']"
    :style="getSectionStyle"
  >
    <router-view>
      <template #default="{ Component, route }">
        <LayFrame :currComp="Component" :currRoute="route">
          <template #default="{ Comp, fullPath, frameInfo }">
            <el-scrollbar
              v-if="fixedHeader"
              :wrap-style="{
                display: 'flex',
                'flex-wrap': 'wrap',
                'max-width': getMainWidth,
                margin: '0 auto',
                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)'
              }"
              :view-style="{
                display: 'flex',
                'flex-direction': 'column',
                width: '100%',
                height: '100%',
                'min-height': '0',
                overflow: 'hidden'
              }"
            >
              <el-backtop
                :title="t('buttons.pureBackTop')"
                target=".app-main .el-scrollbar__wrap"
              >
                <BackTopIcon />
              </el-backtop>
              <div class="grow">
                <transitionMain :route="route">
                  <keep-alive v-if="isKeepAlive" :include="cachePageList">
                    <component
                      :is="Comp"
                      :key="fullPath"
                      :frameInfo="frameInfo"
                      class="main-content"
                    />
                  </keep-alive>
                  <component
                    :is="Comp"
                    v-else
                    :key="fullPath"
                    :frameInfo="frameInfo"
                    class="main-content"
                  />
                </transitionMain>
              </div>
            </el-scrollbar>
            <div v-else class="grow">
              <transitionMain :route="route">
                <keep-alive v-if="isKeepAlive" :include="cachePageList">
                  <component
                    :is="Comp"
                    :key="fullPath"
                    :frameInfo="frameInfo"
                    class="main-content"
                  />
                </keep-alive>
                <component
                  :is="Comp"
                  v-else
                  :key="fullPath"
                  :frameInfo="frameInfo"
                  class="main-content"
                />
              </transitionMain>
            </div>
          </template>
        </LayFrame>
      </template>
    </router-view>
  </section>
</template>

<style scoped>
.app-main {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow-x: hidden;

  :deep(.el-scrollbar) {
    flex: 1;
    overflow: hidden;
  }
}

.app-main-nofixed-header {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
}

.grow {
  display: flex !important;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 8px 8px 8px 0;
  overflow: hidden;
}

.main-content {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
