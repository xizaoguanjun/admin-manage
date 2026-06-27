import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { copy } from "./index";

// Mock dependencies
vi.mock("@/utils/message", () => ({
  message: vi.fn()
}));

vi.mock("@/utils/clipboard", () => ({
  copyTextToClipboard: vi.fn(() => true)
}));

describe("v-copy 指令", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应该绑定复制值到元素", () => {
    const wrapper = mount({
      template: "<div v-copy=\"'Hello World'\">复制</div>",
      directives: { copy }
    });

    const el = wrapper.element as HTMLElement & { copyValue?: string };
    expect(el.copyValue).toBe("Hello World");
  });

  it("应该抛出错误当没有值时", () => {
    expect(() => {
      mount({
        template: '<div v-copy="">复制</div>',
        directives: { copy }
      });
    }).toThrow('[Directive: copy]: need value! Like v-copy="modelValue"');
  });

  it("应该在更新时更新复制值", async () => {
    const wrapper = mount({
      template: '<div v-copy="text">复制</div>',
      directives: { copy },
      data() {
        return { text: "初始文本" };
      }
    });

    const el = wrapper.element as HTMLElement & { copyValue?: string };
    expect(el.copyValue).toBe("初始文本");

    await wrapper.setData({ text: "更新文本" });
    expect(el.copyValue).toBe("更新文本");
  });
});
