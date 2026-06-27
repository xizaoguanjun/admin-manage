import { onUnmounted, computed } from "vue";
import { emitter } from "@/utils/mitt";
import type { WebSocketMessageType } from "./websocket-types";
import { useWebSocketStore } from "@/store/modules/websocket";

export class WebsocketManager {
  private ws: WebSocket | null = null;
  private readonly url: string;
  private reconnectAttempts = 0;
  private reconnectAttemptsLimit = 5;
  private reconnectInterval = 5000;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (err) {
      console.log("WebSocket连接失败:", err);
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log("WebSocket连接成功");
      this.reconnectAttempts = 0;
      const obj = {
        type: "register",
        data: {
          sessionId: "ffffff"
        }
      };
      console.log("send 紧", obj);
      this.send(obj);
      this.startHeartbeat();
      emitter.emit("websocket-connected", true);
    };

    this.ws.onmessage = event => {
      try {
        const data: WebSocketMessageType = JSON.parse(event.data);
        emitter.emit("websocket-message", data);
      } catch (error) {
        console.error("WebSocket消息解析失败:", error);
        emitter.emit("websocket-error", {
          message: "消息解析失败"
        });
      }
    };

    this.ws.onclose = () => {
      console.log("WebSocket连接关闭");
      this.stopHeartbeat();
      emitter.emit("websocket-connected", false);
      emitter.emit("websocket-closed");
      this.reconnect();
    };

    this.ws.onerror = error => {
      console.error("WebSocket错误:", error);
      emitter.emit("websocket-error", {
        message: "WebSocket连接错误"
      });
    };
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      console.log("startHeartbeat");
      this.send({ type: "ping" });
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.reconnectAttemptsLimit) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(
          `尝试重连 ${this.reconnectAttempts}/${this.reconnectAttemptsLimit}`
        );
        this.connect();
      }, this.reconnectInterval);
    }
  }

  disconnect() {
    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  // 获取连接状态
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 简化的 Hook，只负责组件级别的生命周期管理
export const useWebSocket = () => {
  const store = useWebSocketStore();

  onUnmounted(() => {
    // 组件卸载时不自动断开，由全局 Store 管理
  });

  return {
    isConnected: computed(() => store.isConnected),
    connect: () => store.connect(),
    disconnect: () => store.disconnect(),
    send: (data: WebSocketMessageType) => store.sendMessage(data)
  };
};
