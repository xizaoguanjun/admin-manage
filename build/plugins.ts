import { cdn } from "./cdn";
import vue from "@vitejs/plugin-vue";
import { pathResolve } from "./utils";
import { viteBuildInfo } from "./info";
import svgLoader from "vite-svg-loader";
import type { PluginOption } from "vite";
import vueJsx from "@vitejs/plugin-vue-jsx";
import tailwindcss from "@tailwindcss/vite";
import { configCompressPlugin } from "./compress";
import removeNoMatch from "vite-plugin-router-warn";
import { visualizer } from "rollup-plugin-visualizer";
import removeConsole from "vite-plugin-remove-console";
import VueI18nPlugin from "@intlify/unplugin-vue-i18n/vite";
import { codeInspectorPlugin } from "code-inspector-plugin";
import AutoImport from "unplugin-auto-import/vite";
import DefineOptions from "unplugin-vue-define-options/vite";

export function getPluginsList(
  VITE_CDN: boolean,
  VITE_COMPRESSION: ViteCompression
): PluginOption[] {
  const lifecycle = process.env.npm_lifecycle_event;
  return [
    tailwindcss(),
    vue(),
    // 支持在 <script setup> 中使用 defineOptions 定义组件名
    DefineOptions(),
    // jsx、tsx语法支持
    vueJsx(),
    VueI18nPlugin({
      include: [pathResolve("../locales/**")]
    }),
    // 自动导入 API、全局配置等
    AutoImport({
      imports: [
        "vue",
        "vue-router",
        "pinia",
        {
          "@/config/globalIcons": [
            "globalIcons",
            "addPlus",
            "delIcon",
            "uploadIcon",
            "downloadIcon",
            "reviewIcon",
            "calendarIcon",
            "deleteIcon",
            "settingIcon",
            "incomeIcon",
            "incomeReductionIcon",
            "penaltyReductionIcon",
            "excelIcon",
            "weightIcon",
            "questionIcon",
            "logoIcon",
            "logoTextIcon",
            "miIcon"
          ]
        }
      ],
      dts: "types/auto-imports.d.ts",
      // 允许在 Vue 模板中使用自动导入的变量
      vueTemplate: true,
      eslintrc: {
        enabled: true,
        filepath: "./.eslintrc-auto-import.json",
        globalsPropValue: true
      }
    }),
    /**
     * 在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置
     * Mac 默认组合键 Option + Shift
     * Windows 默认组合键 Alt + Shift
     * 更多用法看 https://inspector.fe-dev.cn/guide/start.html
     */
    codeInspectorPlugin({
      bundler: "vite",
      hideConsole: true
    }),
    viteBuildInfo(),
    /**
     * 开发环境下移除非必要的vue-router动态路由警告No match found for location with path
     * 非必要具体看 https://github.com/vuejs/router/issues/521 和 https://github.com/vuejs/router/issues/359
     * vite-plugin-router-warn只在开发环境下启用，只处理vue-router文件并且只在服务启动或重启时运行一次，性能消耗可忽略不计
     */
    removeNoMatch(),
    // svg组件化支持
    svgLoader(),
    // 企业 CDN 配置已启用
    VITE_CDN ? cdn : null,
    configCompressPlugin(VITE_COMPRESSION),
    // 线上环境删除console
    removeConsole({ external: ["src/assets/iconfont/iconfont.js"] }),
    // 打包分析
    lifecycle === "report"
      ? visualizer({ open: true, brotliSize: true, filename: "report.html" })
      : (null as unknown as PluginOption)
  ];
}
