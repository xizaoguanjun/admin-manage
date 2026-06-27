declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // eslint-disable-next-line
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "*.scss" {
  const scss: Record<string, string>;
  export default scss;
}

/**
 * 图片资源模块声明
 */
declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.jpg" {
  const src: string;
  export default src;
}

declare module "*.jpeg" {
  const src: string;
  export default src;
}

declare module "*.gif" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.svg?component" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

declare module "vue3-puzzle-vcode";
declare module "vue-virtual-scroller";
declare module "vuedraggable/src/vuedraggable";
