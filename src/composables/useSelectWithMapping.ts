/**
 * 通用分页选择器 Hook（带数据映射）
 * @description 封装分页搜索 API 调用逻辑，支持自定义 label/value 映射
 * 统一返回 { label, value, rawData } 格式给下拉组件使用
 *
 * 本文件为纯通用 Hook，不涉及任何业务接口
 */

import { ref, type Ref } from "vue";
import type { LoadMoreFunction, LoadMoreParams } from "yc-pro-components";

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 选项数据类型（统一返回格式）
 * 继承 SelectOption 的索引签名以保持兼容性
 */
export interface MappedOption<T = Record<string, unknown>> {
  /** 显示文本 */
  label: string;
  /** 选项值 */
  value: string | number;
  /** 原始数据 */
  rawData: T;
  /** 索引签名（兼容 SelectOption） */
  [key: string]: unknown;
}

/**
 * 数据转换配置
 */
export interface TransformConfig<T> {
  /**
   * label 映射
   * - string: 字段名
   * - function: 自定义格式化函数
   */
  label: keyof T | ((item: T) => string);

  /**
   * value 映射
   * - string: 字段名
   * - function: 自定义格式化函数
   */
  value: keyof T | ((item: T) => string | number);
}

/**
 * API 响应类型（通用）
 */
export interface ApiResponseLike<T = unknown> {
  data?: {
    result?: T[];
    total?: number;
  };
  code?: string;
}

/**
 * Hook 配置项
 */
export interface UseSelectWithMappingConfig<T = Record<string, unknown>> {
  /**
   * API 调用函数
   * @param params 请求参数
   * @returns Promise
   */
  apiFn: (params: {
    keyword: string;
    pageSize: number;
    offset: number;
  }) => Promise<ApiResponseLike<T>>;

  /**
   * 数据转换配置（label/value 映射）
   */
  transform: TransformConfig<T>;

  /**
   * 响应数据路径配置
   */
  dataPath?: {
    /** 列表数据路径，默认 'result' (相对于 data) */
    list?: string;
    /** 总数路径，默认 'total' (相对于 data) */
    total?: string;
  };

  /**
   * 是否在无关键词时返回空列表
   * @default true
   */
  requireKeyword?: boolean;
}

/**
 * Hook 返回值
 */
export interface UseSelectWithMappingReturn<T = Record<string, unknown>> {
  /** 分页加载函数（用于 ReSelectV2 组件） */
  loadMore: LoadMoreFunction;
  /** 数据映射（通过 value 查找原始数据） */
  dataMap: Ref<Map<string | number, MappedOption<T>>>;
  /** 根据 value 获取原始数据 */
  getRawData: (value: string | number) => T | undefined;
  /** 根据 value 获取完整选项 */
  getOption: (value: string | number) => MappedOption<T> | undefined;
  /** 清空数据映射 */
  clearDataMap: () => void;
  /** 加载状态 */
  loading: Ref<boolean>;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 从对象中提取嵌套路径的值
 */
const getNestedValue = (obj: unknown, path: string): unknown => {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return value;
};

/**
 * 获取映射值
 */
const getMappedValue = <T, R>(
  item: T,
  mapper: keyof T | ((item: T) => R)
): R => {
  if (typeof mapper === "function") {
    return mapper(item);
  }
  return item[mapper] as R;
};

// ============================================================================
// 通用 Hook
// ============================================================================

/**
 * 通用分页选择器 Hook（带数据映射）
 *
 * @description 封装分页搜索 API 调用逻辑，支持自定义 label/value 映射
 * 统一返回 { label, value, rawData } 格式给下拉组件使用
 *
 * @param config 配置项
 * @returns 返回 loadMore 函数和数据映射
 *
 * @example
 * ```ts
 * // 基础用法：使用字段名映射
 * const { loadMore, getRawData } = useSelectWithMapping({
 *   apiFn: ({ keyword, pageSize, offset }) =>
 *     mySearchApi(keyword, pageSize, offset),
 *   transform: {
 *     label: 'name',  // 使用 name 字段作为 label
 *     value: 'id'     // 使用 id 字段作为 value
 *   }
 * });
 * ```
 *
 * @example
 * ```ts
 * // 高级用法：使用函数自定义格式
 * const { loadMore, getRawData } = useSelectWithMapping({
 *   apiFn: ({ keyword, pageSize, offset }) =>
 *     searchApi(keyword, pageSize, offset),
 *   transform: {
 *     label: (item) => `${item.name} (${item.code})`,
 *     value: (item) => item.id
 *   }
 * });
 * ```
 *
 * @example
 * ```ts
 * // 在模板中使用
 * <ReSelectV2
 *   v-model="selectedValue"
 *   :load-more="loadMore"
 *   :page-size="20"
 *   search-mode="remote"
 *   placeholder="请搜索"
 *   @change="(val) => console.log(getRawData(val))"
 * />
 * ```
 */
export function useSelectWithMapping<T = Record<string, unknown>>(
  config: UseSelectWithMappingConfig<T>
): UseSelectWithMappingReturn<T> {
  const { apiFn, transform, dataPath = {}, requireKeyword = true } = config;

  const listPath = dataPath.list || "result";

  // 状态管理
  const loading = ref(false);
  const dataMap = ref<Map<string | number, MappedOption<T>>>(new Map()) as Ref<
    Map<string | number, MappedOption<T>>
  >;

  /**
   * 分页加载函数
   */
  const loadMore: LoadMoreFunction = async (params: LoadMoreParams) => {
    const { page, pageSize, keyword } = params;

    // 如果需要关键词但没有提供，返回空列表
    if (requireKeyword && (!keyword || !keyword.trim())) {
      return {
        list: [],
        total: 0,
        hasMore: false
      };
    }

    // 防止重复加载
    if (loading.value) {
      return {
        list: [],
        total: 0,
        hasMore: false
      };
    }

    try {
      loading.value = true;

      // 计算偏移量
      const offset = (page - 1) * pageSize;

      // 调用 API
      const response = await apiFn({
        keyword: keyword?.trim() || "",
        pageSize,
        offset
      });

      // 检查响应
      if (!response.data) {
        return { list: [], total: 0, hasMore: false };
      }

      // 提取列表/总数
      const resultList = (getNestedValue(response.data, listPath) || []) as T[];
      const totalValue = getNestedValue(
        response.data,
        dataPath.total || "total"
      );
      const total =
        typeof totalValue === "number" ? totalValue : resultList.length;

      // 转换数据
      const list: MappedOption<T>[] = resultList.map(item => {
        const label = String(getMappedValue<T, string>(item, transform.label));
        const value = getMappedValue<T, string | number>(item, transform.value);

        const option: MappedOption<T> = {
          label,
          value,
          rawData: item
        };

        // 保存到映射中（同时用 label 和 value 作为 key，方便查找）
        dataMap.value.set(value, option);
        dataMap.value.set(label, option);

        return option;
      });

      // 判断是否还有更多数据
      const hasMore = list.length >= pageSize;

      return {
        list,
        total,
        hasMore
      };
    } catch (error) {
      console.error("加载数据失败:", error);
      return {
        list: [],
        total: 0,
        hasMore: false
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根据 value 获取原始数据
   */
  const getRawData = (value: string | number): T | undefined => {
    return dataMap.value.get(value)?.rawData;
  };

  /**
   * 根据 value 获取完整选项
   */
  const getOption = (value: string | number): MappedOption<T> | undefined => {
    return dataMap.value.get(value);
  };

  /**
   * 清空数据映射
   */
  const clearDataMap = () => {
    dataMap.value.clear();
  };

  return {
    loadMore,
    dataMap,
    getRawData,
    getOption,
    clearDataMap,
    loading
  };
}
