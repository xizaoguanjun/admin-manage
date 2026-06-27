import type { App } from "vue";

// 图标库组件（已迁移到 Element Plus Icons）
import {
  IconifyIconOffline,
  IconifyIconOnline,
  FontIcon
} from "@/components/ReIcon";

// 从 yc-components 导入组件
import {
  YcSvgIcon,
  YcAuth,
  YcPerms,
  YcCard,
  YcStatusDialog
} from "yc-pro-components";

/**
 * 全局注册自定义组件
 * @description 统一管理项目中需要全局注册的自定义组件
 */
export function useGlobalComponents(app: App) {
  // 全局注册图标组件（已迁移到 Element Plus Icons）
  app.component("IconifyIconOffline", IconifyIconOffline);
  app.component("IconifyIconOnline", IconifyIconOnline);
  app.component("FontIcon", FontIcon);

  // 从 yc-components 全局注册
  app.component("ReSvgIcon", YcSvgIcon); // 别名兼容
  app.component("YcSvgIcon", YcSvgIcon);

  // 全局注册按钮级别权限组件
  app.component("Auth", YcAuth);
  app.component("Perms", YcPerms);
  app.component("YcAuth", YcAuth);
  app.component("YcPerms", YcPerms);

  // 全局注册卡片组件
  app.component("ReCard", YcCard); // 别名兼容
  app.component("YcCard", YcCard);

  // 全局注册状态对话框组件
  app.component("ReStatusDialog", YcStatusDialog); // 别名兼容
  app.component("YcStatusDialog", YcStatusDialog);
}
