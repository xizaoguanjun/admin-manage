/**
 * 分页选择器 Hooks
 * @description 用于管理 ReSelectV2 组件的分页加载和搜索功能
 * 维护 page、pageSize 状态，提供 loadMore 函数供组件使用
 */

import { ref, type Ref } from "vue";
import type { LoadMoreFunction, SelectOption } from "yc-pro-components";

type UnknownRecord = Record<string, unknown>;

/**
 * 分页加载配置
 */
export interface UseSelectWithPaginationConfig {
  /** API 调用函数 */
  apiFn: (
    searchParams: UnknownRecord,
    page: number,
    pageSize: number
  ) => Promise<unknown>;
  /** 搜索参数对象（固定参数，如 nodeType 等） */
  searchParams?: UnknownRecord;
  /** 每页数量 */
  pageSize?: number;
  /** 数据转换函数，将 API 返回的数据转换为 SelectOption 格式 */
  transform?: (item: unknown) => SelectOption;
  /** 响应数据路径（用于提取 result 和 total） */
  dataPath?: {
    list?: string; // 默认 'data.result'
    total?: string; // 默认 'data.total'
    code?: string; // 默认 'code'
  };
  /** 搜索字段名（用于 keyword 搜索，默认 'realShortName'） */
  searchField?: string;
}

/**
 * 使用分页选择器的返回值
 */
export interface UseSelectWithPaginationReturn {
  /** 分页加载函数（供 ReSelectV2 使用） */
  loadMore: LoadMoreFunction;
  /** 当前已加载的选项列表 */
  options: Ref<SelectOption[]>;
  /** 当前页码 */
  currentPage: Ref<number>;
  /** 是否还有更多数据 */
  hasMore: Ref<boolean>;
  /** 总数据量 */
  total: Ref<number>;
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 重新加载数据（重置页码） */
  reload: () => Promise<void>;
  /** 清空数据 */
  clear: () => void;
}

/**
 * 默认数据转换函数
 */
const defaultTransform = (item: unknown): SelectOption => {
  const record = (item ?? {}) as UnknownRecord;
  const value =
    (record.houseId as string | number | undefined) ??
    (record.value as string | number | undefined) ??
    (record.id as string | number | undefined) ??
    "";
  return {
    label: String(
      record.realShortName || record.label || record.name || value || ""
    ),
    value
  };
};

/**
 * 分页选择器 Hooks
 * @param config 配置项
 * @returns 返回 loadMore 函数和相关状态
 *
 * @example
 * ```ts
 * import { useSelectWithPagination } from "@/composables/useSelectWithPagination";
 * import { getHousePage } from "@/api/fee-manage";
 *
 * const {
 *   loadMore,
 *   options,
 *   reload
 * } = useSelectWithPagination({
 *   apiFn: getHousePage,
 *   searchParams: { nodeType: 1 },
 *   pageSize: 20,
 *   transform: (item) => ({
 *     label: item.realShortName,
 *     value: item.houseId
 *   })
 * });
 * ```
 */
export function useSelectWithPagination(
  config: UseSelectWithPaginationConfig
): UseSelectWithPaginationReturn {
  const {
    apiFn,
    searchParams = {} as Record<string, unknown>,
    pageSize = 5,
    transform = defaultTransform,
    dataPath = {},
    searchField = "realShortName"
  } = config;

  // 提取数据路径配置
  const listPath = dataPath.list || "data.result";
  const totalPath = dataPath.total || "data.total";
  const codePath = dataPath.code || "code";

  // 状态管理
  const currentPage = ref(1);
  const options = ref<SelectOption[]>([]);
  const hasMore = ref(true);
  const total = ref(0);
  const loading = ref(false);

  /**
   * 从响应对象中提取数据
   */
  const extractData = (response: unknown, path: string): unknown => {
    const keys = path.split(".");
    let value: unknown = response;
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
   * 分页加载函数
   */
  const loadMore: LoadMoreFunction = async ({
    page,
    pageSize: size,
    keyword
  }: {
    page: number;
    pageSize: number;
    keyword?: string;
  }) => {
    if (loading.value) {
      return {
        list: [],
        total: total.value,
        hasMore: hasMore.value
      };
    }

    try {
      loading.value = true;

      // 构建搜索参数
      const finalSearchParams: UnknownRecord = {
        ...searchParams,
        ...(keyword ? { [searchField]: keyword } : {})
      };

      // 调用 API
      const response = await apiFn(finalSearchParams, page, size);

      // 提取响应数据
      const code = extractData(response, codePath);
      const listData = (extractData(response, listPath) as unknown[]) || [];
      const totalData =
        (extractData(response, totalPath) as number | undefined) ||
        listData.length;

      if (code === "00000" || code === undefined) {
        // 转换数据格式
        const list = listData.map(item => transform(item));

        // 更新状态
        if (page === 1) {
          options.value = list;
        } else {
          options.value = [...options.value, ...list];
        }

        total.value = totalData;
        currentPage.value = page;

        // 检测是否为全量数据模式（requirePage: 0）
        // 当 requirePage 为 0 时，后端会一次性返回所有数据，无需分页加载
        const requirePage = (searchParams as { requirePage?: unknown })
          .requirePage;
        const isFullDataMode =
          typeof requirePage === "number" && requirePage === 0;
        if (isFullDataMode) {
          // 全量数据模式：第一页加载后直接设置 hasMore 为 false
          hasMore.value = false;
        } else {
          // 分页模式：根据 page * size < total 计算是否还有更多数据
          hasMore.value = page * size < total.value;
        }

        return {
          list,
          total: total.value,
          hasMore: hasMore.value
        };
      }

      // API 调用失败
      return {
        list: [],
        total: 0,
        hasMore: false
      };
    } catch (error) {
      console.error("分页加载失败:", error);
      return {
        list: [],
        total: total.value,
        hasMore: false
      };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重新加载数据（重置页码）
   */
  const reload = async () => {
    currentPage.value = 1;
    hasMore.value = true;
    options.value = [];
    total.value = 0;
    await loadMore({ page: 1, pageSize: pageSize });
  };

  /**
   * 清空数据
   */
  const clear = () => {
    currentPage.value = 1;
    hasMore.value = true;
    options.value = [];
    total.value = 0;
  };

  return {
    loadMore,
    options,
    currentPage,
    hasMore,
    total,
    loading,
    reload,
    clear
  };
}
