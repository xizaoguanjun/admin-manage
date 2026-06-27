import { $t } from "@/plugins/i18n";
import { Layout } from "@/router/layout";

export default {
  path: "/user",
  name: "User",
  component: Layout,
  redirect: "/user/list",
  meta: {
    icon: "ep/user",
    title: $t("menus.userManagement"),
    rank: 10
  },
  children: [
    {
      path: "/user/list",
      name: "UserList",
      component: () => import("@/views/user/index.vue"),
      meta: {
        icon: "ep/user",
        title: $t("menus.userManagement"),
        showLink: true
      }
    }
  ]
};
