import { $t } from "@/plugins/i18n";
import { home } from "@/router/enums";
import { Layout } from "@/router/layout";
const { VITE_HIDE_HOME } = import.meta.env;

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/welcome",
  meta: {
    icon: "ep/home-filled",
    title: $t("menus.pureHome"),
    rank: home
  },
  children: [
    {
      path: "/welcome",
      name: "Welcome",
      component: () => import("@/views/welcome/index.vue"),
      meta: {
        title: $t("menus.pureHome"),
        showLink: VITE_HIDE_HOME === "true" ? false : true,
        hideLayActions: true // 首页不显示筛选按钮
      }
    }
  ]
} satisfies RouteConfigsTable;
