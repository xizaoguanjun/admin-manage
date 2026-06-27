import type { iconType } from "./types";
import { h, defineComponent, type Component } from "vue";
import { FontIcon, IconifyIconOnline, IconifyIconOffline } from "../index";
import { hasIcon, getIconComponent } from "./offlineIcon";
import { isString } from "lodash-es";

// 默认图标尺寸
const DEFAULT_ICON_SIZE = "16px";

/**
 * 获取带默认尺寸的样式
 */
function getIconStyle(attrs?: iconType) {
  return {
    width: DEFAULT_ICON_SIZE,
    height: DEFAULT_ICON_SIZE,
    ...attrs
  };
}

/**
 * 检测是否为 URL 图标（http/https 开头）
 */
function isUrlIcon(icon: string): boolean {
  return /^https?:\/\//i.test(icon);
}

/**
 * URL 图标组件 - 使用 img 标签直接加载
 * 由于跨域 CORS 限制，无法使用 CSS mask 技术
 * 图标颜色通过 CSS 类控制（需要后端配置 COS CORS 后才能使用 mask 变色）
 */
const UrlIconComponent = defineComponent({
  name: "UrlIcon",
  props: {
    src: { type: String, required: true },
    size: { type: Number, default: 20 }
  },
  render() {
    return h("img", {
      src: this.src,
      class: "url-menu-icon",
      style: {
        width: `${this.size}px`,
        height: `${this.size}px`,
        objectFit: "contain"
      },
      alt: "icon"
    });
  }
});

/**
 * 支持 `iconfont`、自定义 `svg`、`Element Plus Icons` 以及 `URL` 中所有的图标
 * @param icon 必传 图标
 * @param attrs 可选 iconType 属性
 * @returns Component
 */
export function useRenderIcon(
  icon: string | Component | Record<string, unknown>,
  attrs?: iconType
): Component | undefined {
  // iconfont
  const ifReg = /^IF-/;

  // URL 图标（http/https 开头）- 使用预定义组件避免闪烁
  if (isString(icon) && isUrlIcon(icon)) {
    const attrSize = attrs?.width || attrs?.height;
    const size = typeof attrSize === "number" ? attrSize : 20;
    return h(UrlIconComponent, { src: icon, size }) as unknown as Component;
  }

  // typeof icon === "function" 属于SVG
  if (isString(icon) && ifReg.test(icon)) {
    // iconfont
    const name = icon.split(ifReg)[1];
    const iconName = name.slice(
      0,
      name.indexOf(" ") == -1 ? name.length : name.indexOf(" ")
    );
    const iconType = name.slice(name.indexOf(" ") + 1, name.length);
    return defineComponent({
      name: "FontIcon",
      render() {
        return h(FontIcon, {
          icon: iconName,
          iconType,
          ...attrs
        });
      }
    });
  } else if (
    typeof icon === "function" ||
    typeof (icon as { render?: () => unknown })?.render === "function"
  ) {
    // svg 组件或 Vue 组件（包括 Element Plus Icons）
    const iconAttrs = getIconStyle(attrs);
    return h(icon as Component, iconAttrs) as unknown as Component;
  } else if (typeof icon === "object") {
    // 对象类型的图标（可能是 Vue 组件）
    return defineComponent({
      name: "OfflineIcon",
      render() {
        return h(IconifyIconOffline as Component, {
          icon,
          ...attrs
        });
      }
    });
  } else if (isString(icon)) {
    // 字符串类型的图标名称
    // 检查是否在本地图标映射表中（如 "ep/menu"、"ri/admin-fill"）
    if (hasIcon(icon)) {
      const IconComponent = getIconComponent(icon);
      if (IconComponent) {
        const iconAttrs = getIconStyle(attrs);
        return defineComponent({
          name: "LocalIcon",
          render() {
            return h(IconComponent as Component, iconAttrs);
          }
        });
      }
    }

    // 兼容旧的图标格式（包含 ":" 的 iconify 格式）
    // 尝试转换为新格式
    if (icon.includes(":")) {
      const [prefix, name] = icon.split(":");
      const newIconName = `${prefix}/${name}`;
      if (hasIcon(newIconName)) {
        const IconComponent = getIconComponent(newIconName);
        if (IconComponent) {
          const iconAttrs = getIconStyle(attrs);
          return defineComponent({
            name: "LocalIcon",
            render() {
              return h(IconComponent as Component, iconAttrs);
            }
          });
        }
      }
    }

    // 回退到 IconifyIconOnline/IconifyIconOffline 组件
    // 通过是否存在 : 符号来判断是在线还是本地图标
    return defineComponent({
      name: "Icon",
      render() {
        if (!icon) return null;
        const IconifyIcon = icon.includes(":")
          ? IconifyIconOnline
          : IconifyIconOffline;
        return h(IconifyIcon as Component, {
          icon,
          ...attrs
        });
      }
    });
  }

  return undefined;
}
