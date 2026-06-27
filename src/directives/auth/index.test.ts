import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { auth } from "./index";

// Mock hasAuth
vi.mock("@/router/utils", () => ({
  hasAuth: vi.fn(roles => {
    if (Array.isArray(roles)) {
      return roles.includes("admin");
    }
    return roles === "admin";
  })
}));

describe("v-auth 指令", () => {
  it("应该在有权限时渲染元素", () => {
    const wrapper = mount({
      template: "<div><button v-auth=\"'admin'\">操作按钮</button></div>",
      directives: { auth }
    });

    expect(wrapper.html()).toContain("操作按钮");
  });

  it("应该在无权限时移除元素", () => {
    const wrapper = mount({
      template: "<div><button v-auth=\"'user'\">操作按钮</button></div>",
      directives: { auth }
    });

    expect(wrapper.html()).not.toContain("操作按钮");
  });

  it("应该支持数组形式的角色", () => {
    const wrapper = mount({
      template:
        "<div><button v-auth=\"['admin', 'user']\">操作按钮</button></div>",
      directives: { auth }
    });

    expect(wrapper.html()).toContain("操作按钮");
  });

  it("应该抛出错误当没有值时", () => {
    expect(() => {
      mount({
        template: '<div><button v-auth="">操作按钮</button></div>',
        directives: { auth }
      });
    }).toThrow(
      "[Directive: auth]: need auths! Like v-auth=\"['btn.add','btn.edit']\""
    );
  });
});
