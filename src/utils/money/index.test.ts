import { describe, it, expect } from "vitest";
import { Money, RoundingMode, Decimal } from "./index";

describe("Money 类", () => {
  describe("构造函数", () => {
    it("应该接受字符串参数", () => {
      const money = new Money("100.50");
      expect(money.toString()).toBe("100.5");
    });

    it("应该接受数字参数", () => {
      const money = new Money(100.5);
      expect(money.toString()).toBe("100.5");
    });

    it("应该接受 Decimal 对象", () => {
      const decimal = new Decimal("100.50");
      const money = new Money(decimal);
      expect(money.toString()).toBe("100.5");
    });
  });

  describe("加法运算", () => {
    it("应该正确处理两个正数相加", () => {
      const a = new Money("10.5");
      const b = new Money("20.3");
      expect(a.add(b).toString()).toBe("30.8");
    });

    it("应该避免 JavaScript 精度问题", () => {
      const result = new Money("0.1").add("0.2");
      expect(result.toString()).toBe("0.3");
    });

    it("应该支持链式调用", () => {
      const result = new Money("10").add("20").add("30");
      expect(result.toString()).toBe("60");
    });

    it("应该支持字符串参数", () => {
      const money = new Money("10");
      expect(money.add("5").toString()).toBe("15");
    });

    it("应该支持 Money 对象参数", () => {
      const a = new Money("10");
      const b = new Money("5");
      expect(a.add(b).toString()).toBe("15");
    });
  });

  describe("减法运算", () => {
    it("应该正确处理减法", () => {
      const a = new Money("100");
      const b = new Money("30.5");
      expect(a.subtract(b).toString()).toBe("69.5");
    });

    it("应该支持负数结果", () => {
      const a = new Money("10");
      const b = new Money("20");
      expect(a.subtract(b).toString()).toBe("-10");
    });

    it("应该避免精度问题", () => {
      const result = new Money("0.3").subtract("0.1");
      expect(result.toString()).toBe("0.2");
    });
  });

  describe("乘法运算", () => {
    it("应该正确处理乘法", () => {
      const price = new Money("19.99");
      expect(price.multiply(3).toString()).toBe("59.97");
    });

    it("应该避免精度问题", () => {
      const result = new Money("0.1").multiply(3);
      expect(result.toString()).toBe("0.3");
    });

    it("应该支持小数乘数", () => {
      const result = new Money("100").multiply("0.15");
      expect(result.toString()).toBe("15");
    });
  });

  describe("除法运算", () => {
    it("应该正确处理除法", () => {
      const total = new Money("100");
      expect(total.divide(4).toString()).toBe("25");
    });

    it("应该处理不能整除的情况", () => {
      const total = new Money("100");
      const result = total.divide(3);
      expect(result.toString()).toContain("33.333");
    });

    it("应该避免精度问题", () => {
      const result = new Money("1").divide(3);
      expect(result.round(2).toString()).toBe("0.33");
    });
  });

  describe("求余运算", () => {
    it("应该正确计算余数", () => {
      const amount = new Money("100");
      expect(amount.mod(7).toString()).toBe("2");
    });

    it("应该处理小数", () => {
      const amount = new Money("10.5");
      expect(amount.mod(3).toString()).toBe("1.5");
    });
  });

  describe("绝对值", () => {
    it("应该返回正数的绝对值", () => {
      const money = new Money("50");
      expect(money.abs().toString()).toBe("50");
    });

    it("应该返回负数的绝对值", () => {
      const money = new Money("-50");
      expect(money.abs().toString()).toBe("50");
    });
  });

  describe("取反", () => {
    it("应该将正数取反为负数", () => {
      const money = new Money("50");
      expect(money.negate().toString()).toBe("-50");
    });

    it("应该将负数取反为正数", () => {
      const money = new Money("-50");
      expect(money.negate().toString()).toBe("50");
    });
  });

  describe("四舍五入", () => {
    it("应该默认四舍五入到2位小数", () => {
      const amount = new Money("1.125");
      expect(amount.round().toString()).toBe("1.13");
    });

    it("应该支持自定义小数位数", () => {
      const amount = new Money("1.12345");
      expect(amount.round(3).toString()).toBe("1.123");
    });

    it("应该支持向下舍入模式", () => {
      const amount = new Money("1.125");
      expect(amount.round(2, RoundingMode.DOWN).toString()).toBe("1.12");
    });

    it("应该支持向上舍入模式", () => {
      const amount = new Money("1.121");
      expect(amount.round(2, RoundingMode.UP).toString()).toBe("1.13");
    });

    it("应该支持银行家舍入", () => {
      const amount = new Money("1.125");
      expect(amount.round(2, RoundingMode.HALF_EVEN).toString()).toBe("1.12");
    });
  });

  describe("向上取整", () => {
    it("应该向上取整到指定小数位", () => {
      const amount = new Money("1.121");
      expect(amount.ceil(2).toString()).toBe("1.13");
    });

    it("应该默认向上取整到2位", () => {
      const amount = new Money("1.001");
      expect(amount.ceil().toString()).toBe("1.01");
    });
  });

  describe("向下取整", () => {
    it("应该向下取整到指定小数位", () => {
      const amount = new Money("1.128");
      expect(amount.floor(2).toString()).toBe("1.12");
    });

    it("应该默认向下取整到2位", () => {
      const amount = new Money("1.999");
      expect(amount.floor().toString()).toBe("1.99");
    });
  });

  describe("截断", () => {
    it("应该直接截断到指定小数位", () => {
      const amount = new Money("1.12999");
      expect(amount.truncate(2).toString()).toBe("1.12");
    });

    it("应该不进行舍入", () => {
      const amount = new Money("1.19999");
      expect(amount.truncate(2).toString()).toBe("1.19");
    });
  });

  describe("比较操作", () => {
    it("isGreaterThan 应该正确比较", () => {
      const a = new Money("100");
      const b = new Money("99.99");
      expect(a.isGreaterThan(b)).toBe(true);
      expect(b.isGreaterThan(a)).toBe(false);
    });

    it("isGreaterThanOrEqualTo 应该正确比较", () => {
      const a = new Money("100");
      const b = new Money("100");
      expect(a.isGreaterThanOrEqualTo(b)).toBe(true);
      expect(a.isGreaterThanOrEqualTo("99")).toBe(true);
    });

    it("isLessThan 应该正确比较", () => {
      const a = new Money("50");
      const b = new Money("100");
      expect(a.isLessThan(b)).toBe(true);
      expect(b.isLessThan(a)).toBe(false);
    });

    it("isLessThanOrEqualTo 应该正确比较", () => {
      const a = new Money("50");
      const b = new Money("50");
      expect(a.isLessThanOrEqualTo(b)).toBe(true);
      expect(a.isLessThanOrEqualTo("100")).toBe(true);
    });

    it("equals 应该正确判断相等", () => {
      const a = new Money("100");
      const b = new Money("100.00");
      expect(a.equals(b)).toBe(true);
      expect(a.equals("100")).toBe(true);
      expect(a.equals("99.99")).toBe(false);
    });

    it("isZero 应该正确判断", () => {
      expect(new Money("0").isZero()).toBe(true);
      expect(new Money("0.00").isZero()).toBe(true);
      expect(new Money("0.01").isZero()).toBe(false);
    });

    it("isPositive 应该正确判断", () => {
      expect(new Money("1").isPositive()).toBe(true);
      expect(new Money("0").isPositive()).toBe(true); // Decimal.js 中 0 被认为是正数
      expect(new Money("-1").isPositive()).toBe(false);
    });

    it("isNegative 应该正确判断", () => {
      expect(new Money("-1").isNegative()).toBe(true);
      expect(new Money("0").isNegative()).toBe(false);
      expect(new Money("1").isNegative()).toBe(false);
    });
  });

  describe("转换方法", () => {
    it("toString 应该返回完整精度字符串", () => {
      const amount = new Money("123.456789");
      expect(amount.toString()).toBe("123.456789");
    });

    it("toFixedString 应该返回固定精度字符串", () => {
      const amount = new Money("123.456");
      expect(amount.toFixedString(2)).toBe("123.46");
      expect(amount.toFixedString(4)).toBe("123.4560");
    });

    it("toNumber 应该返回数字", () => {
      const amount = new Money("123.45");
      expect(amount.toNumber()).toBe(123.45);
    });

    it("toDecimal 应该返回 Decimal 对象", () => {
      const amount = new Money("123.45");
      const decimal = amount.toDecimal();
      expect(decimal).toBeInstanceOf(Decimal);
      expect(decimal.toString()).toBe("123.45");
    });
  });

  describe("格式化", () => {
    it("应该使用默认格式", () => {
      const amount = new Money("1234.56");
      expect(amount.format()).toBe("¥1,234.56");
    });

    it("应该支持自定义货币符号", () => {
      const amount = new Money("1234.56");
      expect(amount.format({ symbol: "$" })).toBe("$1,234.56");
    });

    it("应该支持自定义小数位数", () => {
      const amount = new Money("1234.567");
      expect(amount.format({ decimalPlaces: 0 })).toBe("¥1,235");
      expect(amount.format({ decimalPlaces: 3 })).toBe("¥1,234.567");
    });

    it("应该支持无千分位分隔符", () => {
      const amount = new Money("1234.56");
      expect(amount.format({ thousandsSeparator: "" })).toBe("¥1234.56");
    });

    it("应该支持符号后置", () => {
      const amount = new Money("1234.56");
      expect(amount.format({ symbol: "元", symbolPosition: "suffix" })).toBe(
        "1,234.56元"
      );
    });

    it("应该支持自定义小数点分隔符", () => {
      const amount = new Money("1234.56");
      expect(amount.format({ decimalSeparator: "," })).toBe("¥1,234,56");
    });
  });

  describe("allocate 按比例分配", () => {
    it("应该正确分配金额", () => {
      const total = new Money("99.99");
      const shares = total.allocate([1, 1, 1]);
      expect(shares).toHaveLength(3);
      expect(shares[0].toString()).toBe("33.33");
      expect(shares[1].toString()).toBe("33.33");
      expect(shares[2].toString()).toBe("33.33");
    });

    it("分配后总和应该相等", () => {
      const total = new Money("100");
      const shares = total.allocate([1, 2, 3]);
      const sum = shares.reduce((acc, share) => acc.add(share), new Money(0));
      expect(sum.equals(total)).toBe(true);
    });

    it("应该处理不能整除的情况", () => {
      const total = new Money("10");
      const shares = total.allocate([3, 3, 3]);
      const sum = shares.reduce((acc, share) => acc.add(share), new Money(0));
      expect(sum.equals(total)).toBe(true);
    });

    it("应该抛出错误当比例数组为空", () => {
      const total = new Money("100");
      expect(() => total.allocate([])).toThrow("分配比例数组不能为空");
    });

    it("应该抛出错误当存在负数比例", () => {
      const total = new Money("100");
      expect(() => total.allocate([1, -1, 1])).toThrow("分配比例不能为负数");
    });

    it("应该抛出错误当比例总和为零", () => {
      const total = new Money("100");
      expect(() => total.allocate([0, 0, 0])).toThrow("分配比例总和不能为零");
    });
  });

  describe("percentage 百分比计算", () => {
    it("应该正确计算百分比", () => {
      const amount = new Money("1000");
      expect(amount.percentage(15).toString()).toBe("150");
    });

    it("应该支持小数百分比", () => {
      const amount = new Money("99.99");
      expect(amount.percentage(8.5).toString()).toBe("8.5");
    });

    it("应该支持自定义小数位数", () => {
      const amount = new Money("100");
      expect(amount.percentage(15.555, 3).toString()).toBe("15.555");
    });
  });

  describe("applyDiscount 折扣计算", () => {
    it("应该支持折扣率方式", () => {
      const price = new Money("100");
      expect(price.applyDiscount(0.8).toString()).toBe("80");
    });

    it("应该支持百分比方式", () => {
      const price = new Money("100");
      expect(price.applyDiscount(20, true).toString()).toBe("80");
    });

    it("应该支持自定义小数位数", () => {
      const price = new Money("100");
      expect(price.applyDiscount(0.15, false, 3).toString()).toBe("15");
    });
  });

  describe("边界情况", () => {
    it("应该处理零值", () => {
      const zero = new Money("0");
      expect(zero.add("10").toString()).toBe("10");
      expect(zero.multiply("10").toString()).toBe("0");
    });

    it("应该处理负数", () => {
      const negative = new Money("-50");
      expect(negative.add("100").toString()).toBe("50");
      expect(negative.multiply("-2").toString()).toBe("100");
    });

    it("应该处理非常小的数字", () => {
      const tiny = new Money("0.0001");
      expect(tiny.multiply("10000").toString()).toBe("1");
    });

    it("应该处理非常大的数字", () => {
      const huge = new Money("999999999999.99");
      expect(huge.add("0.01").toString()).toBe("1000000000000");
    });
  });
});
