import { useWebSocketStore } from "@/store/modules/websocket";
// 单例模式
class WebSocketService {
  private static instance: WebSocketService;
  private initialized = false;
  // 获取实例
  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // 全局初始化 WebSocket
  async init() {
    if (this.initialized) return;

    const store = useWebSocketStore();
    await store.connect();
    this.initialized = true;
  }

  // 全局销毁
  destroy() {
    const store = useWebSocketStore();
    store.reset(); // 断开清空消息
    this.initialized = false;
  }
}

export const websocketService = WebSocketService.getInstance();
