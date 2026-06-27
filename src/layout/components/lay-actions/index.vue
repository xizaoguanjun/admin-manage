<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { computed } from "vue";
import { useRoute } from "vue-router";
// Element Plus Icons
import { Filter } from "@element-plus/icons-vue";
import { useSettingStoreHook } from "@/store/modules/settings";

// Props 定义
interface Props {
  showDefaultFilter?: boolean;
  visible?: boolean;
}

withDefaults(defineProps<Props>(), {
  showDefaultFilter: true,
  visible: true
});

// Emits 定义
interface Emits {
  (event: "filter-click"): void;
}

const emit = defineEmits<Emits>();

const { t } = useI18n();
const route = useRoute();
const settingStore = useSettingStoreHook();

// 基于路由元信息控制 LayActions 显示
const shouldShowLayActions = computed(() => {
  return route.meta.hideLayActions !== true;
});

// 基于路由元信息控制默认筛选按钮显示（可在路由 meta 中设置 hideDefaultFilter: true 来隐藏）
const shouldShowDefaultFilter = computed(() => {
  return route.meta.hideDefaultFilter !== true;
});

// 获取当前筛选显示状态（直接访问 state 属性）
const showPageSearch = computed(() => settingStore.showPageSearch);

// 处理筛选按钮点击 - 切换全局搜索表单显示状态
const handleFilterClick = () => {
  // 直接修改 state
  settingStore.showPageSearch = !settingStore.showPageSearch;
  const setGlobalState =
    (window as any).$setGlobalState ||
    (window as any).__PARENT_SET_GLOBAL_STATE__;
  if (setGlobalState) {
    setGlobalState({ showPageSearch: settingStore.showPageSearch });
  }
  emit("filter-click");
};
</script>

<template>
  <div v-if="visible && shouldShowLayActions" class="lay-actions">
    <div class="lay-actions-content">
      <!-- 前置插槽 -->
      <slot name="prefix" />
      <!-- 默认筛选按钮 -->
      <el-button
        v-if="showDefaultFilter && shouldShowDefaultFilter"
        size="small"
        :icon="Filter"
        :class="['filter-button', { 'filter-button--active': showPageSearch }]"
        @click="handleFilterClick"
      >
        {{ t("buttons.pureFilter") }}
      </el-button>
      <!-- 默认插槽 -->
      <slot />
      <!-- 后置插槽 -->
      <slot name="suffix" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.lay-actions {
  height: 28px;
  background: var(--pure-theme-menu-bg);

  .lay-actions-content {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    width: 100%;
    height: 100%;
    padding: 0 8px;
  }

  .filter-button {
    height: 28px;
    line-height: 28px;
    color: var(--el-color-primary);
    border: 1px solid var(--el-color-primary);
    border-radius: 4px;
  }
}
</style>
