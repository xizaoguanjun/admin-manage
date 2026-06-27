/**
 * 头部筛选查询参数处理 Hook
 * @description 统一处理 RePlusPage 头部筛选传入的查询参数，
 *              将 filters 结构转换为扁平的键值对格式，方便与现有 API 配合使用
 * @author Alan
 * @date 2025-12-24
 *
 * @example
 * ```ts
 * // 基础用法
 * const { mergeHeaderFilterQuery } = useHeaderFilterQuery();
 *
 * const getTableData = async (query?: Record<string, unknown>) => {
 *   const mergedParams = mergeHeaderFilterQuery(baseParams, query);
 *   const response = await api.getList(mergedParams);
 *   return response;
 * };
 *
 * // 带自定义转换器
 * const { mergeHeaderFilterQuery } = useHeaderFilterQuery({
 *   // 字段名映射：将 header filter 的字段名转换为 API 需要的字段名
 *   fieldMapping: {
 *     subject: 'subjectName',
 *     status: 'costStatus'
 *   },
 *   // 排除不需要的字段
 *   excludeFields: ['page', 'pageSize', 'offset', 'limit']
 * });
 * ```
 */

/**
 * 头部筛选条件项类型
 */
interface HeaderFilterItem {
  field: string;
  op: string;
  value: unknown;
}

/**
 * 头部筛选 filters 结构类型
 */
interface HeaderFilters {
  logic: "and" | "or";
  filters: HeaderFilterItem[];
}

/**
 * Hook 配置选项
 */
interface UseHeaderFilterQueryOptions {
  /**
   * 字段名映射
   * @description 将头部筛选的字段名转换为 API 需要的字段名
   * @example { subject: 'subjectName', status: 'costStatus' }
   */
  fieldMapping?: Record<string, string>;

  /**
   * 排除的字段列表
   * @description 这些字段不会被合并到查询参数中
   * @default ['page', 'pageSize', 'offset', 'limit']
   */
  excludeFields?: string[];

  /**
   * 值转换器
   * @description 对特定字段的值进行转换处理
   * @example { status: (val) => Number(val) }
   */
  valueTransformers?: Record<string, (value: unknown) => unknown>;
}

/**
 * 默认排除的字段
 */
const DEFAULT_EXCLUDE_FIELDS = ["page", "pageSize", "offset", "limit"];

/**
 * 头部筛选查询参数处理 Hook
 * @param options 配置选项
 */
export function useHeaderFilterQuery(
  options: UseHeaderFilterQueryOptions = {}
) {
  const {
    fieldMapping = {},
    excludeFields = DEFAULT_EXCLUDE_FIELDS,
    valueTransformers = {}
  } = options;

  /**
   * 从头部筛选参数中提取扁平的键值对
   * @param headerQuery RePlusPage 传入的查询参数
   * @returns 扁平的键值对对象
   */
  const extractFilterParams = (
    headerQuery?: Record<string, unknown>
  ): Record<string, unknown> => {
    if (!headerQuery) return {};

    const result: Record<string, unknown> = {};

    // 遍历所有参数
    for (const [key, value] of Object.entries(headerQuery)) {
      // 跳过排除的字段
      if (excludeFields.includes(key)) continue;

      // 特殊处理 filters 对象
      if (key === "filters" && isHeaderFilters(value)) {
        // 从 filters 数组中提取每个条件
        value.filters.forEach((filter: HeaderFilterItem) => {
          if (
            filter.field &&
            filter.value !== undefined &&
            filter.value !== null
          ) {
            // 应用字段名映射
            const mappedField = fieldMapping[filter.field] || filter.field;
            // 应用值转换器
            const transformer = valueTransformers[filter.field];
            const finalValue = transformer
              ? transformer(filter.value)
              : filter.value;
            result[mappedField] = finalValue;
          }
        });
      } else if (value !== undefined && value !== null && value !== "") {
        // 普通字段：应用字段名映射
        const mappedField = fieldMapping[key] || key;
        // 应用值转换器
        const transformer = valueTransformers[key];
        const finalValue = transformer ? transformer(value) : value;
        result[mappedField] = finalValue;
      }
    }

    return result;
  };

  /**
   * 合并基础查询参数和头部筛选参数
   * @param baseParams 基础查询参数（如来自 props 或 state 的参数）
   * @param headerQuery RePlusPage 传入的头部筛选参数
   * @returns 合并后的查询参数
   */
  const mergeHeaderFilterQuery = <T extends Record<string, unknown>>(
    baseParams: T | null | undefined,
    headerQuery?: Record<string, unknown>
  ): T => {
    // 如果没有基础参数，返回空对象或提取的筛选参数
    if (!baseParams) {
      return extractFilterParams(headerQuery) as T;
    }

    // 提取头部筛选参数
    const filterParams = extractFilterParams(headerQuery);

    // 合并参数（头部筛选参数会覆盖基础参数中的同名字段）
    return {
      ...baseParams,
      ...filterParams
    } as T;
  };

  /**
   * 创建一个包装后的请求函数
   * @description 自动处理头部筛选参数，简化 request 函数的编写
   * @param baseFetcher 基础请求函数
   * @param getBaseParams 获取基础参数的函数
   * @returns 包装后的请求函数，可直接用于 RePlusPage 的 request prop
   *
   * @example
   * ```ts
   * const { createRequest } = useHeaderFilterQuery();
   *
   * // 创建包装后的请求函数
   * const getTableData = createRequest(
   *   (params) => api.getList(params),
   *   () => receivableQuery.value
   * );
   *
   * // 在 RePlusPage 中使用
   * <RePlusPage :request="getTableData" />
   * ```
   */
  const createRequest = <TParams extends Record<string, unknown>, TResult>(
    baseFetcher: (params: TParams) => Promise<TResult>,
    getBaseParams: () => TParams | null | undefined
  ) => {
    return async (headerQuery?: Record<string, unknown>): Promise<TResult> => {
      const baseParams = getBaseParams();
      const mergedParams = mergeHeaderFilterQuery(baseParams, headerQuery);
      return baseFetcher(mergedParams as TParams);
    };
  };

  return {
    /**
     * 从头部筛选参数中提取扁平的键值对
     */
    extractFilterParams,

    /**
     * 合并基础查询参数和头部筛选参数
     */
    mergeHeaderFilterQuery,

    /**
     * 创建包装后的请求函数
     */
    createRequest
  };
}

/**
 * 类型守卫：判断是否为有效的 HeaderFilters 对象
 */
function isHeaderFilters(value: unknown): value is HeaderFilters {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return "logic" in obj && "filters" in obj && Array.isArray(obj.filters);
}

export type { HeaderFilterItem, HeaderFilters, UseHeaderFilterQueryOptions };
