<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { getTopMenu } from "@/router/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useGlobal } from "@/utils/global";
// Element Plus Icons
import { Fold as MenuFold } from "@element-plus/icons-vue";

const props = defineProps({
  collapse: Boolean,
  isActive: Boolean
});

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

const { t } = useI18n();
const { title, getLogo, tooltipEffect } = useNav();
const { $storage } = useGlobal<GlobalPropertiesApi>();
const themeColor = computed(() => $storage.layout?.themeColor);

const isHovering = ref(false);

const toggleClick = () => {
  isHovering.value = false;
  emit("toggleClick");
};
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link
        v-if="collapse"
        key="collapse"
        :title="title"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <div
          class="logo-icon-wrapper"
          @mouseenter="isHovering = true"
          @mouseleave="isHovering = false"
        >
          <img v-show="!isHovering" :src="getLogo()" alt="logo" />
          <IconifyIconOffline
            v-show="isHovering"
            v-tippy="{
              content: isActive
                ? t('buttons.pureClickCollapse')
                : t('buttons.pureClickExpand'),
              theme: tooltipEffect,
              hideOnClick: 'toggle',
              placement: 'right'
            }"
            :icon="MenuFold"
            :class="[
              'collapse-icon',
              themeColor === 'light' ? '' : 'text-primary'
            ]"
            :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }"
            @click.prevent="toggleClick"
          />
        </div>
      </router-link>
      <router-link
        v-else
        key="expand"
        :title="title"
        class="sidebar-logo-link"
        :to="getTopMenu()?.path ?? '/'"
      >
        <!-- <img :src="getLogo()" alt="logo" /> -->
        <img :src="logoTextIcon" />
        <span class="sidebar-title">{{ title }}</span>
      </router-link>
    </transition>

    <!-- 折叠/展开按钮 - 显示在右侧（仅在展开状态下显示） -->
    <div v-show="!isHovering && !collapse" class="collapse-button">
      <IconifyIconOffline
        v-tippy="{
          content: isActive
            ? t('buttons.pureClickCollapse')
            : t('buttons.pureClickExpand'),
          theme: tooltipEffect,
          hideOnClick: 'toggle',
          placement: 'right'
        }"
        :icon="MenuFold"
        :class="['collapse-icon', themeColor === 'light' ? '' : 'text-primary']"
        :style="{ transform: isActive ? 'none' : 'rotateY(180deg)' }"
        @click="toggleClick"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 48px;
  overflow: hidden;

  .sidebar-logo-link {
    display: flex;
    flex: 1;
    flex-wrap: nowrap;
    align-items: center;
    height: 100%;
    padding-left: 10px;

    .logo-icon-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;

      img {
        display: block;
        height: 32px;
      }

      .collapse-icon {
        width: 24px;
        height: 24px;
        cursor: pointer;
        transition: transform 0.1s;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }

    img {
      display: inline-block;
      height: 32px;
    }

    .sidebar-title {
      display: inline-block;
      height: 32px;
      margin: 2px 0 0 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
      color: var(--pure-theme-sub-menu-active-text);
      white-space: nowrap;
    }
  }

  .collapse-button {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 100%;
    padding-right: 8px;

    .collapse-icon {
      width: 16px;
      height: 16px;
      cursor: pointer;
      transition: transform 0.1s;

      &:hover {
        color: var(--el-color-primary);
      }
    }
  }
}
</style>
