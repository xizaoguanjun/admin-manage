import { isNil, isObject, isString } from "lodash-es";

/**
 * 判断是否为JSON字符串
 * @param {*} val 待检查的值
 * @returns {boolean} 如果值为 JSON 字符串则返回 `true`，否则返回 `false`
 */
export function isJSON(val: unknown) {
  if (typeof val == "string") {
    try {
      const obj = JSON.parse(val);
      if (typeof obj === "object" && obj) {
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  } else {
    return false;
  }
}

/**
 * 比较两个值是否相同
 * @param {*} newValue - 新值
 * @param {*} oldValue - 旧值
 * @returns {boolean} 如果两个值相同则返回 `true`，否则返回 `false`
 */
export function isSameValue(newValue: unknown, oldValue: unknown) {
  return JSON.stringify(newValue) === JSON.stringify(oldValue);
}

/**
 * 安全 JSON 序列化，报错时可返回默认值
 * @param {*} data 需要序列化的数据
 * @param {string} [errorReturnValue=''] 序列化报错时想要返回的字符串
 * @returns {string} 序列化后的字符串或默认值
 */
export function safeJsonStringify(
  data: unknown,
  errorReturnValue: string = ""
): string {
  try {
    return JSON.stringify(data);
  } catch (e) {
    console.warn(e);
    return errorReturnValue;
  }
}

/**
 * 安全 json 解析，报错时可返回默认值
 * @param {string} data 解析数据
 * @param {*} [errorReturnValue={}] 解析报错时想要返回数据
 * @returns {T} 解析后的数据
 */
export function safeJsonParse<T = Record<string, any>>(
  data: string,
  errorReturnValue = {}
) {
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    console.warn(e);
    return errorReturnValue as T;
  }
}

/**
 * 将输入值转换为字符串形式。
 * @param {*} val - 输入值，可以是任意类型。
 *   - 如果值为 `null` 或 `undefined`，返回空字符串。
 *   - 如果值为字符串类型，直接返回该字符串。
 *   - 如果值为对象类型（包括数组），使用 `JSON.stringify` 转换为字符串。
 *   - 对于其他类型，调用其 `toString` 方法进行转换。
 * @returns {string} 返回转换后的字符串。
 */
export function stringify(val: unknown): string {
  if (isNil(val)) return "";
  if (isString(val)) return val;
  if (isObject(val)) return JSON.stringify(val);
  return (val as any).toString();
}
