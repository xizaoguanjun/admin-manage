import Decimal from "decimal.js";
import type { MoneyInput, MoneyFormatOptions } from "./types";
import { DEFAULT_CONFIG } from "./constants";

/**
 * 可比较的金额类型
 */
export type ComparableAmount = string | number | Money;

/**
 * 金额计算工具类
 * 基于 decimal.js 实现精确的货币计算，避免 JavaScript 浮点数精度问题
 *
 * @example
 * ```ts
 * const price = new Money('19.99');
 * const total = price.multiply(3); // 59.97
 * const tax = total.multiply('0.13'); // 7.7961
 * const finalPrice = total.add(tax).round(2); // 67.77
 * console.log(finalPrice.format()); // "¥67.77"
 * ```
 */
export class Money {
  private readonly value: Decimal;

  /**
   * 创建 Money 实例
   * @param amount - 金额，支持 string | number | Decimal
   */
  constructor(amount: MoneyInput) {
    if (amount instanceof Decimal) {
      this.value = amount;
    } else {
      // 统一转换为字符串，避免 number 类型的精度问题
      this.value = new Decimal(String(amount));
    }
  }

  /**
   * 加法运算
   * @param amount - 要相加的金额
   * @returns 新的 Money 实例
   */
  add(amount: ComparableAmount): Money {
    const addend = this.toDecimalValue(amount);
    return new Money(this.value.plus(addend));
  }

  /**
   * 减法运算
   * @param amount - 要相减的金额
   * @returns 新的 Money 实例
   */
  subtract(amount: ComparableAmount): Money {
    const subtrahend = this.toDecimalValue(amount);
    return new Money(this.value.minus(subtrahend));
  }

  /**
   * 乘法运算
   * @param multiplier - 乘数
   * @returns 新的 Money 实例
   */
  multiply(multiplier: MoneyInput): Money {
    return new Money(this.value.times(String(multiplier)));
  }

  /**
   * 除法运算
   * @param divisor - 除数
   * @returns 新的 Money 实例
   */
  divide(divisor: MoneyInput): Money {
    return new Money(this.value.dividedBy(String(divisor)));
  }

  /**
   * 求余运算
   * @param divisor - 除数
   * @returns 新的 Money 实例
   */
  mod(divisor: MoneyInput): Money {
    return new Money(this.value.modulo(String(divisor)));
  }

  /**
   * 绝对值
   * @returns 新的 Money 实例
   */
  abs(): Money {
    return new Money(this.value.abs());
  }

  /**
   * 取反
   * @returns 新的 Money 实例
   */
  negate(): Money {
    return new Money(this.value.negated());
  }

  /**
   * 四舍五入到指定小数位
   * @param decimalPlaces - 小数位数，默认 2
   * @param roundingMode - 舍入模式，默认 ROUND_HALF_UP（四舍五入）
   * @returns 新的 Money 实例
   *
   * @example
   * ```ts
   * new Money('1.125').round(2); // 1.13 (四舍五入)
   * new Money('1.124').round(2); // 1.12
   * new Money('1.125').round(2, Decimal.ROUND_DOWN); // 1.12 (向下舍入)
   * ```
   */
  round(
    decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES,
    roundingMode: Decimal.Rounding = DEFAULT_CONFIG.ROUNDING_MODE
  ): Money {
    return new Money(this.value.toDecimalPlaces(decimalPlaces, roundingMode));
  }

  /**
   * 向上取整到指定小数位
   * @param decimalPlaces - 小数位数，默认 2
   * @returns 新的 Money 实例
   *
   * @example
   * ```ts
   * new Money('1.121').ceil(2); // 1.13
   * new Money('1.129').ceil(2); // 1.13
   * ```
   */
  ceil(decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES): Money {
    return new Money(
      this.value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_UP)
    );
  }

  /**
   * 向下取整到指定小数位
   * @param decimalPlaces - 小数位数，默认 2
   * @returns 新的 Money 实例
   *
   * @example
   * ```ts
   * new Money('1.128').floor(2); // 1.12
   * new Money('1.121').floor(2); // 1.12
   * ```
   */
  floor(decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES): Money {
    return new Money(
      this.value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN)
    );
  }

  /**
   * 截断到指定小数位（直接切割，不进行舍入）
   * @param decimalPlaces - 小数位数，默认 2
   * @returns 新的 Money 实例
   *
   * @example
   * ```ts
   * new Money('1.12999').truncate(2); // 1.12
   * new Money('1.12111').truncate(2); // 1.12
   * new Money('1.19999').truncate(2); // 1.19
   * ```
   */
  truncate(decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES): Money {
    return new Money(
      this.value.toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN)
    );
  }

  /**
   * 比较：是否大于
   * @param amount - 要比较的金额
   * @returns boolean
   */
  isGreaterThan(amount: ComparableAmount): boolean {
    const comparand = this.toDecimalValue(amount);
    return this.value.greaterThan(comparand);
  }

  /**
   * 比较：是否大于等于
   * @param amount - 要比较的金额
   * @returns boolean
   */
  isGreaterThanOrEqualTo(amount: ComparableAmount): boolean {
    const comparand = this.toDecimalValue(amount);
    return this.value.greaterThanOrEqualTo(comparand);
  }

  /**
   * 比较：是否小于
   * @param amount - 要比较的金额
   * @returns boolean
   */
  isLessThan(amount: ComparableAmount): boolean {
    const comparand = this.toDecimalValue(amount);
    return this.value.lessThan(comparand);
  }

  /**
   * 比较：是否小于等于
   * @param amount - 要比较的金额
   * @returns boolean
   */
  isLessThanOrEqualTo(amount: ComparableAmount): boolean {
    const comparand = this.toDecimalValue(amount);
    return this.value.lessThanOrEqualTo(comparand);
  }

  /**
   * 比较：是否相等
   * @param amount - 要比较的金额
   * @returns boolean
   */
  equals(amount: ComparableAmount): boolean {
    const comparand = this.toDecimalValue(amount);
    return this.value.equals(comparand);
  }

  /**
   * 是否为零
   * @returns boolean
   */
  isZero(): boolean {
    return this.value.isZero();
  }

  /**
   * 是否为正数
   * @returns boolean
   */
  isPositive(): boolean {
    return this.value.isPositive();
  }

  /**
   * 是否为负数
   * @returns boolean
   */
  isNegative(): boolean {
    return this.value.isNegative();
  }

  /**
   * 转换为字符串（完整精度）
   * @returns string
   */
  toString(): string {
    return this.value.toString();
  }

  /**
   * 转换为指定精度的字符串（使用精确切割，不是 toFixed）
   * @param decimalPlaces - 小数位数，默认 2
   * @param roundingMode - 舍入模式，默认 ROUND_HALF_UP
   * @returns string
   *
   * @example
   * ```ts
   * new Money('1.12999').toFixedString(2); // "1.13"
   * new Money('1.12999').toFixedString(4); // "1.1300"
   * ```
   */
  toFixedString(
    decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES,
    roundingMode: Decimal.Rounding = DEFAULT_CONFIG.ROUNDING_MODE
  ): string {
    return this.value
      .toDecimalPlaces(decimalPlaces, roundingMode)
      .toFixed(decimalPlaces);
  }

  /**
   * 转换为数字（警告：可能丢失精度，仅用于显示）
   * @returns number
   */
  toNumber(): number {
    return this.value.toNumber();
  }

  /**
   * 转换为 Decimal 对象
   * @returns Decimal
   */
  toDecimal(): Decimal {
    return this.value;
  }

  /**
   * 格式化为货币字符串
   * @param options - 格式化选项
   * @returns string
   *
   * @example
   * ```ts
   * new Money('1234.56').format(); // "¥1,234.56"
   * new Money('1234.56').format({ symbol: '$' }); // "$1,234.56"
   * new Money('1234.56').format({ symbol: '￥', decimalPlaces: 0 }); // "￥1,235"
   * new Money('1234.56').format({ thousandsSeparator: '' }); // "¥1234.56"
   * ```
   */
  format(options?: MoneyFormatOptions): string {
    const {
      symbol = DEFAULT_CONFIG.CURRENCY_SYMBOL,
      decimalPlaces = DEFAULT_CONFIG.DECIMAL_PLACES,
      thousandsSeparator = DEFAULT_CONFIG.THOUSANDS_SEPARATOR,
      decimalSeparator = DEFAULT_CONFIG.DECIMAL_SEPARATOR,
      symbolPosition = "prefix",
      roundingMode = DEFAULT_CONFIG.ROUNDING_MODE
    } = options || {};

    // 使用 Decimal 的 toDecimalPlaces 进行精确舍入
    const rounded = this.value.toDecimalPlaces(decimalPlaces, roundingMode);

    // 分离整数和小数部分
    const [integerPart, decimalPart = ""] = rounded
      .toFixed(decimalPlaces)
      .split(".");

    // 添加千分位分隔符
    const formattedInteger = thousandsSeparator
      ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)
      : integerPart;

    // 组合整数和小数部分
    const formattedNumber =
      decimalPlaces > 0
        ? `${formattedInteger}${decimalSeparator}${decimalPart}`
        : formattedInteger;

    // 添加货币符号
    return symbolPosition === "prefix"
      ? `${symbol}${formattedNumber}`
      : `${formattedNumber}${symbol}`;
  }

  /**
   * 按比例分配金额（解决分账/分摊场景的精度问题）
   * @param ratios - 分配比例数组
   * @returns Money[] - 分配后的金额数组
   *
   * @example
   * ```ts
   * // 100 元按 1:2:3 比例分配
   * const [a, b, c] = new Money('100').allocate([1, 2, 3]);
   * // a: 16.67, b: 33.33, c: 50.00 (总和仍为 100.00)
   *
   * // 订单 99.99 元，3人平摊
   * const shares = new Money('99.99').allocate([1, 1, 1]);
   * // shares: [33.33, 33.33, 33.33] (总和 99.99)
   * ```
   */
  allocate(ratios: number[]): Money[] {
    if (ratios.length === 0) {
      throw new Error("分配比例数组不能为空");
    }

    if (ratios.some(ratio => ratio < 0)) {
      throw new Error("分配比例不能为负数");
    }

    const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
    if (total === 0) {
      throw new Error("分配比例总和不能为零");
    }

    const results: Money[] = [];
    let remainder = this.value;

    for (let i = 0; i < ratios.length - 1; i++) {
      const ratio = new Decimal(ratios[i]);
      const share = this.value
        .times(ratio)
        .dividedBy(total)
        .toDecimalPlaces(DEFAULT_CONFIG.DECIMAL_PLACES, Decimal.ROUND_DOWN);
      results.push(new Money(share));
      remainder = remainder.minus(share);
    }

    // 最后一份取剩余值，确保总和精确
    results.push(new Money(remainder));

    return results;
  }

  /**
   * 计算百分比
   * @param percentage - 百分比值（如：15 表示 15%）
   * @param decimalPlaces - 结果保留的小数位数，默认 2
   * @returns Money - 计算结果
   *
   * @example
   * ```ts
   * new Money('100').percentage(15); // 15.00 (100 的 15%)
   * new Money('99.99').percentage(8.5); // 8.50 (99.99 的 8.5%)
   * ```
   */
  percentage(
    percentage: MoneyInput,
    decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES
  ): Money {
    const result = this.value.times(String(percentage)).dividedBy(100);
    return new Money(
      result.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
    );
  }

  /**
   * 计算折扣后的价格
   * @param discount - 折扣率（如：0.8 表示 8折，20 表示 8折）
   * @param isPercentage - discount 是否为百分比形式，默认 false
   * @param decimalPlaces - 结果保留的小数位数，默认 2
   * @returns Money - 折扣后的价格
   *
   * @example
   * ```ts
   * // 方式1：直接传折扣率
   * new Money('100').applyDiscount(0.8); // 80.00 (8折后)
   *
   * // 方式2：传百分比
   * new Money('100').applyDiscount(20, true); // 80.00 (打8折，折扣20%)
   * ```
   */
  applyDiscount(
    discount: MoneyInput,
    isPercentage: boolean = false,
    decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES
  ): Money {
    let multiplier: Decimal;

    if (isPercentage) {
      // 如果是百分比形式（如：20 表示折扣20%，实际支付80%）
      multiplier = new Decimal(100).minus(String(discount)).dividedBy(100);
    } else {
      // 直接的折扣率（如：0.8 表示8折）
      multiplier = new Decimal(String(discount));
    }

    const result = this.value.times(multiplier);
    return new Money(
      result.toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP)
    );
  }

  /**
   * 内部辅助方法：将 ComparableAmount 转换为 Decimal
   * @private
   */
  private toDecimalValue(amount: ComparableAmount): Decimal {
    if (amount instanceof Money) {
      return amount.value;
    }
    return new Decimal(String(amount));
  }
}

// 导出类型和常量
export type { MoneyInput, MoneyFormatOptions } from "./types";
export { RoundingMode } from "./constants";
export { Decimal };
