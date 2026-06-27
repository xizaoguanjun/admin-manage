import { defineStore } from "pinia";
import { WebsocketManager } from "@/utils/websocket";
import { emitter } from "@/utils/mitt";
import type { WebSocketMessageType } from "@/utils/websocket-types";

type MessageWithMeta = WebSocketMessageType & {
  timestamp?: number;
  id?: string;
};

export const useWebSocketStore = defineStore("websocket", {
  state: () => ({
    isConnected: false,
    wsManager: null as WebsocketManager | null,
    messages: [] as MessageWithMeta[],
    connectionError: null as string | null
  }),

  getters: {
    connectionStatus: state => (state.isConnected ? "已连接" : "未连接"),
    lastMessage: state => state.messages[state.messages.length - 1] || null
  },

  actions: {
    // 初始化 WebSocket 连接
    async connect() {
      if (this.wsManager?.isConnected) {
        console.log("WebSocket 已连接");
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8899/ws";
      this.wsManager = new WebsocketManager(wsUrl);

      // 监听连接状态变化
      this.setupEventListeners();
      this.wsManager.connect();
    },

    // 设置事件监听
    setupEventListeners() {
      emitter.on("websocket-connected", (status: boolean) => {
        this.isConnected = status;
        if (status) {
          this.connectionError = null;
        }
      });

      emitter.on("websocket-message", (data: WebSocketMessageType) => {
        this.addMessage(data);
      });

      emitter.on("websocket-error", (error: unknown) => {
        this.connectionError =
          typeof error === "object" && error && "message" in error
            ? String((error as { message?: unknown }).message)
            : "WebSocket error";
      });

      emitter.on("websocket-closed", () => {
        this.isConnected = false;
      });
    },

    // 发送消息
    sendMessage(data: WebSocketMessageType) {
      if (!this.wsManager) {
        console.warn("WebSocket 未初始化");
        return;
      }
      this.wsManager.send(data);
    },

    // 添加消息到历史记录
    addMessage(message: WebSocketMessageType) {
      const messageWithMeta: MessageWithMeta = {
        ...message,
        timestamp: Date.now(),
        id: Math.random().toString(36).substring(2, 11)
      };
      this.messages.push(messageWithMeta);

      // 只保留最近 100 条消息
      if (this.messages.length > 100) {
        this.messages.shift();
      }
    },

    // 清空消息历史
    clearMessages() {
      this.messages = [];
    },

    // 断开连接
    disconnect() {
      this.wsManager?.disconnect();
      this.wsManager = null;
      this.isConnected = false;
      this.connectionError = null;
    },

    // 重置状态
    reset() {
      this.disconnect();
      this.clearMessages();
    }
  }
});
