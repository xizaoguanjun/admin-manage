import { h, defineComponent, type PropType, type Component } from "vue";
import { getIconComponent, hasIcon } from "./offlineIcon";

// 图标类型：可以是字符串（图标名称）或 Vue 组件
type IconType = string | Component;

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

// 本地图标组件（用于内网环境）
// 已从 @iconify/vue 迁移到 Element Plus Icons
export default defineComponent({
  name: "IconifyIconOffline",
  props: {
    icon: {
      type: [String, Object, Function] as PropType<IconType>,
      default: null
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

    // 如果 icon 是字符串，尝试从映射表获取组件
    if (typeof this.icon === "string") {
      // 检查是否在本地图标映射表中
      if (hasIcon(this.icon)) {
        const IconComponent = getIconComponent(this.icon);
        if (IconComponent) {
          return h(
            IconComponent,
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
      // 如果不在映射表中，返回空（或可以返回一个默认图标）
      return null;
    }

    // 如果 icon 是组件，直接渲染
    if (this.icon) {
      return h(
        this.icon as Component,
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

    return null;
  }
});
