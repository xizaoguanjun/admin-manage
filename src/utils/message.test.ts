import { describe, it, expect, vi } from "vitest";
import { message } from "./message";

// Mock Element Plus
vi.mock("element-plus", () => ({
  ElMessage: vi.fn()
}));

describe("message 工具函数", () => {
  it("应该显示消息", () => {
    // TODO: 实现具体测试用例
    expect(typeof message).toBe("function");
  });

  it("应该支持不同类型的消息", () => {
    // TODO: 实现具体测试用例
    expect(typeof message).toBe("function");
  });

  it("应该支持自定义配置", () => {
    // TODO: 实现具体测试用例
    expect(typeof message).toBe("function");
  });
});
