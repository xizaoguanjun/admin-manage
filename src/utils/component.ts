/**
 * Vue 组件工具函数
 */

import type { App, Component } from "vue";

export type WithInstall<T> = T & {
  install(app: App): void;
};

/**
 * 为组件添加 install 方法，使其可以通过 app.use() 全局注册
 * @param component - Vue 组件
 * @returns 带有 install 方法的组件
 */
export function withInstall<T extends Component>(component: T): WithInstall<T> {
  const comp = component as WithInstall<T>;

  comp.install = (app: App) => {
    const name = comp.name || (comp as { __name?: string }).__name;
    if (name) {
      app.component(name, comp);
    }
  };

  return comp;
}
