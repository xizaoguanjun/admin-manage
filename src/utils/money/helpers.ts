import { Money } from "./index";
import { DEFAULT_CONFIG } from "./constants";

/**
 * 快捷创建 Money 实例的工厂函数
 * @param amount - 金额
 * @returns Money 实例
 *
 * @example
 * ```ts
 * const price = money('19.99');
 * const total = money(100);
 * ```
 */
export function money(amount: string | number): Money {
  return new Money(amount);
}

/**
 * 求和多个金额
 * @param amounts - 金额数组
 * @returns Money - 总和
 *
 * @example
 * ```ts
 * const total = sum([
 *   new Money('10.5'),
 *   new Money('20.3'),
 *   new Money('30.2')
 * ]); // 61.00
 * ```
 */
export function sum(amounts: Money[]): Money {
  return amounts.reduce((acc, amount) => acc.add(amount), new Money(0));
}

/**
 * 获取多个金额中的最大值
 * @param amounts - 金额数组
 * @returns Money - 最大值
 *
 * @example
 * ```ts
 * const maxAmount = max([
 *   new Money('10.5'),
 *   new Money('20.3'),
 *   new Money('30.2')
 * ]); // 30.2
 * ```
 */
export function max(amounts: Money[]): Money {
  if (amounts.length === 0) {
    throw new Error("金额数组不能为空");
  }
  return amounts.reduce((maxAmount, amount) =>
    amount.isGreaterThan(maxAmount) ? amount : maxAmount
  );
}

/**
 * 获取多个金额中的最小值
 * @param amounts - 金额数组
 * @returns Money - 最小值
 *
 * @example
 * ```ts
 * const minAmount = min([
 *   new Money('10.5'),
 *   new Money('20.3'),
 *   new Money('30.2')
 * ]); // 10.5
 * ```
 */
export function min(amounts: Money[]): Money {
  if (amounts.length === 0) {
    throw new Error("金额数组不能为空");
  }
  return amounts.reduce((minAmount, amount) =>
    amount.isLessThan(minAmount) ? amount : minAmount
  );
}

/**
 * 计算平均值
 * @param amounts - 金额数组
 * @param decimalPlaces - 结果保留的小数位数，默认 2
 * @returns Money - 平均值
 *
 * @example
 * ```ts
 * const avgAmount = average([
 *   new Money('10.5'),
 *   new Money('20.3'),
 *   new Money('30.2')
 * ]); // 20.33
 * ```
 */
export function average(
  amounts: Money[],
  decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES
): Money {
  if (amounts.length === 0) {
    throw new Error("金额数组不能为空");
  }
  const total = sum(amounts);
  return total.divide(amounts.length).round(decimalPlaces);
}

/**
 * 判断金额是否在指定范围内（包含边界）
 * @param amount - 要判断的金额
 * @param minAmount - 最小值
 * @param maxAmount - 最大值
 * @returns boolean
 *
 * @example
 * ```ts
 * const price = new Money('50');
 * isInRange(price, new Money('10'), new Money('100')); // true
 * isInRange(price, new Money('60'), new Money('100')); // false
 * ```
 */
export function isInRange(
  amount: Money,
  minAmount: Money,
  maxAmount: Money
): boolean {
  return (
    amount.isGreaterThanOrEqualTo(minAmount) &&
    amount.isLessThanOrEqualTo(maxAmount)
  );
}

/**
 * 将金额限制在指定范围内
 * @param amount - 要限制的金额
 * @param minAmount - 最小值
 * @param maxAmount - 最大值
 * @returns Money - 限制后的金额
 *
 * @example
 * ```ts
 * clamp(new Money('150'), new Money('0'), new Money('100')); // 100
 * clamp(new Money('-10'), new Money('0'), new Money('100')); // 0
 * clamp(new Money('50'), new Money('0'), new Money('100')); // 50
 * ```
 */
export function clamp(
  amount: Money,
  minAmount: Money,
  maxAmount: Money
): Money {
  if (amount.isLessThan(minAmount)) {
    return minAmount;
  }
  if (amount.isGreaterThan(maxAmount)) {
    return maxAmount;
  }
  return amount;
}

/**
 * 按权重分配金额（加权分配）
 * @param amount - 总金额
 * @param weights - 权重数组
 * @returns Money[] - 分配后的金额数组
 *
 * @example
 * ```ts
 * // 100 元按权重 [3, 2, 1] 分配
 * const shares = distributeByWeight(new Money('100'), [3, 2, 1]);
 * // shares: [50.00, 33.33, 16.67]
 * ```
 */
export function distributeByWeight(amount: Money, weights: number[]): Money[] {
  return amount.allocate(weights);
}

/**
 * 计算多个金额的加权平均值
 * @param amounts - 金额数组
 * @param weights - 权重数组
 * @param decimalPlaces - 结果保留的小数位数，默认 2
 * @returns Money - 加权平均值
 *
 * @example
 * ```ts
 * const avg = weightedAverage(
 *   [new Money('100'), new Money('200'), new Money('300')],
 *   [1, 2, 3]
 * ); // 233.33
 * ```
 */
export function weightedAverage(
  amounts: Money[],
  weights: number[],
  decimalPlaces: number = DEFAULT_CONFIG.DECIMAL_PLACES
): Money {
  if (amounts.length === 0 || weights.length === 0) {
    throw new Error("金额数组和权重数组不能为空");
  }

  if (amounts.length !== weights.length) {
    throw new Error("金额数组和权重数组长度必须相同");
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) {
    throw new Error("权重总和不能为零");
  }

  const weightedSum = amounts.reduce((acc, amount, index) => {
    return acc.add(amount.multiply(weights[index]));
  }, new Money(0));

  return weightedSum.divide(totalWeight).round(decimalPlaces);
}
