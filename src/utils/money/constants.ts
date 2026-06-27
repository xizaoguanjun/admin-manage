import Decimal from "decimal.js";

/**
 * 舍入模式常量
 * 提供更友好的舍入模式命名
 */
export const RoundingMode = {
  /** 向上舍入（远离零） */
  UP: Decimal.ROUND_UP,
  /** 向下舍入（趋向零） */
  DOWN: Decimal.ROUND_DOWN,
  /** 向正无穷舍入 */
  CEIL: Decimal.ROUND_CEIL,
  /** 向负无穷舍入 */
  FLOOR: Decimal.ROUND_FLOOR,
  /** 四舍五入 */
  HALF_UP: Decimal.ROUND_HALF_UP,
  /** 五舍六入 */
  HALF_DOWN: Decimal.ROUND_HALF_DOWN,
  /** 银行家舍入（四舍六入五取偶） */
  HALF_EVEN: Decimal.ROUND_HALF_EVEN,
  /** 向最近舍入，平局时向正无穷 */
  HALF_CEIL: Decimal.ROUND_HALF_CEIL,
  /** 向最近舍入，平局时向负无穷 */
  HALF_FLOOR: Decimal.ROUND_HALF_FLOOR
} as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  /** 默认小数位数 */
  DECIMAL_PLACES: 2,
  /** 默认货币符号 */
  CURRENCY_SYMBOL: "¥",
  /** 默认千分位分隔符 */
  THOUSANDS_SEPARATOR: ",",
  /** 默认小数点分隔符 */
  DECIMAL_SEPARATOR: ".",
  /** 默认舍入模式 */
  ROUNDING_MODE: Decimal.ROUND_HALF_UP
} as const;
