<template>
  <!--
    qiankun 微前端环境专用的简化布局
    只渲染内容区域，不包含侧边栏和顶栏（由主应用提供）

    关键设计：
    1. 不添加任何 padding-top（主应用已处理）
    2. 使用 flex 布局填充父容器高度
    3. 内部滚动由子组件自己控制，外层不设置 overflow:auto
  -->
  <el-scrollbar class="qiankun-layout">
    <router-view v-slot="{ Component, route }">
      <div class="qiankun-main-content">
        <keep-alive v-if="keepAlive" :include="cachePageList">
          <component :is="Component" :key="route.name" />
        </keep-alive>
        <component :is="Component" v-else :key="route.name" />
      </div>
    </router-view>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { usePermissionStoreHook } from "@/store/modules/permission";
import { useGlobal } from "@/utils/global";
import { useRoute } from "vue-router";

const { $config } = useGlobal<GlobalPropertiesApi>();
const route = useRoute();

// 从全局配置获取 keepAlive 设置，与独立模式保持一致
const keepAlive = computed(() => {
  return $config?.KeepAlive ?? true;
});

/**
 * 缓存页面列表（转换为 string[] 类型以兼容 keep-alive 的 include 属性）
 * 与独立模式 lay-content 保持一致
 */
const cachePageList = computed(() => {
  return usePermissionStoreHook().cachePageList.filter(
    (name): name is string => typeof name === "string"
  );
});

onMounted(() => {
  console.log("[qiankun-layout] 已挂载, cachePageList:", cachePageList.value);
});

// 监控路由变化，用于调试
watch(
  () => route.name,
  newName => {
    console.log(
      "[qiankun-layout] 路由:",
      newName,
      "缓存列表:",
      cachePageList.value
    );
  }
);
</script>

<style lang="scss" scoped>
/**
 * qiankun 微前端布局容器
 *
 * 设计原则：
 * 1. 完全填充父容器（主应用的 micro-app-container）
 * 2. 不设置任何 padding/margin（主应用已处理）
 * 3. 使用 flex 布局让内容自适应
 * 4. 内部滚动由具体页面组件控制
 */
.qiankun-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  height: calc(100vh - 76px);
  min-height: 0; /* 重要：允许 flex 子项收缩 */
  padding: 0;
  margin: 0;
  overflow: hidden; /* 外层不滚动，让内部组件控制滚动 */
}

/**
 * 主内容区域
 *
 * 使用 flex: 1 填充剩余空间，并设置 min-height: 0 允许收缩
 * 内部表格等组件需要自己设置 overflow:auto 来实现滚动
 */
.qiankun-main-content {
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  min-height: 0; /* 重要：允许内容收缩以适应容器 */
  padding: 8px 8px 8px 0;
  overflow: hidden; /* 让子组件（如表格）自己控制滚动 */
}

/**
 * 深度选择器：确保子应用的 plus-page 表格区域正确滚动
 */
:deep(.plus-page) {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

:deep(.plus-page__table_wrapper) {
  flex: 1;
  min-height: 0;
  overflow: auto; /* 只在表格区域内部滚动 */
}

/* 过渡动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.2s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
