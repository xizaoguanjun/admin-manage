/**
 * 日期时间工具函数
 * @description 提供统一的日期时间格式化工具
 * @author Alan
 * @date 2025-11-21
 */

import dayjs from "dayjs";

/**
 * 时间戳转日期格式（YYYY/MM/DD）
 * @param timestamp 时间戳（毫秒）或日期字符串或 Date 对象
 * @returns YYYY/MM/DD 格式的日期字符串，如：2025/11/21
 *
 * @example
 * ```ts
 * formatDate(1732185600000); // "2025/11/21"
 * formatDate("2025-11-21"); // "2025/11/21"
 * formatDate(new Date()); // "2025/11/21"
 * formatDate(null); // ""
 * ```
 */
export function formatDate(
  timestamp: number | string | Date | null | undefined
): string {
  if (!timestamp) return "";
  return dayjs(timestamp).format("YYYY-MM-DD");
}

/**
 * 时间戳转日期时间格式（YYYY/MM/DD HH:mm:ss）
 * @param timestamp 时间戳（毫秒）或日期字符串或 Date 对象
 * @returns YYYY/MM/DD HH:mm:ss 格式的日期时间字符串，如：2025/11/21 14:30:00
 *
 * @example
 * ```ts
 * formatDateTime(1732185600000); // "2025/11/21 14:30:00"
 * formatDateTime("2025-11-21 14:30:00"); // "2025/11/21 14:30:00"
 * formatDateTime(new Date()); // "2025/11/21 14:30:00"
 * formatDateTime(null); // ""
 * ```
 */
export function formatDateTime(
  timestamp: number | string | Date | null | undefined
): string {
  if (!timestamp) return "";
  return dayjs(timestamp).format("YYYY/MM/DD HH:mm:ss");
}

/**
 * 时间戳转中文日期格式（YYYY年MM月DD日）
 * @param timestamp 时间戳（毫秒）或日期字符串或 Date 对象
 * @returns YYYY年MM月DD日 格式的日期字符串，如：2025年11月21日
 *
 * @example
 * ```ts
 * formatDateCN(1732185600000); // "2025年11月21日"
 * formatDateCN("2025-11-21"); // "2025年11月21日"
 * formatDateCN(null); // ""
 * ```
 */
export function formatDateCN(
  timestamp: number | string | Date | null | undefined
): string {
  if (!timestamp) return "";
  return dayjs(timestamp).format("YYYY年MM月DD日");
}

/**
 * 时间戳转连字符日期格式（YYYY-MM-DD）
 * @param timestamp 时间戳（毫秒）或日期字符串或 Date 对象
 * @returns YYYY-MM-DD 格式的日期字符串，如：2025-11-21
 *
 * @example
 * ```ts
 * formatDateHyphen(1732185600000); // "2025-11-21"
 * formatDateHyphen("2025/11/21"); // "2025-11-21"
 * formatDateHyphen(null); // ""
 * ```
 */
export function formatDateHyphen(
  timestamp: number | string | Date | null | undefined
): string {
  if (!timestamp) return "";
  return dayjs(timestamp).format("YYYY-MM-DD");
}

/**
 * 自定义格式化日期时间
 * @param timestamp 时间戳（毫秒）或日期字符串或 Date 对象
 * @param format 格式字符串，默认 "YYYY/MM/DD"
 * @returns 格式化后的日期时间字符串
 *
 * @example
 * ```ts
 * formatCustom(1732185600000, "YYYY-MM-DD HH:mm"); // "2025-11-21 14:30"
 * formatCustom(1732185600000, "MM/DD/YYYY"); // "11/21/2025"
 * formatCustom(null); // ""
 * ```
 */
export function formatCustom(
  timestamp: number | string | Date | null | undefined,
  format = "YYYY/MM/DD"
): string {
  if (!timestamp) return "";
  return dayjs(timestamp).format(format);
}
