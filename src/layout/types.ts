import type { FunctionalComponent, Component } from "vue";
import type {
  LocationQueryRaw,
  RouteParamsRawGeneric,
  RouteLocationRaw,
  RouteLocationNormalized
} from "vue-router";
const { VITE_HIDE_HOME } = import.meta.env;

export const routerArrays: Array<RouteConfigs> =
  VITE_HIDE_HOME === "false"
    ? [
        {
          path: "/welcome",
          name: "Welcome",
          meta: {
            title: "menus.pureHome",
            icon: "ep/home-filled"
          }
        }
      ]
    : [];

export type routeMetaType = {
  title?: string;
  icon?: string | FunctionalComponent | Component;
  showLink?: boolean;
  savedPosition?: boolean;
  auths?: Array<string>;
  fixedTag?: boolean;
  [key: string]: unknown;
};

export type RouteConfigs = {
  path: string;
  query?: LocationQueryRaw;
  params?: RouteParamsRawGeneric;
  meta?: routeMetaType;
  children?: RouteConfigs[];
  name?: string;
};

export type multiTagsType = {
  tags: Array<RouteConfigs>;
};

export type tagsViewsType = {
  icon: string | FunctionalComponent | Component;
  text: string;
  divided: boolean;
  disabled: boolean;
  show: boolean;
};

export interface setType {
  sidebar: {
    opened: boolean;
    withoutAnimation: boolean;
    isClickCollapse: boolean;
  };
  device: string;
  fixedHeader: boolean;
  classes: {
    hideSidebar: boolean;
    openSidebar: boolean;
    withoutAnimation: boolean;
    mobile: boolean;
  };
  hideTabs: boolean;
}

export type menuType = {
  id?: number;
  name?: string | symbol;
  path?: string;
  noShowingChildren?: boolean;
  children?: menuType[];
  value?: unknown;
  meta?: {
    icon?: string | FunctionalComponent | Component;
    title?: string;
    rank?: number;
    showParent?: boolean;
    extraIcon?: string | FunctionalComponent | Component;
    fixedTag?: boolean;
    [key: string]: unknown;
  };
  showTooltip?: boolean;
  parentId?: number;
  pathList?: number[];
  redirect?:
    | string
    | RouteLocationRaw
    | ((
        to: RouteLocationNormalized,
        from: RouteLocationNormalized
      ) => RouteLocationRaw);
  component?: unknown;
  [key: string]: unknown;
};

export type themeColorsType = {
  color: string;
  themeColor: string;
};

export interface scrollbarDomType extends HTMLElement {
  wrap?: {
    offsetWidth: number;
  };
}
