import { $t } from "@/plugins/i18n";
import { Layout } from "@/router/layout";

export default {
  path: "/file",
  name: "File",
  component: Layout,
  redirect: "/file/list",
  meta: {
    icon: "ep/folder",
    title: $t("menus.fileManagement"),
    rank: 20
  },
  children: [
    {
      path: "/file/list",
      name: "FileList",
      component: () => import("@/views/file/index.vue"),
      meta: {
        icon: "ep/folder",
        title: $t("menus.fileManagement"),
        showLink: true
      }
    }
  ]
};
