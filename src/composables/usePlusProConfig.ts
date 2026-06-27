import { inject, provide, type InjectionKey } from "vue";
// import type { PlusFormProps } from "yc-pro-components";

/**
 * Plus Pro Components 全局表单配置接口
 */
export interface PlusProFormConfig {
  /** 标签宽度 */
  labelWidth?: string;
  /** 标签后缀（冒号） */
  labelSuffix?: string;
  /** 标签位置 */
  labelPosition?: "left" | "right" | "top";
  /** 表单项之间的间距 */
  rowProps?: {
    gutter?: number;
  };
}

/**
 * Plus Pro Components 全局配置
 */
export interface PlusProGlobalConfig {
  /** PlusDialogForm 默认配置 */
  dialogForm: PlusProFormConfig;
  /** PlusDrawerForm 默认配置 */
  drawerForm: PlusProFormConfig;
}

/**
 * 注入键
 */
const PLUS_PRO_CONFIG_KEY: InjectionKey<PlusProGlobalConfig> =
  Symbol("plusProConfig");

/**
 * 提供 Plus Pro Components 全局配置（在根组件中使用）
 */
export function providePlusProConfig() {
  const config: PlusProGlobalConfig = {
    // PlusDialogForm 默认配置
    dialogForm: {
      labelWidth: "140px",
      labelSuffix: "", // 移除冒号
      labelPosition: "right", // 标签靠右
      rowProps: { gutter: 20 }
    },
    // PlusDrawerForm 默认配置
    drawerForm: {
      labelWidth: "140px",
      labelSuffix: "", // 移除冒号
      labelPosition: "right", // 标签靠右
      rowProps: { gutter: 20 }
    }
  };

  provide(PLUS_PRO_CONFIG_KEY, config);
}

/**
 * 注入 Plus Pro Components 全局配置（在子组件中使用）
 * @returns Plus Pro Components 全局配置对象
 */
export function usePlusProConfig(): PlusProGlobalConfig {
  const config = inject(PLUS_PRO_CONFIG_KEY);

  if (!config) {
    // 如果没有提供全局配置，返回默认配置
    return {
      dialogForm: {
        labelWidth: "140px",
        labelSuffix: "",
        labelPosition: "right",
        rowProps: { gutter: 20 }
      },
      drawerForm: {
        labelWidth: "140px",
        labelSuffix: "",
        labelPosition: "right",
        rowProps: { gutter: 20 }
      }
    };
  }

  return config;
}

/**
 * 获取 PlusDialogForm 的默认配置
 */
export function useDialogFormConfig(): PlusProFormConfig {
  const config = usePlusProConfig();
  return config.dialogForm;
}

/**
 * 获取 PlusDrawerForm 的默认配置
 */
export function useDrawerFormConfig(): PlusProFormConfig {
  const config = usePlusProConfig();
  return config.drawerForm;
}
