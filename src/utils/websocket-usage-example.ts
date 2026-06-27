/**
 * WebSocket 使用示例
 * @description 展示如何正确使用 WebSocket 和事件监听，确保类型安全
 */

import { emitter } from "@/utils/mitt";
import { useWebSocket, WebsocketManager } from "@/utils/websocket";
import type {
  WebSocketMessageType,
  WebSocketNotification,
  WebSocketDataUpdate,
  WebSocketSystemMessage
} from "./websocket-types";

// ============================================================
// 示例 1: 在 Vue 组件中使用 useWebSocket Hook
// ============================================================
export function example1InComponent() {
  // useWebSocket 使用 Store 中配置的 URL，不需要传递参数
  const { isConnected, connect, disconnect, send } = useWebSocket();

  // 监听连接状态
  emitter.on("websocket-connected", (status: boolean) => {
    console.log("WebSocket 连接状态:", status);
  });

  // 监听消息（带类型检查）
  emitter.on("websocket-message", (message: WebSocketMessageType) => {
    console.log("收到消息:", message);

    // 根据消息类型处理
    switch (message.type) {
      case "notification":
        handleNotification(message as WebSocketNotification);
        break;
      case "data-update":
        handleDataUpdate(message as WebSocketDataUpdate);
        break;
      case "system":
        handleSystemMessage(message as WebSocketSystemMessage);
        break;
      case "ping":
      case "pong":
        // 心跳消息，通常不需要处理
        break;
      default:
        console.log("未知消息类型:", message);
    }
  });

  // 监听错误
  emitter.on("websocket-error", error => {
    console.error("WebSocket 错误:", error);
  });

  // 监听连接关闭
  emitter.on("websocket-closed", () => {
    console.log("WebSocket 连接已关闭");
  });

  // 连接
  connect();

  // 发送消息
  send({
    type: "custom",
    data: { message: "Hello WebSocket" }
  });

  return {
    isConnected,
    disconnect
  };
}

// ============================================================
// 示例 2: 直接使用 WebsocketManager 类
// ============================================================
export function example2DirectUsage() {
  const wsManager = new WebsocketManager("ws://localhost:8899/ws");

  // 监听消息
  emitter.on("websocket-message", (message: WebSocketMessageType) => {
    if (message.type === "notification") {
      const notification = message as WebSocketNotification;
      console.log("通知:", notification.data.title, notification.data.message);
    }
  });

  // 连接
  wsManager.connect();

  // 发送消息
  wsManager.send({
    type: "subscribe",
    data: { channel: "updates" }
  });

  // 断开连接
  // wsManager.disconnect();
}

// ============================================================
// 示例 3: 在 Pinia Store 中使用
// ============================================================
export function example3InStore() {
  // 在 store 的 actions 中
  const initWebSocket = () => {
    const wsManager = new WebsocketManager("ws://localhost:8899/ws");

    // 监听连接状态
    emitter.on("websocket-connected", (status: boolean) => {
      // 更新 store 状态
      console.log("更新连接状态:", status);
    });

    // 监听消息
    emitter.on("websocket-message", (message: WebSocketMessageType) => {
      // 根据消息类型更新 store
      if (message.type === "data-update") {
        const update = message as WebSocketDataUpdate;
        console.log("数据更新:", update.data);
      }
    });

    wsManager.connect();
  };

  return { initWebSocket };
}

// ============================================================
// 示例 4: 消息处理函数
// ============================================================

/** 处理通知消息 */
function handleNotification(message: WebSocketNotification) {
  const { title, message: content, level = "info" } = message.data;
  console.log(`[${level.toUpperCase()}] ${title}: ${content}`);

  // 可以在这里调用 UI 通知组件
  // ElNotification({ title, message: content, type: level });
}

/** 处理数据更新消息 */
function handleDataUpdate(message: WebSocketDataUpdate) {
  const { entity, action, payload } = message.data;
  console.log(`数据更新 - 实体: ${entity}, 操作: ${action}`, payload);

  // 可以在这里更新本地数据或刷新列表
  // if (entity === 'user' && action === 'update') {
  //   refreshUserList();
  // }
}

/** 处理系统消息 */
function handleSystemMessage(message: WebSocketSystemMessage) {
  const { code, message: content } = message.data;
  console.log(`系统消息 [${code}]: ${content}`);

  // 可以在这里处理系统级别的消息
  // if (code === 'MAINTENANCE') {
  //   showMaintenanceNotice(content);
  // }
}

// ============================================================
// 示例 5: 类型安全的消息发送
// ============================================================
export function example5TypeSafeSend() {
  const wsManager = new WebsocketManager("ws://localhost:8899/ws");
  wsManager.connect();

  // 发送通知订阅
  wsManager.send({
    type: "subscribe",
    data: {
      channels: ["notifications", "updates"]
    }
  });

  // 发送心跳（虽然通常由 WebsocketManager 自动处理）
  wsManager.send({
    type: "ping"
  });

  // 发送自定义消息
  wsManager.send({
    type: "custom-action",
    data: {
      action: "refresh",
      target: "user-list"
    }
  });
}

// ============================================================
// 示例 6: 在 Vue 3 Composition API 中使用
// ============================================================
export function example6InVueComponent() {
  // 在 setup() 中，useWebSocket 使用 Store 中配置的 URL
  const { isConnected, connect, disconnect, send } = useWebSocket();

  // 使用 ref 存储接收到的消息
  const messages = ref<WebSocketMessageType[]>([]);

  // 监听消息并存储
  emitter.on("websocket-message", (message: WebSocketMessageType) => {
    messages.value.push(message);

    // 只保留最近 100 条消息
    if (messages.value.length > 100) {
      messages.value.shift();
    }
  });

  // 连接
  onMounted(() => {
    connect();
  });

  // 断开连接
  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    messages,
    send
  };
}

// ============================================================
// 示例 7: 错误处理
// ============================================================
export function example7ErrorHandling() {
  const wsManager = new WebsocketManager("ws://localhost:8899/ws");

  // 监听连接状态
  emitter.on("websocket-connected", (status: boolean) => {
    if (status) {
      console.log("✅ WebSocket 连接成功");
    } else {
      console.log("❌ WebSocket 连接断开");
    }
  });

  // 监听错误
  emitter.on("websocket-error", error => {
    console.error("WebSocket 错误:", error.message);
    // 可以在这里显示错误提示
    // ElMessage.error(`WebSocket 错误: ${error.message}`);
  });

  // 监听连接关闭
  emitter.on("websocket-closed", () => {
    console.log("WebSocket 连接已关闭，将尝试重连...");
  });

  wsManager.connect();
}

// ============================================================
// 示例 8: 取消事件监听
// ============================================================
export function example8Unsubscribe() {
  // 定义处理函数
  const handleMessage = (message: WebSocketMessageType) => {
    console.log("收到消息:", message);
  };

  const handleError = (error: { code?: number; message: string }) => {
    console.error("发生错误:", error);
  };

  // 监听事件
  emitter.on("websocket-message", handleMessage);
  emitter.on("websocket-error", handleError);

  // 在组件卸载或不需要时取消监听
  const cleanup = () => {
    emitter.off("websocket-message", handleMessage);
    emitter.off("websocket-error", handleError);
  };

  // 在 Vue 组件中可以这样使用
  onUnmounted(() => {
    cleanup();
  });

  return { cleanup };
}

// 导入 Vue 相关（用于示例 6）
import { ref, onMounted, onUnmounted } from "vue";
