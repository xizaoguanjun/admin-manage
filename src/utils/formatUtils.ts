/**
 * 通用格式化工具集合
 *
 * - `formatTimestamp`：将时间戳格式化为指定字符串格式
 * - `limitDecimal`：输入过程中限制小数位精度（不进行舍入，仅裁剪）
 * - `toFixedDecimal`：输出时按指定小数位精度进行精确舍入
 * - `normalizePositiveInteger`： 规范化input正整数输入
 *
 * 说明：
 * - 金额、价格场景推荐输入阶段使用 `limitDecimal` 控制位数，失焦或提交阶段使用
 *   `toFixedDecimal` 统一为目标精度（默认保留 2 位小数）。
 */
import { Money } from "@/utils/money";
/**
 * 将时间戳格式化为指定格式字符串
 * @param timestamp 时间戳（毫秒）
 * @param formatStr 格式字符串，支持 `YYYY`、`MM`、`DD`、`HH`、`mm`、`ss`
 * @returns 指定格式的时间字符串
 * @example
 * formatTimestamp(1734086400000); // "2024-12-13 00:00:00"
 * formatTimestamp(1734086400000, "YYYY/MM/DD"); // "2024/12/13"
 */
export function formatTimestamp(
  timestamp: number,
  formatStr: string = "YYYY-MM-DD HH:mm:ss"
): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const replacements: { [key: string]: string } = {
    YYYY: String(year),
    MM: month,
    DD: day,
    HH: hours,
    mm: minutes,
    ss: seconds
  };
  return formatStr.replace(
    /YYYY|MM|DD|HH|mm|ss/g,
    match => replacements[match]
  );
}

/**
 * 限制小数位（输入过程裁剪，不进行舍入）
 * @param val 原始输入值（字符串或数字）
 * @param digits 保留的小数位数，默认 2 位
 * @returns 规范化后的字符串（若存在小数点且无小数，则保留结尾小数点以便继续输入）
 * @example
 * limitDecimal('12.345'); // '12.34'
 * limitDecimal('0012.3'); // '12.3'
 * limitDecimal('.5'); // '0.5'
 */
export function limitDecimal(val: any, digits = 2): string {
  if (val === undefined || val === null) return "";
  let s = String(val).replace(/[^0-9.]/g, "");
  const dotIdx = s.indexOf(".");
  if (dotIdx !== -1) {
    s = s.slice(0, dotIdx + 1) + s.slice(dotIdx + 1).replace(/\./g, "");
  }
  if (s.startsWith(".")) s = "0" + s;
  let [intPart, decPart = ""] = s.split(".");
  intPart = intPart.replace(/^0+(?=\d)/, "");
  if (intPart === "") intPart = "0";
  if (dotIdx !== -1) {
    decPart = decPart.slice(0, digits);
    return decPart.length ? `${intPart}.${decPart}` : `${intPart}.`;
  }
  return intPart;
}

/**
 * 精确舍入为指定小数位（用于失焦或提交时统一数值格式）
 * @param val 原始值（字符串或数字）
 * @param digits 保留的小数位数，默认 2 位
 * @returns 舍入后的字符串（按银行家舍入等精确模式，内部使用 Money 工具）
 * @example
 * toFixedDecimal('12.345'); // '12.35'
 * toFixedDecimal('12'); // '12.00'
 */
export function toFixedDecimal(val: any, digits = 2): string {
  if (val === undefined || val === null || val === "") return "";
  try {
    return new Money(String(val)).toFixedString(digits);
  } catch {
    return val;
  }
}

/**
 * 规范化正整数输入（仅保留数字并规范前导零）
 * @param val 原始值（字符串或数字）
 * @returns 仅由数字组成的字符串；空值返回空字符串；全零返回 "0"
 * @example
 * normalizePositiveInteger("00123") // "123"
 * normalizePositiveInteger("000") // "0"
 * normalizePositiveInteger("") // ""
 */
export function normalizePositiveInteger(val: any): string {
  if (val === undefined || val === null || val === "") return "";
  let s = String(val).replace(/\D/g, "");
  if (!s) return "";
  if (/^0+$/.test(s)) return "0";
  s = s.replace(/^0+(?=\d)/, "");
  return s;
}
