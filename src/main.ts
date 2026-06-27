import App from "./App.vue";
import { setupStore } from "@/store";
import { useI18n } from "@/plugins/i18n";
import { getConfig, setConfig } from "./config";
import { MotionPlugin } from "@vueuse/motion";
import { createApp, type Directive, type App as VueApp } from "vue";
import { useElementPlus } from "@/plugins/elementPlus";
import { useGlobalComponents } from "@/plugins/globalComponents";
import { injectResponsiveStorage } from "@/utils/responsive";
// 预先静态导入 router（独立运行时使用）
import defaultRouter, { createQiankunRouter } from "./router";
import { setQiankunBasePath } from "./router/utils";
import type { Router } from "vue-router";

// ============================================================================
// 样式导入（根据运行环境条件性加载）
// ============================================================================

// 检测是否在 qiankun 环境中（在样式导入前检测）
const isQiankunEnv = !!(window as Window & { __POWERED_BY_QIANKUN__?: boolean })
  .__POWERED_BY_QIANKUN__;

// 在 qiankun 环境下，跳过会污染主应用的全局样式
// 这些样式包含 :root、html、body 等全局选择器
if (!isQiankunEnv) {
  // 仅在独立运行时导入全局重置样式
  // @ts-ignore - 动态导入样式文件不需要类型声明
  import("./style/reset.scss");
  // 仅在独立运行时导入 tailwind（包含大量 :root 变量）
  // @ts-ignore - 动态导入样式文件不需要类型声明
  import("./style/tailwind.css");
}

// 所有包含 Element Plus 相关样式的文件
// 在 qiankun 环境下跳过，子应用将继承主应用的主题
if (!isQiankunEnv) {
  // 仅在独立运行时导入第三方组件库样式（可能包含 Element Plus 变量）
  // @ts-ignore - 动态导入样式文件不需要类型声明
  import("yc-pro-components/theme-chalk/index.css");
  // 仅在独立运行时导入 Element Plus 主题（包含 --el-color-primary 等 CSS 变量）
  // @ts-ignore - 动态导入样式文件不需要类型声明
  import("./style/element-variables.scss");
  // 仅在独立运行时导入公共样式（包含 :root CSS 变量）
  // @ts-ignore - 动态导入样式文件不需要类型声明
  import("./style/index.scss");
}

// 导入字体图标 - 只在独立运行时加载
if (!isQiankunEnv) {
  // @ts-ignore
  import("./assets/iconfont/iconfont.js");
  // @ts-ignore
  import("./assets/iconfont/iconfont.css");
  // @ts-ignore
  import("tippy.js/dist/tippy.css");
  // @ts-ignore
  import("tippy.js/themes/light.css");
}

import VueTippy from "vue-tippy";

import * as directives from "@/directives";

// ============================================================================
// 微前端子应用配置（使用 vite-plugin-qiankun）
// ============================================================================
import {
  renderWithQiankun,
  qiankunWindow
} from "vite-plugin-qiankun/dist/helper";

/**
 * 子应用接收的 props 接口
 */
interface QiankunProps {
  container?: HTMLElement;
  getGlobalState?: () => Record<string, unknown>;
  setGlobalState?: (state: Record<string, unknown>) => void;
  onGlobalStateChange?: (
    callback: (
      state: Record<string, unknown>,
      prev: Record<string, unknown>
    ) => void
  ) => () => void;
  basePath?: string;
  [key: string]: unknown;
}

// 存储 Vue 应用实例（用于 qiankun 生命周期管理）
let instance: VueApp<Element> | null = null;
// 防止重复渲染的标记
let isRendering = false;

/**
 * 快速初始化平台配置（用于 qiankun 环境，避免网络请求阻塞挂载）
 */
function initConfigSync(app: VueApp<Element>): PlatformConfigs {
  const config = getConfig() as PlatformConfigs;
  app.config.globalProperties.$config = config;
  return config;
}

/**
 * 异步加载平台配置（挂载后执行）
 */
async function loadPlatformConfigAsync(app: VueApp<Element>) {
  try {
    const { VITE_PUBLIC_PATH } = import.meta.env;
    const response = await fetch(`${VITE_PUBLIC_PATH}platform-config.json`, {
      method: "GET"
    });
    if (response.ok) {
      const config = await response.json();
      const $config = Object.assign(getConfig(), config);
      app.config.globalProperties.$config = $config;
      setConfig($config);
      console.log("[data-center-admin] 平台配置已异步加载");
    }
  } catch (error) {
    console.warn("[data-center-admin] 异步加载平台配置失败:", error);
  }
}

/**
 * 渲染应用
 * @param props qiankun 传递的 props（独立运行时为空）
 */
async function render(props: QiankunProps = {}) {
  // 防止重复渲染导致栈溢出
  if (isRendering) {
    console.warn("[data-center-admin] 检测到重复渲染调用，已忽略");
    return;
  }

  isRendering = true;
  const { container } = props;
  const isQiankun = qiankunWindow.__POWERED_BY_QIANKUN__;

  // 在 qiankun 环境下保存主应用的主题 CSS 变量
  // 这些变量可能会被子应用的样式覆盖，需要在挂载后恢复
  let savedThemeVars: Record<string, string> = {};
  if (isQiankun) {
    const rootStyle = getComputedStyle(document.documentElement);
    // 保存主应用的关键主题变量
    savedThemeVars = {
      "--el-color-primary": rootStyle.getPropertyValue("--el-color-primary"),
      "--el-color-primary-light-3": rootStyle.getPropertyValue(
        "--el-color-primary-light-3"
      ),
      "--el-color-primary-light-5": rootStyle.getPropertyValue(
        "--el-color-primary-light-5"
      ),
      "--el-color-primary-light-7": rootStyle.getPropertyValue(
        "--el-color-primary-light-7"
      ),
      "--el-color-primary-light-8": rootStyle.getPropertyValue(
        "--el-color-primary-light-8"
      ),
      "--el-color-primary-light-9": rootStyle.getPropertyValue(
        "--el-color-primary-light-9"
      ),
      "--el-color-primary-dark-2": rootStyle.getPropertyValue(
        "--el-color-primary-dark-2"
      ),
      "--pure-bg-gradient-start": rootStyle.getPropertyValue(
        "--pure-bg-gradient-start"
      ),
      "--pure-bg-gradient-end": rootStyle.getPropertyValue(
        "--pure-bg-gradient-end"
      ),
      "--pure-button-primary-gradient-start": rootStyle.getPropertyValue(
        "--pure-button-primary-gradient-start"
      ),
      "--pure-button-primary-gradient-end": rootStyle.getPropertyValue(
        "--pure-button-primary-gradient-end"
      )
    };
    console.log("[data-center-admin] 已保存主应用主题变量:", savedThemeVars);
  }

  try {
    // 如果实例已存在，先卸载旧实例
    if (instance) {
      console.warn("[data-center-admin] render: 先卸载旧实例");
      instance.unmount();
      instance = null;
    }

    const app = createApp(App);

    // 自定义指令
    Object.keys(directives).forEach(key => {
      app.directive(key, (directives as { [key: string]: Directive })[key]);
    });

    // 全局注册vue-tippy
    app.use(VueTippy);

    // 在 qiankun 环境下使用同步配置初始化，避免网络请求阻塞挂载
    let config: PlatformConfigs;
    if (isQiankun) {
      config = initConfigSync(app);
    } else {
      const { getPlatformConfig } = await import("./config");
      config = await getPlatformConfig(app);
    }

    // 设置 store
    setupStore(app);

    // 根据环境选择路由实例
    // qiankun 环境：使用 createQiankunRouter() 创建简化布局的路由
    // 独立运行：使用预先导入的完整布局路由
    if (isQiankun) {
      // 初始化微前端 base 路径
      setQiankunBasePath(props.basePath);
    }
    const router: Router = isQiankun ? createQiankunRouter() : defaultRouter;
    app.use(router);
    console.log(
      "[data-center-admin] 使用路由:",
      isQiankun ? "qiankun 简化布局路由" : "完整布局路由"
    );

    // 只在独立模式下等待路由就绪
    if (!isQiankun) {
      try {
        await Promise.race([
          router.isReady(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 2000)
          )
        ]);
      } catch {
        console.warn("[data-center-admin] 路由就绪超时，继续挂载");
      }
    }

    injectResponsiveStorage(app, config);

    // 如果在 qiankun 环境中，保存主应用传递的方法
    if (props.getGlobalState) {
      app.config.globalProperties.$getGlobalState = props.getGlobalState;
      // 挂载到 qiankunWindow 上，方便在非组件代码中访问
      (
        qiankunWindow as typeof qiankunWindow & {
          $getGlobalState?: typeof props.getGlobalState;
        }
      ).$getGlobalState = props.getGlobalState;
    }
    if (props.setGlobalState) {
      app.config.globalProperties.$setGlobalState = props.setGlobalState;
      (
        qiankunWindow as typeof qiankunWindow & {
          $setGlobalState?: typeof props.setGlobalState;
        }
      ).$setGlobalState = props.setGlobalState;
    }
    if (props.onGlobalStateChange) {
      app.config.globalProperties.$onGlobalStateChange =
        props.onGlobalStateChange;
      (
        qiankunWindow as typeof qiankunWindow & {
          $onGlobalStateChange?: typeof props.onGlobalStateChange;
        }
      ).$onGlobalStateChange = props.onGlobalStateChange;
    }

    app
      .use(MotionPlugin)
      .use(useI18n)
      .use(useElementPlus)
      .use(useGlobalComponents);

    // 挂载到指定容器（qiankun 环境）或默认 #app
    const mountTarget = container
      ? container.querySelector("#app") || container
      : "#app";

    instance = app;
    app.mount(mountTarget);

    // 在 qiankun 环境下恢复主应用的主题 CSS 变量
    // 这是为了防止子应用的样式覆盖主应用的主题
    if (isQiankun && Object.keys(savedThemeVars).length > 0) {
      // 使用 requestAnimationFrame 确保在样式渲染完成后恢复
      requestAnimationFrame(() => {
        const root = document.documentElement;
        Object.entries(savedThemeVars).forEach(([key, value]) => {
          if (value && value.trim()) {
            root.style.setProperty(key, value);
          }
        });
        console.log("[data-center-admin] 已恢复主应用主题变量");
      });
    }

    console.log(
      "[data-center-admin] 应用已渲染",
      isQiankun ? "(qiankun 模式)" : "(独立模式)"
    );

    // qiankun 模式下，挂载后异步加载配置和初始化 store
    if (isQiankun) {
      // 使用 setTimeout 确保不阻塞 mount Promise 的返回
      setTimeout(async () => {
        await loadPlatformConfigAsync(app);
        // 初始化全局 store
        const { useGlobalStore } = await import("@/store/modules/global");
        const globalStore = useGlobalStore();
        globalStore.initConfig(app.config.globalProperties.$config);
      }, 0);
    } else {
      // 独立模式下同步初始化 store
      const { useGlobalStore } = await import("@/store/modules/global");
      const globalStore = useGlobalStore();
      globalStore.initConfig(config);
    }
  } finally {
    isRendering = false;
  }
}

// ============================================================================
// qiankun 生命周期注册
// ============================================================================
renderWithQiankun({
  /**
   * 启动钩子 - 只会在首次加载时调用一次
   */
  bootstrap() {
    console.log("[data-center-admin] bootstrap - 子应用启动");
  },

  /**
   * 挂载钩子 - 每次进入子应用时调用
   */
  mount(props) {
    console.log("[data-center-admin] mount - 子应用挂载", props);
    return render(props as QiankunProps);
  },

  /**
   * 卸载钩子 - 每次离开子应用时调用
   */
  unmount() {
    console.log("[data-center-admin] unmount - 子应用卸载");
    if (instance) {
      instance.unmount();
      instance = null;
    }
  },

  /**
   * 更新钩子（可选）- props 变化时调用
   */
  update(props) {
    console.log("[data-center-admin] update - 子应用更新", props);
  }
});

// ============================================================================
// 独立运行模式
// ============================================================================

// 非 qiankun 环境下，直接渲染应用（独立运行模式）
if (!qiankunWindow.__POWERED_BY_QIANKUN__) {
  render();
}
