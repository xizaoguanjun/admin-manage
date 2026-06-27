import type Decimal from "decimal.js";

/**
 * 金额格式化选项
 */
export interface MoneyFormatOptions {
  /** 货币符号，默认 "¥" */
  symbol?: string;
  /** 小数位数，默认 2 */
  decimalPlaces?: number;
  /** 千分位分隔符，默认 "," */
  thousandsSeparator?: string;
  /** 小数点分隔符，默认 "." */
  decimalSeparator?: string;
  /** 符号位置，默认 "prefix" */
  symbolPosition?: "prefix" | "suffix";
  /** 舍入模式，默认 ROUND_HALF_UP */
  roundingMode?: Decimal.Rounding;
}

/**
 * Money 类接受的输入类型
 */
export type MoneyInput = string | number | Decimal;
