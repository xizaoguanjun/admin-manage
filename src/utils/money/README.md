# Money 工具类使用文档

基于 `decimal.js` 实现的精确货币计算工具，专为收费系统设计，解决 JavaScript 浮点数精度问题。

## 📦 安装依赖

```bash
pnpm add decimal.js
```

## 🚀 快速开始

### 基础用法

```typescript
import { Money } from "@/utils/money";

// 创建 Money 实例
const price = new Money("19.99");
const total = price.multiply(3); // 59.97

console.log(total.format()); // "¥59.97"
```

### 使用工厂函数

```typescript
import { money } from "@/utils/money/helpers";

const price = money("19.99");
```

## 📚 API 文档

### Money 类

#### 构造函数

```typescript
new Money(amount: string | number | Decimal)
```

**建议：使用字符串类型避免精度问题**

```typescript
// ✅ 推荐
const price = new Money("19.99");

// ⚠️ 不推荐（可能有精度问题）
const price = new Money(19.99);
```

---

### 算术运算

#### add(amount) - 加法

```typescript
const a = new Money("10.5");
const b = new Money("20.3");
const sum = a.add(b); // 30.8
```

#### subtract(amount) - 减法

```typescript
const a = new Money("100");
const b = new Money("30.5");
const diff = a.subtract(b); // 69.5
```

#### multiply(multiplier) - 乘法

```typescript
const price = new Money("19.99");
const total = price.multiply(3); // 59.97
```

#### divide(divisor) - 除法

```typescript
const total = new Money("100");
const perPerson = total.divide(3); // 33.333333...
const rounded = perPerson.round(2); // 33.33
```

#### mod(divisor) - 求余

```typescript
const amount = new Money("100");
const remainder = amount.mod(7); // 2
```

#### abs() - 绝对值

```typescript
const negative = new Money("-50");
const positive = negative.abs(); // 50
```

#### negate() - 取反

```typescript
const positive = new Money("50");
const negative = positive.negate(); // -50
```

---

### 精度控制（核心功能）

#### round(decimalPlaces, roundingMode) - 四舍五入

```typescript
import { Money, RoundingMode } from "@/utils/money";

const amount = new Money("1.125");

// 四舍五入（默认）
amount.round(2); // 1.13

// 五舍六入
amount.round(2, RoundingMode.HALF_DOWN); // 1.12

// 银行家舍入（四舍六入五取偶）
amount.round(2, RoundingMode.HALF_EVEN); // 1.12
```

**所有舍入模式：**

- `RoundingMode.UP` - 向上舍入（远离零）
- `RoundingMode.DOWN` - 向下舍入（趋向零）
- `RoundingMode.CEIL` - 向正无穷舍入
- `RoundingMode.FLOOR` - 向负无穷舍入
- `RoundingMode.HALF_UP` - 四舍五入（默认）
- `RoundingMode.HALF_DOWN` - 五舍六入
- `RoundingMode.HALF_EVEN` - 银行家舍入

#### ceil(decimalPlaces) - 向上取整

```typescript
const amount = new Money("1.121");
amount.ceil(2); // 1.13
```

#### floor(decimalPlaces) - 向下取整

```typescript
const amount = new Money("1.128");
amount.floor(2); // 1.12
```

#### truncate(decimalPlaces) - 直接截断

```typescript
const amount = new Money("1.12999");
amount.truncate(2); // 1.12（直接切割，不进行舍入）
```

---

### 比较操作

```typescript
const a = new Money("100");
const b = new Money("99.99");

a.isGreaterThan(b); // true
a.isGreaterThanOrEqualTo(b); // true
a.isLessThan(b); // false
a.isLessThanOrEqualTo(b); // false
a.equals(b); // false
a.isZero(); // false
a.isPositive(); // true
a.isNegative(); // false
```

---

### 转换方法

#### toString() - 转为字符串（完整精度）

```typescript
const amount = new Money("123.456789");
amount.toString(); // "123.456789"
```

#### toFixedString(decimalPlaces, roundingMode) - 固定精度字符串

```typescript
const amount = new Money("123.456");
amount.toFixedString(2); // "123.46"（使用精确舍入，不是 toFixed）
```

#### toNumber() - 转为数字

```typescript
const amount = new Money("123.45");
amount.toNumber(); // 123.45

// ⚠️ 警告：仅用于显示，不要用于计算
```

#### format(options) - 格式化为货币

```typescript
const amount = new Money("1234567.89");

// 默认格式
amount.format(); // "¥1,234,567.89"

// 自定义货币符号
amount.format({ symbol: "$" }); // "$1,234,567.89"

// 无千分位
amount.format({ thousandsSeparator: "" }); // "¥1234567.89"

// 符号后置
amount.format({
  symbol: "元",
  symbolPosition: "suffix"
}); // "1,234,567.89元"

// 整数格式
amount.format({ decimalPlaces: 0 }); // "¥1,234,568"
```

---

### 业务方法

#### allocate(ratios) - 按比例分配

**解决分账/分摊场景的精度问题，确保分配后总和不变**

```typescript
// 场景1：订单 99.99 元，3人平摊
const orderTotal = new Money("99.99");
const [share1, share2, share3] = orderTotal.allocate([1, 1, 1]);

console.log(share1.format()); // "¥33.33"
console.log(share2.format()); // "¥33.33"
console.log(share3.format()); // "¥33.33"

// 验证：总和仍为 99.99
const sum = share1.add(share2).add(share3);
console.log(sum.equals(orderTotal)); // true

// 场景2：100 元按 1:2:3 比例分配
const [a, b, c] = new Money("100").allocate([1, 2, 3]);
console.log(a.format()); // "¥16.66"
console.log(b.format()); // "¥33.33"
console.log(c.format()); // "¥50.01"（最后一份取剩余，确保总和）
```

#### percentage(percentage, decimalPlaces) - 计算百分比

```typescript
const amount = new Money("1000");

amount.percentage(15); // 150.00 (1000 的 15%)
amount.percentage(8.5); // 85.00 (1000 的 8.5%)
amount.percentage(0.6); // 6.00 (1000 的 0.6%)
```

#### applyDiscount(discount, isPercentage, decimalPlaces) - 应用折扣

```typescript
const price = new Money("100");

// 方式1：直接折扣率（0.8 表示 8折）
price.applyDiscount(0.8); // 80.00

// 方式2：百分比形式（20 表示打8折，即折扣20%）
price.applyDiscount(20, true); // 80.00
```

---

### 辅助函数

#### sum(amounts) - 求和

```typescript
import { sum } from "@/utils/money/helpers";

const total = sum([new Money("10.5"), new Money("20.3"), new Money("30.2")]); // 61.0
```

#### average(amounts, decimalPlaces) - 平均值

```typescript
import { average } from "@/utils/money/helpers";

const avg = average([new Money("10"), new Money("20"), new Money("30")]); // 20.00
```

#### max(amounts) / min(amounts) - 最大值/最小值

```typescript
import { max, min } from "@/utils/money/helpers";

const amounts = [new Money("10"), new Money("30"), new Money("20")];

max(amounts); // 30
min(amounts); // 10
```

#### isInRange(amount, min, max) - 范围判断

```typescript
import { isInRange } from "@/utils/money/helpers";

const price = new Money("50");
isInRange(price, new Money("10"), new Money("100")); // true
```

#### clamp(amount, min, max) - 限制范围

```typescript
import { clamp } from "@/utils/money/helpers";

clamp(new Money("150"), new Money("0"), new Money("100")); // 100
clamp(new Money("-10"), new Money("0"), new Money("100")); // 0
clamp(new Money("50"), new Money("0"), new Money("100")); // 50
```

---

## 💡 实战场景

### 场景1：订单计算

```typescript
import { Money } from "@/utils/money";

class OrderCalculator {
  private items: Array<{
    name: string;
    price: Money;
    quantity: number;
  }> = [];

  addItem(name: string, price: string, quantity: number) {
    this.items.push({
      name,
      price: new Money(price),
      quantity
    });
  }

  calculateTotal(taxRate: string = "0", discountRate: string = "0") {
    // 计算小计
    const subtotal = this.items.reduce(
      (total, item) => total.add(item.price.multiply(item.quantity)),
      new Money(0)
    );

    // 计算折扣
    const discount = subtotal.percentage(discountRate);
    const subtotalAfterDiscount = subtotal.subtract(discount);

    // 计算税费
    const tax = subtotalAfterDiscount.percentage(taxRate);

    // 计算总价
    const total = subtotalAfterDiscount.add(tax);

    return {
      subtotal: subtotal.round(2),
      discount: discount.round(2),
      subtotalAfterDiscount: subtotalAfterDiscount.round(2),
      tax: tax.round(2),
      total: total.round(2)
    };
  }
}

// 使用
const order = new OrderCalculator();
order.addItem("商品A", "19.99", 2);
order.addItem("商品B", "39.99", 1);

const result = order.calculateTotal("13", "10"); // 13%税，10%折扣
console.log(`总计: ${result.total.format()}`);
```

### 场景2：分账系统

```typescript
import { Money } from "@/utils/money";

// 订单 1000 元，平台抽成15%，商家85%
const orderAmount = new Money("1000");
const [platformShare, merchantShare] = orderAmount.allocate([15, 85]);

console.log(`平台: ${platformShare.format()}`); // ¥150.00
console.log(`商家: ${merchantShare.format()}`); // ¥850.00
```

### 场景3：链式计算

```typescript
import { money } from "@/utils/money/helpers";

const finalAmount = money("100")
  .multiply("1.2") // 120
  .add("30") // 150
  .applyDiscount(0.9) // 135
  .percentage(10) // 13.5
  .round(2);

console.log(finalAmount.format()); // "¥13.50"
```

---

## ⚠️ 注意事项

### 1. 优先使用字符串

```typescript
// ✅ 推荐
new Money("19.99");

// ⚠️ 避免
new Money(19.99); // 可能有浮点数精度问题
```

### 2. 计算过程中保持精度

```typescript
// ✅ 推荐：最后再舍入
const result = price.multiply(quantity).multiply(taxRate).round(2); // 仅在最后舍入

// ❌ 避免：中间过程舍入
const subtotal = price.multiply(quantity).round(2);
const tax = subtotal.multiply(taxRate).round(2); // 累积误差
```

### 3. 不要用 toNumber() 进行计算

```typescript
// ❌ 错误
const a = new Money("0.1");
const b = new Money("0.2");
const wrong = a.toNumber() + b.toNumber(); // 可能是 0.30000000000000004

// ✅ 正确
const right = a.add(b); // Money 实例，精确计算
```

### 4. 分配/分摊场景必须使用 allocate

```typescript
// ❌ 错误：可能导致总和不匹配
const perPerson = total.divide(3).round(2);
const sum = perPerson.multiply(3); // 可能与 total 不相等

// ✅ 正确：使用 allocate 确保总和
const shares = total.allocate([1, 1, 1]);
const sum = shares.reduce((acc, share) => acc.add(share), new Money(0));
// sum 一定等于 total
```

---

## 📝 TypeScript 类型

```typescript
import type {
  Money,
  MoneyInput,
  ComparableAmount,
  MoneyFormatOptions
} from "@/utils/money";

// MoneyInput: 用于创建 Money 实例
const input: MoneyInput = "100"; // string | number | Decimal

// ComparableAmount: 用于比较操作
const comparable: ComparableAmount = "100"; // string | number | Money

// MoneyFormatOptions: 格式化选项
const options: MoneyFormatOptions = {
  symbol: "¥",
  decimalPlaces: 2,
  thousandsSeparator: ",",
  decimalSeparator: ".",
  symbolPosition: "prefix"
};
```

---

## 📚 相关资源

- [decimal.js 官方文档](https://mikemcl.github.io/decimal.js/)
- [浮点数精度问题说明](https://0.30000000000000004.com/)
