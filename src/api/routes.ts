import type { RouteRecordRaw } from "vue-router";

type Result = {
  success: boolean;
  data: RouteRecordRaw[];
};

/**
 * 获取异步路由（mock：直接返回空数组，侧边栏只展示本地静态路由）
 */
export const getAsyncRoutes = async (): Promise<Result> => {
  return { success: true, data: [] };
};
