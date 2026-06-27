import { describe, it, expect } from "vitest";
import { Money } from "./index";
import {
  money,
  sum,
  max,
  min,
  average,
  isInRange,
  clamp,
  distributeByWeight,
  weightedAverage
} from "./helpers";

describe("Money 辅助函数", () => {
  describe("money 工厂函数", () => {
    it("应该创建 Money 实例", () => {
      const m = money("100");
      expect(m).toBeInstanceOf(Money);
      expect(m.toString()).toBe("100");
    });

    it("应该支持数字参数", () => {
      const m = money(100.5);
      expect(m.toString()).toBe("100.5");
    });
  });

  describe("sum 求和", () => {
    it("应该正确计算总和", () => {
      const amounts = [money("10.5"), money("20.3"), money("30.2")];
      const total = sum(amounts);
      expect(total.toString()).toBe("61");
    });

    it("应该处理单个元素", () => {
      const amounts = [money("100")];
      expect(sum(amounts).toString()).toBe("100");
    });

    it("应该处理空数组", () => {
      const amounts: Money[] = [];
      expect(sum(amounts).toString()).toBe("0");
    });

    it("应该处理负数", () => {
      const amounts = [money("100"), money("-50"), money("25")];
      expect(sum(amounts).toString()).toBe("75");
    });
  });

  describe("max 最大值", () => {
    it("应该返回最大值", () => {
      const amounts = [money("10"), money("30"), money("20")];
      expect(max(amounts).toString()).toBe("30");
    });

    it("应该处理负数", () => {
      const amounts = [money("-10"), money("-30"), money("-5")];
      expect(max(amounts).toString()).toBe("-5");
    });

    it("应该处理单个元素", () => {
      const amounts = [money("100")];
      expect(max(amounts).toString()).toBe("100");
    });

    it("应该抛出错误当数组为空", () => {
      const amounts: Money[] = [];
      expect(() => max(amounts)).toThrow("金额数组不能为空");
    });
  });

  describe("min 最小值", () => {
    it("应该返回最小值", () => {
      const amounts = [money("10"), money("30"), money("20")];
      expect(min(amounts).toString()).toBe("10");
    });

    it("应该处理负数", () => {
      const amounts = [money("-10"), money("-30"), money("-5")];
      expect(min(amounts).toString()).toBe("-30");
    });

    it("应该处理单个元素", () => {
      const amounts = [money("100")];
      expect(min(amounts).toString()).toBe("100");
    });

    it("应该抛出错误当数组为空", () => {
      const amounts: Money[] = [];
      expect(() => min(amounts)).toThrow("金额数组不能为空");
    });
  });

  describe("average 平均值", () => {
    it("应该正确计算平均值", () => {
      const amounts = [money("10"), money("20"), money("30")];
      expect(average(amounts).toString()).toBe("20");
    });

    it("应该支持自定义小数位数", () => {
      const amounts = [money("10"), money("11"), money("12")];
      expect(average(amounts, 3).toString()).toBe("11");
    });

    it("应该处理不能整除的情况", () => {
      const amounts = [money("10"), money("20"), money("21")];
      expect(average(amounts).toString()).toBe("17");
    });

    it("应该抛出错误当数组为空", () => {
      const amounts: Money[] = [];
      expect(() => average(amounts)).toThrow("金额数组不能为空");
    });
  });

  describe("isInRange 范围判断", () => {
    it("应该正确判断在范围内", () => {
      const amount = money("50");
      const min = money("10");
      const max = money("100");
      expect(isInRange(amount, min, max)).toBe(true);
    });

    it("应该包含边界值", () => {
      const min = money("10");
      const max = money("100");
      expect(isInRange(money("10"), min, max)).toBe(true);
      expect(isInRange(money("100"), min, max)).toBe(true);
    });

    it("应该正确判断不在范围内", () => {
      const amount = money("150");
      const min = money("10");
      const max = money("100");
      expect(isInRange(amount, min, max)).toBe(false);
    });

    it("应该处理负数范围", () => {
      const amount = money("-50");
      const min = money("-100");
      const max = money("0");
      expect(isInRange(amount, min, max)).toBe(true);
    });
  });

  describe("clamp 限制范围", () => {
    it("应该限制超过最大值的金额", () => {
      const amount = money("150");
      const min = money("0");
      const max = money("100");
      expect(clamp(amount, min, max).toString()).toBe("100");
    });

    it("应该限制低于最小值的金额", () => {
      const amount = money("-10");
      const min = money("0");
      const max = money("100");
      expect(clamp(amount, min, max).toString()).toBe("0");
    });

    it("应该保持在范围内的金额不变", () => {
      const amount = money("50");
      const min = money("0");
      const max = money("100");
      expect(clamp(amount, min, max).toString()).toBe("50");
    });

    it("应该处理边界值", () => {
      const min = money("0");
      const max = money("100");
      expect(clamp(money("0"), min, max).toString()).toBe("0");
      expect(clamp(money("100"), min, max).toString()).toBe("100");
    });
  });

  describe("distributeByWeight 按权重分配", () => {
    it("应该按权重分配金额", () => {
      const total = money("100");
      const weights = [1, 2, 3];
      const shares = distributeByWeight(total, weights);

      expect(shares).toHaveLength(3);
      expect(shares[0].toString()).toBe("16.66");
      expect(shares[1].toString()).toBe("33.33");
      expect(shares[2].toString()).toBe("50.01");
    });

    it("分配后总和应该相等", () => {
      const total = money("1000");
      const weights = [3, 5, 2];
      const shares = distributeByWeight(total, weights);
      const sumShares = sum(shares);
      expect(sumShares.equals(total)).toBe(true);
    });

    it("应该处理相等权重", () => {
      const total = money("99");
      const weights = [1, 1, 1];
      const shares = distributeByWeight(total, weights);
      const sumShares = sum(shares);
      expect(sumShares.equals(total)).toBe(true);
    });
  });

  describe("weightedAverage 加权平均", () => {
    it("应该正确计算加权平均值", () => {
      const amounts = [money("100"), money("200"), money("300")];
      const weights = [1, 2, 3];
      const avg = weightedAverage(amounts, weights);

      // (100*1 + 200*2 + 300*3) / (1+2+3) = 1400 / 6 = 233.33
      expect(avg.toString()).toBe("233.33");
    });

    it("应该支持自定义小数位数", () => {
      const amounts = [money("10"), money("20"), money("30")];
      const weights = [1, 1, 1];
      const avg = weightedAverage(amounts, weights, 1);
      expect(avg.toString()).toBe("20");
    });

    it("应该抛出错误当数组为空", () => {
      const amounts: Money[] = [];
      const weights: number[] = [];
      expect(() => weightedAverage(amounts, weights)).toThrow(
        "金额数组和权重数组不能为空"
      );
    });

    it("应该抛出错误当数组长度不匹配", () => {
      const amounts = [money("100"), money("200")];
      const weights = [1, 2, 3];
      expect(() => weightedAverage(amounts, weights)).toThrow(
        "金额数组和权重数组长度必须相同"
      );
    });

    it("应该抛出错误当权重总和为零", () => {
      const amounts = [money("100"), money("200")];
      const weights = [0, 0];
      expect(() => weightedAverage(amounts, weights)).toThrow(
        "权重总和不能为零"
      );
    });
  });

  describe("实际应用场景", () => {
    it("应该正确计算购物车总价", () => {
      const prices = [money("19.99"), money("29.99"), money("39.99")];
      const total = sum(prices);
      expect(total.toString()).toBe("89.97");
    });

    it("应该正确计算分账", () => {
      const orderTotal = money("1000");
      const [platform, merchant] = orderTotal.allocate([15, 85]);

      expect(platform.format()).toBe("¥150.00");
      expect(merchant.format()).toBe("¥850.00");
    });

    it("应该正确计算多人分摊", () => {
      const total = money("99.99");
      const shares = total.allocate([1, 1, 1]);
      const sumShares = sum(shares);

      expect(shares.every(share => share.isPositive())).toBe(true);
      expect(sumShares.equals(total)).toBe(true);
    });
  });
});
