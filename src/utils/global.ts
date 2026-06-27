/**
 * 全局属性访问工具
 */

import { getCurrentInstance } from "vue";
import { useGlobalStore } from "@/store/modules/global";
import { isNil, omitBy } from "lodash-es";
import { type DataInfo, userKey } from "@/utils/auth";
import { json } from "stream/consumers";
/**
 * 获取全局属性（$storage 和 $config）
 */
export function useGlobal<T = GlobalPropertiesApi>(): T {
  const instance = getCurrentInstance();

  // 优先使用 globalProperties（向后兼容）
  if (instance?.appContext?.config?.globalProperties) {
    const globalProps = instance.appContext.config.globalProperties;
    if (globalProps.$storage && globalProps.$config) {
      return globalProps as T;
    }
  }

  // 使用 Pinia store
  const globalStore = useGlobalStore();

  return {
    $storage: globalStore.storage,
    $config: globalStore.config
  } as T;
}

/**
 * 从 localStorage 获取数据的辅助函数
 * 直接使用原生 localStorage API，避免 Pinia 依赖
 */
export function storageLocal() {
  return {
    getItem<T = unknown>(key: string): T | null {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    },
    setItem(key: string, value: unknown) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("Failed to set item in localStorage", e);
      }
    },
    removeItem(key: string) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    },
    clear() {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    }
  };
}

// 过滤空参数,处理列表删除参数再查下返回为空
export const handleFilteredParams = (params: Record<string, unknown>) => {
  return {
    ...omitBy(params, item => item === "" || isNil(item))
  };
};

/**
 * 从选项数组中根据值获取对应的标签
 * @param options 选项数组
 * @param value 要查找的值
 * @param config 配置选项
 * @returns 对应的标签，如果未找到则返回默认值
 * @example
 * const options = [{ label: '餐饮', value: '1' }, { label: '生鲜', value: '2' }];
 * getLabelByValue(options, '1'); // '餐饮'
 * getLabelByValue(options, '3'); // ''
 * getLabelByValue(options, '3', { defaultValue: '未知' }); // '未知'
 *
 * // 自定义字段名
 * const customOptions = [{ name: '餐饮', id: '1' }];
 * getLabelByValue(customOptions, '1', { valueKey: 'id', labelKey: 'name' }); // '餐饮'
 */
export function getLabelByValue<T extends Record<string, any>>(
  options: T[],
  value: any,
  config?: {
    /** 值字段名，默认为 'value' */
    valueKey?: string;
    /** 标签字段名，默认为 'label' */
    labelKey?: string;
    /** 未找到时的默认值，默认为空字符串 */
    defaultValue?: string;
  }
): string {
  const {
    valueKey = "value",
    labelKey = "label",
    defaultValue = ""
  } = config || {};
  const item = options.find(option => option[valueKey] === value);
  return item?.[labelKey] ?? defaultValue;
}

export function getKongTenantHeaderInfo() {
  const userInfo = storageLocal().getItem<DataInfo<number>>(userKey);
  const tenantInfo = {
    tenantId: userInfo?.tenantId,
    type: userInfo?.tenantId,
    accountType: userInfo?.accountType,
    userId: userInfo?.userId,
    userInfoId: userInfo?.userInfoId,
    id: userInfo?.id
  };
  return JSON.stringify(tenantInfo);
}
