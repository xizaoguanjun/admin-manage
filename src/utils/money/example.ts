/**
 * Money 工具类使用示例
 * 适用于收费系统中的常见场景
 */

import { Money } from "./index";
import { money, sum, average } from "./helpers";
import { RoundingMode } from "./constants";

// ==================== 示例1：基础运算 ====================
console.log("=== 示例1：基础运算 ===");

const price = new Money("19.99");
const quantity = 3;
const total = price.multiply(quantity); // 59.97

console.log(`单价: ${price.format()}`); // ¥19.99
console.log(`数量: ${quantity}`);
console.log(`总价: ${total.format()}`); // ¥59.97

// ==================== 示例2：精度控制 ====================
console.log("\n=== 示例2：精度控制 ===");

const amount = new Money("123.456789");

console.log(`原始值: ${amount.toString()}`); // 123.456789
console.log(`四舍五入: ${amount.round(2).toString()}`); // 123.46
console.log(`向上取整: ${amount.ceil(2).toString()}`); // 123.46
console.log(`向下取整: ${amount.floor(2).toString()}`); // 123.45
console.log(`直接截断: ${amount.truncate(2).toString()}`); // 123.45

// 不同舍入模式
const test = new Money("1.125");
console.log(`\n测试金额: ${test.toString()}`);
console.log(`四舍五入: ${test.round(2, RoundingMode.HALF_UP).toString()}`); // 1.13
console.log(`五舍六入: ${test.round(2, RoundingMode.HALF_DOWN).toString()}`); // 1.12
console.log(`银行家舍入: ${test.round(2, RoundingMode.HALF_EVEN).toString()}`); // 1.12

// ==================== 示例3：订单分摊 ====================
console.log("\n=== 示例3：订单分摊 ===");

// 订单 99.99 元，3人平摊
const orderTotal = new Money("99.99");
const [share1, share2, share3] = orderTotal.allocate([1, 1, 1]);

console.log(`订单总额: ${orderTotal.format()}`);
console.log(`第1人: ${share1.format()}`); // ¥33.33
console.log(`第2人: ${share2.format()}`); // ¥33.33
console.log(`第3人: ${share3.format()}`); // ¥33.33

// 验证总和
const allocatedSum = sum([share1, share2, share3]);
console.log(`分摊总和: ${allocatedSum.format()}`);
console.log(`总和相等: ${allocatedSum.equals(orderTotal)}`); // true

// ==================== 示例4：折扣计算 ====================
console.log("\n=== 示例4：折扣计算 ===");

const originalPrice = new Money("199.99");

// 8折优惠
const discountedPrice = originalPrice.applyDiscount(0.8);
console.log(`原价: ${originalPrice.format()}`);
console.log(`8折后: ${discountedPrice.format()}`); // ¥159.99

// 20%折扣（相当于8折）
const discounted2 = originalPrice.applyDiscount(20, true);
console.log(`20%折扣后: ${discounted2.format()}`); // ¥159.99

// ==================== 示例5：百分比计算 ====================
console.log("\n=== 示例5：百分比计算 ===");

const baseAmount = new Money("1000");

console.log(`基础金额: ${baseAmount.format()}`);
console.log(`15%手续费: ${baseAmount.percentage(15).format()}`); // ¥150.00
console.log(`8.5%增值税: ${baseAmount.percentage(8.5).format()}`); // ¥85.00

// ==================== 示例6：聚合函数 ====================
console.log("\n=== 示例6：聚合函数 ===");

const amounts = [money("10.5"), money("20.3"), money("30.2")];

console.log(`总和: ${sum(amounts).format()}`); // ¥61.00
console.log(`平均值: ${average(amounts).format()}`); // ¥20.33

// ==================== 示例7：链式调用 ====================
console.log("\n=== 示例7：链式调用 ===");

const result = money("100")
  .multiply("1.2") // 120
  .add("30") // 150
  .applyDiscount(0.9) // 135
  .percentage(10) // 13.5
  .round(2);

console.log(`链式计算结果: ${result.format()}`); // ¥13.50

// ==================== 示例8：防止精度问题 ====================
console.log("\n=== 示例8：防止精度问题 ===");

// JavaScript 原生计算（错误）
const jsWrong = 0.1 + 0.2;
console.log(`JS原生: 0.1 + 0.2 = ${jsWrong}`); // 0.30000000000000004

// Money 类计算（正确）
const moneyCorrect = money("0.1").add("0.2");
console.log(`Money类: 0.1 + 0.2 = ${moneyCorrect.toString()}`); // 0.3

export {};
