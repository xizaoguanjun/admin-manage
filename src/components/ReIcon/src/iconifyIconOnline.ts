import { h, defineComponent, type Component } from "vue";
import { getIconComponent, hasIcon } from "./offlineIcon";

// 默认图标尺寸
const DEFAULT_ICON_SIZE = "16px";

/**
 * 合并样式，支持字符串和对象两种格式
 */
function mergeStyles(
  defaultStyle: Record<string, string>,
  userStyle: unknown
): Record<string, string> | string {
  if (!userStyle) return defaultStyle;

  // 如果用户样式是字符串，拼接
  if (typeof userStyle === "string") {
    const defaultStyleStr = Object.entries(defaultStyle)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ");
    return `${defaultStyleStr}; ${userStyle}`;
  }

  // 如果用户样式是对象，合并
  if (typeof userStyle === "object") {
    return { ...defaultStyle, ...(userStyle as Record<string, string>) };
  }

  return defaultStyle;
}

// 在线图标组件
// 注意：已移除 @iconify/vue 依赖，现在使用本地 Element Plus Icons
// 如果需要在线图标功能，可以考虑使用 CDN SVG 方案
export default defineComponent({
  name: "IconifyIconOnline",
  props: {
    icon: {
      type: String,
      default: ""
    }
  },
  render() {
    const attrs = this.$attrs;
    const { style: userStyle, ...restAttrs } = attrs;

    // 合并默认尺寸和用户传入的样式
    const mergedStyle = mergeStyles(
      { width: DEFAULT_ICON_SIZE, height: DEFAULT_ICON_SIZE, outline: "none" },
      userStyle
    );

    // 尝试从本地映射表获取图标
    if (this.icon && hasIcon(this.icon)) {
      const IconComponent = getIconComponent(this.icon);
      if (IconComponent) {
        return h(
          IconComponent as Component,
          {
            "aria-hidden": false,
            width: DEFAULT_ICON_SIZE,
            height: DEFAULT_ICON_SIZE,
            style: mergedStyle,
            ...restAttrs
          },
          {
            default: () => []
          }
        );
      }
    }

    // 如果图标名称包含 ":"，可能是 iconify 格式的在线图标
    // 由于已移除 @iconify/vue，这里返回 null
    // 建议将这类图标迁移到 CDN SVG 或 Element Plus Icons
    if (this.icon && this.icon.includes(":")) {
      console.warn(
        `[IconifyIconOnline] 在线图标 "${this.icon}" 不再支持，请迁移到 Element Plus Icons 或 CDN SVG`
      );
    }

    return null;
  }
});
