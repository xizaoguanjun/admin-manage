import { Plugin as importToCDN } from "vite-plugin-cdn-import";

/**
 * @description 打包时采用`cdn`模式，仅限外网使用（默认不采用，如果需要采用cdn模式，请在 .env.production 文件，将 VITE_CDN 设置成true）
 * 平台采用企业CDN：https://staticcdn.jinbizhihui.com/libs
 * 注意：CDN资源需要手动上传到企业CDN服务器，参考 cdn-resources/README.md 文档
 */
export const cdn = importToCDN({
  //（prodUrl解释： name: 对应下面modules的name，version: 自动读取本地package.json中dependencies依赖中对应包的版本号，path: 对应下面modules的path，当然也可写完整路径，会替换prodUrl）
  prodUrl: "https://staticcdn.jinbizhihui.com/libs/{name}/{version}/{path}",
  modules: [
    {
      name: "vue",
      var: "Vue",
      path: "vue.global.prod.js"
    },
    {
      name: "vue-router",
      var: "VueRouter",
      path: "vue-router.global.prod.js"
    },
    {
      name: "vue-i18n",
      var: "VueI18n",
      path: "vue-i18n.runtime.global.prod.js"
    },
    // 项目中没有直接安装vue-demi，但是pinia用到了，所以需要在引入pinia前引入vue-demi（https://github.com/vuejs/pinia/blob/v2/packages/pinia/package.json#L77）
    {
      name: "vue-demi",
      var: "VueDemi",
      path: "index.iife.js"
    },
    {
      name: "pinia",
      var: "Pinia",
      path: "pinia.iife.prod.js"
    },
    {
      name: "element-plus",
      var: "ElementPlus",
      path: "index.full.min.js",
      css: "index.css"
    },
    {
      name: "axios",
      var: "axios",
      path: "axios.min.js"
    },
    {
      name: "dayjs",
      var: "dayjs",
      path: "dayjs.min.js"
    },
    {
      name: "sortablejs",
      var: "Sortable",
      path: "Sortable.min.js"
    }
  ]
});
