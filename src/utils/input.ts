/**
 * 输入验证和格式化工具函数
 * @description 提供表单输入相关的验证和格式化工具方法
 */

/**
 * 限制小数位数输入
 * @description 过滤非数字字符，只保留一个小数点，并限制小数位数
 * @param value 输入值
 * @param decimalPlaces 允许的小数位数
 * @returns 格式化后的字符串
 *
 * @example
 * ```ts
 * limitDecimalInput("123.456", 2); // "123.45"
 * limitDecimalInput("abc123.45def", 2); // "123.45"
 * limitDecimalInput("12.34.56", 2); // "12.3456" -> "12.34"
 * limitDecimalInput("", 2); // ""
 * ```
 */
export function limitDecimalInput(
  value: string,
  decimalPlaces: number
): string {
  // 只允许数字和一个小数点
  let newValue = value.replace(/[^\d.]/g, "");

  // 只保留第一个小数点
  const parts = newValue.split(".");
  if (parts.length > 2) {
    newValue = parts[0] + "." + parts.slice(1).join("");
  }

  // 重新分割处理后的值以限制小数位数
  const finalParts = newValue.split(".");
  if (finalParts.length === 2 && finalParts[1].length > decimalPlaces) {
    newValue = finalParts[0] + "." + finalParts[1].slice(0, decimalPlaces);
  }

  return newValue;
}

/**
 * 限制正整数输入
 * @description 过滤非数字字符，只允许输入正整数
 * @param value 输入值
 * @returns 只包含数字的字符串
 *
 * @example
 * ```ts
 * limitIntegerInput("123"); // "123"
 * limitIntegerInput("abc123def"); // "123"
 * limitIntegerInput("12.34"); // "1234"
 * limitIntegerInput("-123"); // "123"
 * limitIntegerInput(""); // ""
 * ```
 */
export function limitIntegerInput(value: string): string {
  // 只允许数字
  return value.replace(/[^\d]/g, "");
}

/**
 * 限制数字输入（支持负数和小数）
 * @description 过滤非数字字符，只保留一个负号（在开头）和一个小数点，并限制小数位数
 * @param value 输入值
 * @param decimalPlaces 允许的小数位数
 * @returns 格式化后的字符串
 *
 * @example
 * ```ts
 * limitNumberInput("-123.456", 2); // "-123.45"
 * limitNumberInput("--123.45", 2); // "-123.45"
 * limitNumberInput("abc-123.45def", 2); // "-123.45"
 * ```
 */
export function limitNumberInput(value: string, decimalPlaces: number): string {
  // 检查是否以负号开头
  const isNegative = value.startsWith("-");

  // 移除所有非数字和小数点字符
  let newValue = value.replace(/[^\d.]/g, "");

  // 只保留第一个小数点
  const parts = newValue.split(".");
  if (parts.length > 2) {
    newValue = parts[0] + "." + parts.slice(1).join("");
  }

  // 重新分割处理后的值以限制小数位数
  const finalParts = newValue.split(".");
  if (finalParts.length === 2 && finalParts[1].length > decimalPlaces) {
    newValue = finalParts[0] + "." + finalParts[1].slice(0, decimalPlaces);
  }

  // 添加负号
  if (isNegative && newValue) {
    newValue = "-" + newValue;
  }

  return newValue;
}
