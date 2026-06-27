import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import {
  root,
  alias,
  wrapperEnv,
  pathResolve,
  __APP_INFO__
} from "./build/utils";
// import OpenInEditor from "vite-plugin-open-in-editor";
// import VueDevTools from "vite-plugin-vue-devtools";
// import { createChunkOptimizer } from "jinbi-utils/chunk-optimizer";
// 微前端子应用插件
import qiankun from "vite-plugin-qiankun";

/**
 * 代理目标地址配置
 * 使用方式：pnpm dev / pnpm dev:test / pnpm dev:uat
 */
const PROXY_TARGETS = {
  // dev: "http://192.168.177.116:8000",
  dev: "https://kong-saas-sit.evertro.tech",
  test: "https://test-pm.evertro.tech",
  uat: "https://uat-pm.evertro.tech"
} as const;

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const {
    VITE_CDN,
    VITE_PORT,
    VITE_COMPRESSION,
    VITE_PUBLIC_PATH,
    VITE_MICRO_APP_NAME,
    VITE_API_URL
  } = wrapperEnv(loadEnv(mode, root));

  // 获取代理目标地址，优先从 process.env 读取（cross-env 设置），默认使用 dev
  const proxyEnv = (process.env.VITE_PROXY_TARGET ||
    "dev") as keyof typeof PROXY_TARGETS;
  const proxyTarget = PROXY_TARGETS[proxyEnv] || PROXY_TARGETS.dev;
  console.log(`[Vite] 代理目标环境: ${proxyEnv}, 地址: ${proxyTarget}`);

  // 微前端子应用名称（需要与主应用配置保持一致）
  const microAppName = VITE_MICRO_APP_NAME || "data-center-admin";

  // 创建智能分包优化器
  // const chunkOptimizer = createChunkOptimizer({
  //   framework: "vue",
  //   debug: mode === "development", // 开发模式下显示调试信息
  //   customRules: {
  //     // 可以在这里添加项目特定的自定义规则
  //     // 'my-custom-lib': 'vendor-custom',
  //   },
  //   sourceCodeStrategy: {
  //     views: true,
  //     components: true,
  //     utils: true,
  //     store: true
  //   }
  // });

  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端配置
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 微前端相关：允许跨域访问（qiankun 需要从主应用跨域加载子应用资源）
      cors: true,
      // 微前端相关：设置响应头，允许跨域资源共享
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      // 微前端相关：允许从主应用 origin 访问（仅开发环境需要）
      // 生产环境不设置 origin，避免 Mixed Content 问题
      origin:
        mode === "development" ? `http://localhost:${VITE_PORT}` : undefined,
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy: {
        // 海辉的接口
        "/opa": {
          target: "http://192.168.177.114",
          changeOrigin: true
          // rewrite: path => path.replace(/^\/opa/, "")
        },
        "/bff-api": {
          target: "http://192.168.177.114:3011",
          changeOrigin: true
        },
        "/community": {
          target: "http://192.168.177.114:3011",
          changeOrigin: true
        },
        "/api": {
          // target: "http://192.168.177.113:25888",
          // target: "http://172.17.86.112:18111",
          // target: "http://172.17.87.198:18110",
          target: VITE_API_URL,
          // target: "http://172.17.87.227:18111",
          changeOrigin: true
        },
        "/uploads": {
          target: VITE_API_URL,
          changeOrigin: true
        },
        "/saas": {
          // target: "https://test-pm.evertro.tech",
          target: VITE_API_URL,
          changeOrigin: true
        },
        "/dxwy": {
          // target: "http://172.17.87.227:18211",
          target: VITE_API_URL,
          changeOrigin: true
        },
        "/hdwy": {
          // target: "http://172.17.87.227:18211",
          target: VITE_API_URL,
          changeOrigin: true
        },
        "/csqyq": {
          // target: "http://172.17.87.227:18211",
          target: VITE_API_URL,
          changeOrigin: true
        }
        // "zhongyao-api": {
        //   target: "http://172.18.71.185:18083",
        //   changeOrigin: true,
        //   rewrite: path => path.replace(/^\/zhongyao-api/, "")
        // }
      },
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    plugins: [
      ...getPluginsList(VITE_CDN, VITE_COMPRESSION),
      // Vue DevTools 配置
      // 注意：Vue DevTools 的虚拟模块在 qiankun 环境中会被主应用过滤掉
      // 因此这里可以正常启用，主应用会通过 excludeAssetFilter 排除虚拟模块
      // ...(mode === "development"
      //   ? [
      //       VueDevTools({
      //         launchEditor: "cursor"
      //       })
      //     ]
      //   : []),
      // 微前端子应用插件配置
      // 必须启用此插件，否则 qiankun 无法正确加载子应用的生命周期钩子
      qiankun(microAppName, {
        useDevMode: mode === "development"
      })
    ],
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      outDir: "data-center-admin",
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
          // 使用智能分包优化器
          // manualChunks: chunkOptimizer.generate()
        }
      }
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
