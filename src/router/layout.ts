import { defineAsyncComponent, h, defineComponent } from "vue";
import { qiankunWindow } from "vite-plugin-qiankun/dist/helper";

/**
 * 检测是否在 qiankun 环境中
 * 使用 vite-plugin-qiankun 提供的 qiankunWindow，确保在渲染时能正确读取标识
 */
export function isQiankunEnv(): boolean {
  // 方式1: 使用 vite-plugin-qiankun 提供的 qiankunWindow（推荐）
  const hasQiankunWindow = !!qiankunWindow.__POWERED_BY_QIANKUN__;

  // 方式2: 直接检测 window 对象
  const win = window as Window & {
    __POWERED_BY_QIANKUN__?: boolean;
    __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string;
  };
  const hasQiankunFlag = !!win.__POWERED_BY_QIANKUN__;
  const hasQiankunPath = !!win.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;

  return hasQiankunWindow || hasQiankunFlag || hasQiankunPath;
}

/**
 * 动态布局包装组件
 *
 * 这个组件在渲染时（而不是模块加载时）检测 qiankun 环境
 * 确保在 qiankun 的 mount 生命周期之后才进行环境判断
 */
const DynamicLayout = defineComponent({
  name: "DynamicLayout",
  setup() {
    // 在 setup 阶段检测环境（此时 qiankun 已完成初始化）
    const isQiankun = isQiankunEnv();

    console.log(
      "[DynamicLayout] 环境检测:",
      isQiankun ? "qiankun 微前端模式" : "独立运行模式",
      "| qiankunWindow.__POWERED_BY_QIANKUN__:",
      qiankunWindow.__POWERED_BY_QIANKUN__
    );

    // 根据环境选择布局组件
    const LayoutComponent = isQiankun
      ? defineAsyncComponent(() => {
          console.log("[DynamicLayout] 加载 qiankun-layout.vue（简化布局）");
          return import("@/layout/qiankun-layout.vue");
        })
      : defineAsyncComponent(() => {
          console.log("[DynamicLayout] 加载 index.vue（完整布局）");
          return import("@/layout/index.vue");
        });

    return () => h(LayoutComponent);
  }
});

/**
 * 布局组件导出
 *
 * 返回 DynamicLayout 组件，在渲染时动态选择布局
 */
export const Layout = () => Promise.resolve({ default: DynamicLayout });
