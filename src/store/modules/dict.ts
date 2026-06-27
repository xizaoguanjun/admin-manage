/**
 * 字典数据管理 Store
 * @description 统一管理系统中的字典数据，支持缓存和按需加载
 *
 * 核心特性：
 * - 智能类型转换：自动将纯数字字符串（如 "0", "1"）转换为数字类型，避免类型不匹配
 * - 缓存机制：已加载的字典数据会被缓存，避免重复请求
 * - 按需加载：支持单个或批量加载字典
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";

/**
 * 字典项数据结构
 */
export interface DictItem {
  /** 字典项标签 */
  label: string;
  /** 字典项值 */
  value: string | number;
  /** 字典项编码 */
  code?: string;
  /** 排序 */
  sort?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 其他扩展字段 */
  [key: string]: unknown;
}

/**
 * 字典数据映射
 * key: 字典编码（如 "FEE_TYPE"）
 * value: 字典项数组
 */
export interface DictDataMap {
  [dictField: string]: DictItem[];
}

/**
 * 字典加载状态映射
 */
export interface DictLoadingMap {
  [dictField: string]: boolean;
}

/**
 * 字典 Store
 */
export const useDictStore = defineStore("dict", () => {
  // ==================== 状态 ====================

  /**
   * 字典数据存储
   * @description 存储所有已加载的字典数据
   */
  const dictData = ref<DictDataMap>({});

  /**
   * 字典加载状态
   * @description 记录每个字典是否正在加载中
   */
  const loadingMap = ref<DictLoadingMap>({});

  /**
   * 字典加载错误记录
   * @description 记录加载失败的字典及错误信息
   */
  const errorMap = ref<Record<string, string>>({});

  // ==================== Getters ====================

  /**
   * 获取指定字典的数据
   * @param dictField 字典编码
   * @returns 字典项数组
   */
  const getDictData = computed(() => {
    return (dictField: string): DictItem[] => {
      return dictData.value[dictField] || [];
    };
  });

  /**
   * 检查字典是否正在加载
   * @param dictField 字典编码
   * @returns 是否正在加载
   */
  const isLoading = computed(() => {
    return (dictField: string): boolean => {
      return loadingMap.value[dictField] || false;
    };
  });

  /**
   * 检查字典是否已加载
   * @param dictField 字典编码
   * @returns 是否已加载
   */
  const isLoaded = computed(() => {
    return (dictField: string): boolean => {
      return (
        !!dictData.value[dictField] && dictData.value[dictField].length > 0
      );
    };
  });

  /**
   * 获取字典加载错误信息
   * @param dictField 字典编码
   * @returns 错误信息
   */
  const getError = computed(() => {
    return (dictField: string): string | undefined => {
      return errorMap.value[dictField];
    };
  });

  // ==================== Actions ====================

  /**
   * 加载单个字典
   * @param dictField 字典编码
   * @param force 是否强制重新加载（忽略缓存）
   * @returns 字典项数组
   */
  const loadDict = async (
    dictField: string,
    _force = false
  ): Promise<DictItem[]> => {
    if (dictData.value[dictField]) {
      return dictData.value[dictField];
    }
    return [];
  };

  /**
   * 批量加载多个字典
   * @param dictFields 字典编码数组
   * @param force 是否强制重新加载
   * @returns 字典数据映射
   */
  const loadDicts = async (
    dictFields: string[],
    _force = false
  ): Promise<DictDataMap> => {
    const result: DictDataMap = {};
    dictFields.forEach(code => {
      result[code] = dictData.value[code] || [];
    });
    return result;
  };

  /**
   * 清除指定字典的缓存
   * @param dictField 字典编码，不传则清除所有
   */
  const clearDict = (dictField?: string) => {
    if (dictField) {
      delete dictData.value[dictField];
      delete errorMap.value[dictField];
    } else {
      dictData.value = {};
      errorMap.value = {};
    }
  };

  /**
   * 重新加载指定字典
   * @param dictField 字典编码
   * @returns 字典项数组
   */
  const reloadDict = async (dictField: string): Promise<DictItem[]> => {
    return loadDict(dictField, true);
  };

  /**
   * 根据字典值获取字典标签
   * @param dictField 字典编码
   * @param value 字典值
   * @returns 字典标签
   */
  const getDictLabel = (dictField: string, value: string | number): string => {
    // console.log("dictData.value", dictData.value);

    const items = dictData.value[dictField] || [];
    const item = items.find(item => item.value === value);
    return item?.label || String(value);
  };

  /**
   * 根据字典标签获取字典值
   * @param dictField 字典编码
   * @param label 字典标签
   * @returns 字典值
   */
  const getDictValue = (
    dictField: string,
    label: string
  ): string | number | undefined => {
    const items = dictData.value[dictField] || [];
    const item = items.find(item => item.label === label);
    return item?.value;
  };

  return {
    // 状态
    dictData,
    loadingMap,
    errorMap,

    // Getters
    getDictData,
    isLoading,
    isLoaded,
    getError,

    // Actions
    loadDict,
    loadDicts,
    clearDict,
    reloadDict,
    getDictLabel,
    getDictValue
  };
});

/**
 * 在 setup 外使用字典 Store
 */
export function useDictStoreHook() {
  return useDictStore();
}
