import { config } from "@vue/test-utils";
import { vi } from "vitest";

// Mock Element Plus message
config.global.mocks = {
  $message: vi.fn(),
  $notify: vi.fn(),
  $alert: vi.fn(),
  $confirm: vi.fn()
};

// Mock router
config.global.stubs = {
  RouterLink: true,
  RouterView: true
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});
