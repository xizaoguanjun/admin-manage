import type { LocationQueryRaw, LocationQueryValue } from "vue-router";
import router from "@/router";

type IndexObject = Record<string, unknown>;
type QueryObject = Record<string, LocationQueryValue | LocationQueryValue[]>;

/**
 * router query 参数处理
 */
function handleObject(val: string) {
  try {
    return JSON.parse(decodeURIComponent(val));
  } catch {
    return val;
  }
}

function handleNumber(val: string) {
  return Number(val);
}

function handleBoolean(val: string) {
  return Boolean(val);
}

function handleString(val: string) {
  return decodeURIComponent(val);
}

const strats: Record<stratsKey, (val: string) => unknown> = {
  object: handleObject,
  number: handleNumber,
  boolean: handleBoolean,
  string: handleString
};

type stratsKey = "object" | "number" | "boolean" | "string";

/**
 * 处理路由 query 参数，将字符串类型转换为对应的类型
 */
export function processRouterQueryParams<T = IndexObject>(
  origin: IndexObject
): T {
  const { query } = router.currentRoute.value;
  const newQuery: IndexObject = {};

  Object.keys(origin).forEach(key => {
    const val = query[key];
    if (!val) return;

    const targetType = typeof origin[key] as stratsKey;
    if (Array.isArray(val)) {
      const first = val[0];
      if (typeof first === "string") {
        newQuery[key] = strats[targetType](first);
      }
      return;
    }

    if (typeof val === "string") {
      newQuery[key] = strats[targetType](val);
    }
  });

  return Object.assign({}, origin, newQuery) as T;
}

/**
 * 更新路由 URL 的 query 参数
 * @param query 要更新的 query 参数对象，如果某个 key 的值为 undefined 或 null，则从 URL 中移除该参数
 */
export function updateRouteUrl(query: IndexObject = {}) {
  // 获取当前路由的所有 query 参数
  const currentQuery = { ...router.currentRoute.value.query };

  // 合并新的参数
  const mergedQuery: IndexObject = { ...currentQuery, ...query };

  // 移除值为 undefined 或 null 的参数
  Object.keys(mergedQuery).forEach(key => {
    if (mergedQuery[key] === undefined || mergedQuery[key] === null) {
      delete mergedQuery[key];
    }
  });

  // 调用 router.replace 路由重复时，报 Navigation Duplicated，添加时间戳避免
  mergedQuery.t = +new Date();

  // 编码中文并转换为 LocationQueryRaw 兼容类型
  const newQuery: QueryObject = {};
  Object.keys(mergedQuery).forEach(key => {
    const value = mergedQuery[key];
    if (typeof value === "object" && value !== null) {
      newQuery[key] = encodeURIComponent(JSON.stringify(value));
    } else {
      newQuery[key] = value ? encodeURIComponent(String(value)) : "";
    }
  });

  router.replace({
    name: router.currentRoute.value.name as string,
    query: newQuery as LocationQueryRaw
  });
}
