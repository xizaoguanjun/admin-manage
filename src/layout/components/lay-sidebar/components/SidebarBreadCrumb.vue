<script setup lang="ts">
import { isEqual } from "lodash-es";
import { transformI18n } from "@/plugins/i18n";
import { useRoute, useRouter, type RouteRecordRaw } from "vue-router";
import { ref, watch, onMounted, toRaw } from "vue";
import { getParentPaths, findRouteByPath } from "@/router/utils";
import { useMultiTagsStoreHook } from "@/store/modules/multiTags";
import type { multiType } from "@/store/types";

interface BreadcrumbItem {
  path: string;
  meta?: { title?: string | boolean };
  redirect?: string;
  name?: string;
  query?: Record<string, string | number | null | undefined>;
  params?: Record<string, string | number>;
  children?: BreadcrumbItem[];
}

const route = useRoute();
const levelList = ref<BreadcrumbItem[]>([]);
const router = useRouter();
const routes = router.options.routes as RouteRecordRaw[];
const multiTags = useMultiTagsStoreHook().multiTags as multiType[] | null;

const getBreadcrumb = (): void => {
  // 当前路由信息
  let currentRoute: BreadcrumbItem | undefined;

  if (Object.keys(route.query).length > 0) {
    multiTags?.forEach((item: multiType) => {
      if (isEqual(route.query, item?.query)) {
        currentRoute = toRaw(item) as BreadcrumbItem;
      }
    });
  } else if (Object.keys(route.params).length > 0) {
    multiTags?.forEach((item: multiType) => {
      if (isEqual(route.params, item?.params)) {
        currentRoute = toRaw(item) as BreadcrumbItem;
      }
    });
  } else {
    currentRoute = findRouteByPath(router.currentRoute.value.path, routes) as
      | BreadcrumbItem
      | undefined;
  }

  // 当前路由的父级路径组成的数组
  const parentRoutes = getParentPaths(
    router.currentRoute.value.name as string,
    routes,
    "name"
  );
  // 存放组成面包屑的数组
  const matched: BreadcrumbItem[] = [];

  // 获取每个父级路径对应的路由信息
  parentRoutes.forEach(path => {
    if (path !== "/") {
      const found = findRouteByPath(path, routes) as BreadcrumbItem | undefined;
      if (found) matched.push(found);
    }
  });

  if (currentRoute) matched.push(currentRoute);

  matched.forEach((item, index) => {
    if (currentRoute?.query || currentRoute?.params) return;
    if (item?.children) {
      item.children.forEach(v => {
        if (v?.meta?.title === item?.meta?.title) {
          matched.splice(index, 1);
        }
      });
    }
  });

  levelList.value = matched.filter(
    item => item?.meta && item?.meta.title !== false
  );
};

const handleLink = (item: BreadcrumbItem) => {
  const { redirect, name, path } = item;
  if (redirect) {
    router.push(redirect);
  } else {
    if (name) {
      if (item.query) {
        router.push({
          name,
          query: item.query as Record<string, string>
        });
      } else if (item.params) {
        router.push({
          name,
          params: item.params as Record<string, string>
        });
      } else {
        router.push({ name });
      }
    } else {
      router.push({ path });
    }
  }
};

onMounted(() => {
  getBreadcrumb();
});

watch(
  () => route.path,
  () => {
    getBreadcrumb();
  },
  {
    deep: true
  }
);
</script>

<template>
  <el-breadcrumb class="leading-[50px]! select-none" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item
        v-for="item in levelList"
        :key="item.path"
        class="inline! items-stretch!"
      >
        <a @click.prevent="handleLink(item)">
          {{ transformI18n(item.meta?.title) }}
        </a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>
