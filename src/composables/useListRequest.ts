/**
 * 通用列表请求 Composable
 * @description 完全泛型化的列表接口请求封装，适配任何接口格式
 * @version 3.0.0
 * @author Alan
 */

import type { PageInfo } from "yc-pro-components";

type UnknownRecord = Record<string, unknown>;

// ==================== 类型定义 ====================

/**
 * 搜索字段配置
 * @description 定义每个搜索字段如何处理
 */
export interface FilterFieldConfig<T = unknown> {
  /** 值转换函数 */
  transform?: (value: unknown, allParams: UnknownRecord) => T;
  /** 条件判断函数 (返回 false 时跳过此字段) */
  condition?: (value: unknown, allParams: UnknownRecord) => boolean;
  /** 是否必需 (必需字段为空时不发送请求) */
  required?: boolean;
  /** 默认值 */
  defaultValue?: T;
}

/**
 * 分页参数配置
 * @description 定义如何构建分页参数
 */
export interface PaginationConfig<T = unknown> {
  /** 自定义分页参数构建函数 */
  builder?: (page: number, pageSize: number) => T;
  /** 或使用字段映射（简化版） */
  pageField?: string;
  pageSizeField?: string;
  /** 是否使用 offset/limit 模式 */
  useOffsetLimit?: boolean;
  offsetField?: string;
  limitField?: string;
}

/**
 * 参数构建器
 * @description 完全自定义如何构建请求参数
 */
export interface ParamsBuilder<TRequest = unknown, TSearch = UnknownRecord> {
  /**
   * 构建完整请求参数
   * @param searchParams 搜索参数（已处理）
   * @param page 页码
   * @param pageSize 每页条数
   * @param rawSearchParams 原始搜索参数（未处理）
   * @returns 请求参数
   */
  (
    searchParams: TSearch,
    page: number,
    pageSize: number,
    rawSearchParams: UnknownRecord
  ): TRequest | Promise<TRequest>;
}

/**
 * 响应数据转换器
 * @description 将后端响应转换为 PlusPage 期望的格式
 */
export interface ResponseTransformer<TResponse = unknown, TData = unknown> {
  /**
   * 从响应中提取数据列表
   */
  data: (response: TResponse) => TData[];
  /**
   * 从响应中提取总数
   */
  total: (response: TResponse) => number;
  /**
   * 从响应中判断是否成功（可选）
   */
  success?: (response: TResponse) => boolean;
}

/**
 * 请求钩子
 * @description 在请求的不同阶段执行自定义逻辑
 */
export interface ListRequestHooks<TRequest = unknown, TResponse = unknown> {
  /** 请求前钩子 (可修改请求参数) */
  beforeRequest?: (params: TRequest) => TRequest | Promise<TRequest>;
  /** 请求后钩子 (可处理响应数据) */
  afterRequest?: (
    response: TResponse,
    params: TRequest
  ) => TResponse | Promise<TResponse>;
  /** 错误处理钩子 (自定义错误处理) */
  onError?: (
    error: unknown,
    params: TRequest
  ) => TResponse | void | Promise<TResponse | void>;
}

/**
 * 列表请求选项
 * @description 完全泛型化，适配任何接口格式
 * @template TRequest 请求参数类型
 * @template TResponse 响应数据类型
 * @template TData 列表项数据类型
 * @template TSearch 搜索参数类型
 */
export interface UseListRequestOptions<
  TRequest = unknown,
  TResponse = unknown,
  TData = unknown,
  TSearch = UnknownRecord
> {
  /**
   * 搜索字段配置（简化模式）
   * 定义如何处理每个搜索字段
   */
  searchFields?: Record<string, FilterFieldConfig>;

  /**
   * 参数构建器（完全自定义模式）
   * 完全控制请求参数的构建逻辑
   */
  paramsBuilder?: ParamsBuilder<TRequest, TSearch>;

  /**
   * 分页参数配置
   */
  pagination?: PaginationConfig;

  /**
   * 响应数据转换器
   * 将后端响应转换为 PlusPage 期望的格式
   */
  transformer?: ResponseTransformer<TResponse, TData>;

  /**
   * 固定参数（会合并到每次请求中）
   */
  staticParams?: UnknownRecord | ((searchParams: TSearch) => UnknownRecord);

  /**
   * 请求钩子
   */
  hooks?: ListRequestHooks<TRequest, TResponse>;

  /**
   * 是否启用调试日志
   */
  enableLog?: boolean;

  /**
   * 必需字段列表
   */
  requiredFields?: string[];
}

// ==================== 工具函数 ====================

/**
 * 判断值是否为空
 */
function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * 检查必需字段
 */
function checkRequiredFields(
  searchParams: UnknownRecord,
  requiredFields?: string[],
  searchFields?: Record<string, FilterFieldConfig>
): string[] {
  const missing: string[] = [];

  // 检查显式声明的必需字段
  if (requiredFields) {
    for (const field of requiredFields) {
      if (isEmpty(searchParams[field])) {
        missing.push(field);
      }
    }
  }

  // 检查字段配置中标记为 required 的字段
  if (searchFields) {
    for (const [key, config] of Object.entries(searchFields)) {
      if (config.required && isEmpty(searchParams[key])) {
        missing.push(key);
      }
    }
  }

  return missing;
}

/**
 * 处理搜索参数
 */
function processSearchParams<T = UnknownRecord>(
  rawParams: UnknownRecord,
  searchFields?: Record<string, FilterFieldConfig>
): T {
  if (!searchFields) {
    return rawParams as T;
  }

  const processed: UnknownRecord = {};

  for (const [key, value] of Object.entries(rawParams)) {
    const config = searchFields[key];

    // 没有配置则直接使用原值
    if (!config) {
      processed[key] = value;
      continue;
    }

    // 跳过空值（除非有默认值）
    if (isEmpty(value)) {
      if (config.defaultValue !== undefined) {
        processed[key] = config.defaultValue;
      }
      continue;
    }

    // 条件判断
    if (config.condition && !config.condition(value, rawParams)) {
      continue;
    }

    // 值转换
    processed[key] = config.transform
      ? config.transform(value, rawParams)
      : value;
  }

  return processed as T;
}

/**
 * 构建分页参数
 */
function buildPaginationParams(
  page: number,
  pageSize: number,
  config?: PaginationConfig
): UnknownRecord {
  // 自定义构建器优先
  if (config?.builder) {
    return config.builder(page, pageSize) as UnknownRecord;
  }

  // offset/limit 模式
  if (config?.useOffsetLimit) {
    return {
      [config.offsetField || "offset"]: (page - 1) * pageSize,
      [config.limitField || "limit"]: pageSize
    };
  }

  // page/pageSize 模式（默认）
  return {
    [config?.pageField || "page"]: page,
    [config?.pageSizeField || "pageSize"]: pageSize
  };
}

/**
 * 解析静态参数
 */
function resolveStaticParams<T = UnknownRecord>(
  staticParams:
    | UnknownRecord
    | ((searchParams: T) => UnknownRecord)
    | undefined,
  searchParams: T
): UnknownRecord {
  if (!staticParams) {
    return {};
  }

  if (typeof staticParams === "function") {
    return staticParams(searchParams);
  }

  return staticParams;
}

/**
 * 日志输出
 */
function log(enableLog: boolean, type: string, ...args: unknown[]) {
  if (!enableLog) return;

  const emoji =
    {
      info: "📥",
      warn: "⚠️",
      error: "❌",
      success: "✅",
      filter: "🔍",
      request: "📤",
      response: "📨"
    }[type] || "ℹ️";

  console.log(`${emoji} [useListRequest]`, ...args);
}

// ==================== 主函数 ====================

/**
 * 通用列表请求 Hook
 * @description 完全泛型化，适配任何接口格式
 *
 * @template TRequest 请求参数类型
 * @template TResponse 后端响应类型
 * @template TData 列表项数据类型
 * @template TSearch 处理后的搜索参数类型
 *
 * @param apiFunction API 请求函数
 * @param options 配置选项
 *
 * @example
 * // 示例1: 使用参数构建器（完全自定义）
 * const getList = useListRequest(getUserListApi, {
 *   paramsBuilder: (searchParams, page, pageSize) => ({
 *     filters: { name: searchParams.name },
 *     page,
 *     size: pageSize
 *   }),
 *   transformer: {
 *     data: (res) => res.data.list,
 *     total: (res) => res.data.total
 *   }
 * });
 *
 * // 示例2: 使用搜索字段配置（简化模式）
 * const getList = useListRequest(getEmployeeListApi, {
 *   searchFields: {
 *     name: { transform: (v) => `%${v}%` },
 *     age: { transform: (v) => Number(v), condition: (v) => v > 0 }
 *   },
 *   pagination: { useOffsetLimit: true },
 *   transformer: {
 *     data: (res) => res.result,
 *     total: (res) => res.total
 *   }
 * });
 */
export function useListRequest<
  TRequest extends UnknownRecord = UnknownRecord,
  TResponse = UnknownRecord,
  TData = UnknownRecord,
  TSearch extends UnknownRecord = UnknownRecord
>(
  apiFunction: (params: TRequest) => Promise<TResponse>,
  options: UseListRequestOptions<TRequest, TResponse, TData, TSearch> = {}
) {
  const {
    searchFields,
    paramsBuilder,
    pagination,
    transformer,
    staticParams,
    hooks = {},
    enableLog = false,
    requiredFields
  } = options;

  /**
   * 列表请求函数
   * @description PlusPage 会自动调用此函数
   */
  return async function request(
    query: PageInfo & UnknownRecord
  ): Promise<{ data: TData[]; total: number; success?: boolean }> {
    try {
      // 步骤1: 解析查询参数
      const { page = 1, pageSize = 20, ...rawSearchParams } = query || {};
      log(enableLog, "info", "接收参数:", { page, pageSize, rawSearchParams });

      // 步骤2: 检查必需字段
      const missingFields = checkRequiredFields(
        rawSearchParams,
        requiredFields,
        searchFields
      );
      if (missingFields.length > 0) {
        log(enableLog, "warn", "缺少必需字段:", missingFields);
        return { data: [], total: 0, success: false };
      }

      // 步骤3: 处理搜索参数
      const processedSearchParams = processSearchParams<TSearch>(
        rawSearchParams,
        searchFields
      );
      log(enableLog, "filter", "处理后的搜索参数:", processedSearchParams);

      // 步骤4: 构建请求参数
      let requestParams: TRequest;

      if (paramsBuilder) {
        // 使用自定义参数构建器
        requestParams = (await paramsBuilder(
          processedSearchParams,
          page,
          pageSize,
          rawSearchParams as UnknownRecord
        )) as unknown as TRequest;
      } else {
        // 默认构建方式：合并搜索参数、分页参数、静态参数
        const paginationParams = buildPaginationParams(
          page,
          pageSize,
          pagination
        );
        const staticParamsResolved = resolveStaticParams(
          staticParams,
          processedSearchParams
        );

        const merged: UnknownRecord = {
          ...(processedSearchParams as UnknownRecord),
          ...paginationParams,
          ...staticParamsResolved
        };

        requestParams = merged as unknown as TRequest;
      }

      log(enableLog, "request", "请求参数:", requestParams);

      // 步骤5: 请求前钩子
      if (hooks.beforeRequest) {
        requestParams = await hooks.beforeRequest(requestParams);
        log(enableLog, "success", "beforeRequest 处理后:", requestParams);
      }

      // 步骤6: 调用接口
      let response = await apiFunction(requestParams);
      log(enableLog, "response", "API 响应:", response);

      // 步骤7: 请求后钩子
      if (hooks.afterRequest) {
        response = await hooks.afterRequest(response, requestParams);
        log(enableLog, "success", "afterRequest 处理后:", response);
      }

      // 步骤8: 转换响应数据
      if (transformer) {
        const result = {
          data: transformer.data(response),
          total: transformer.total(response),
          success: transformer.success ? transformer.success(response) : true
        };
        log(enableLog, "success", "转换后的数据:", result);
        return result;
      }

      // 如果没有提供 transformer，尝试按约定结构返回，否则兜底空数据
      const respObj = response as unknown as {
        data?: unknown;
        total?: unknown;
        success?: boolean;
      };
      const dataMaybe = respObj?.data;
      const totalMaybe = respObj?.total;

      if (Array.isArray(dataMaybe) && typeof totalMaybe === "number") {
        return {
          data: dataMaybe as TData[],
          total: totalMaybe,
          success: respObj.success
        };
      }

      return {
        data: Array.isArray(dataMaybe) ? (dataMaybe as TData[]) : [],
        total: typeof totalMaybe === "number" ? totalMaybe : 0,
        success: respObj.success
      };
    } catch (error: unknown) {
      log(enableLog, "error", "请求失败:", error);

      // 错误钩子
      if (hooks.onError) {
        const errorResult = await hooks.onError(error, {} as TRequest);
        if (errorResult) {
          return errorResult as unknown as {
            data: TData[];
            total: number;
            success?: boolean;
          };
        }
      }

      // 默认错误处理
      console.error("获取列表数据失败:", error);
      return { data: [], total: 0, success: false };
    }
  };
}
