/**
 * WebSocket 类型测试文件
 * @description 用于验证 WebSocket 类型定义是否正确
 *
 * 运行方式：
 * 1. 在 VS Code 中打开此文件
 * 2. 检查是否有红色波浪线（类型错误）
 * 3. 如果没有错误，说明类型定义正确
 */

import { emitter } from "@/utils/mitt";
import { useWebSocket, WebsocketManager } from "@/utils/websocket";
import type {
  WebSocketMessageType,
  WebSocketNotification,
  WebSocketDataUpdate,
  WebSocketSystemMessage,
  WebSocketHeartbeat
} from "./websocket-types";

// ============================================================
// 测试 1: 发射事件（应该没有类型错误）
// ============================================================

// ✅ 正确：发射连接状态事件
emitter.emit("websocket-connected", true);
emitter.emit("websocket-connected", false);

// ❌ 错误：类型不匹配（取消注释会看到错误）
// emitter.emit("websocket-connected", "true"); // 应该是 boolean

// ✅ 正确：发射消息事件
emitter.emit("websocket-message", {
  type: "notification",
  data: {
    title: "测试通知",
    message: "这是一条测试消息",
    level: "info"
  }
} as WebSocketNotification);

emitter.emit("websocket-message", {
  type: "data-update",
  data: {
    entity: "user",
    action: "update",
    payload: { userId: 1, userName: "张三" }
  }
} as WebSocketDataUpdate);

emitter.emit("websocket-message", {
  type: "system",
  data: {
    code: "MAINTENANCE",
    message: "系统维护中"
  }
} as WebSocketSystemMessage);

emitter.emit("websocket-message", {
  type: "ping"
} as WebSocketHeartbeat);

// ✅ 正确：发射错误事件
emitter.emit("websocket-error", {
  code: 1001,
  message: "连接失败"
});

emitter.emit("websocket-error", {
  message: "未知错误"
});

// ✅ 正确：发射关闭事件
emitter.emit("websocket-closed");

// ============================================================
// 测试 2: 监听事件（应该有正确的类型推断）
// ============================================================

// ✅ 正确：监听连接状态（参数类型应该是 boolean）
emitter.on("websocket-connected", (status: boolean) => {
  console.log("连接状态:", status);
  // status 应该被推断为 boolean 类型
  const isBoolean: boolean = status; // 不应该报错
  console.log(isBoolean);
});

// ✅ 正确：监听消息（参数类型应该是 WebSocketMessageType）
emitter.on("websocket-message", (message: WebSocketMessageType) => {
  console.log("收到消息:", message);

  // 应该能访问 type 属性
  const messageType: string = message.type;
  console.log(messageType);

  // 根据类型处理
  switch (message.type) {
    case "notification":
      const notification = message as WebSocketNotification;
      console.log(notification.data.title);
      console.log(notification.data.message);
      break;
    case "data-update":
      const update = message as WebSocketDataUpdate;
      console.log(update.data.entity);
      console.log(update.data.action);
      break;
    case "system":
      const system = message as WebSocketSystemMessage;
      console.log(system.data.code);
      console.log(system.data.message);
      break;
    case "ping":
    case "pong":
      console.log("心跳消息");
      break;
  }
});

// ✅ 正确：监听错误
emitter.on("websocket-error", error => {
  console.error("错误:", error.message);
  if (error.code) {
    console.error("错误码:", error.code);
  }
});

// ✅ 正确：监听关闭
emitter.on("websocket-closed", () => {
  console.log("连接已关闭");
});

// ============================================================
// 测试 3: 使用 useWebSocket Hook
// ============================================================

function testUseWebSocket() {
  // useWebSocket 使用 Store 中配置的 URL，不需要传递参数
  const { isConnected, connect, disconnect, send } = useWebSocket();

  // isConnected 应该是 Ref<boolean>
  console.log(isConnected.value);

  // connect 应该是函数
  connect();

  // disconnect 应该是函数
  disconnect();

  // send 应该接受 any 类型参数
  send({ type: "test", data: "test" });
}

// ============================================================
// 测试 4: 使用 WebsocketManager
// ============================================================

function testWebsocketManager() {
  const wsManager = new WebsocketManager("ws://localhost:8899/ws");

  // 应该有 connect 方法
  wsManager.connect();

  // 应该有 send 方法
  wsManager.send({ type: "test" });

  // 应该有 disconnect 方法
  wsManager.disconnect();
}

// ============================================================
// 测试 5: 类型守卫函数
// ============================================================

function isNotification(
  message: WebSocketMessageType
): message is WebSocketNotification {
  return message.type === "notification";
}

function isDataUpdate(
  message: WebSocketMessageType
): message is WebSocketDataUpdate {
  return message.type === "data-update";
}

function isSystemMessage(
  message: WebSocketMessageType
): message is WebSocketSystemMessage {
  return message.type === "system";
}

// 使用类型守卫
emitter.on("websocket-message", (message: WebSocketMessageType) => {
  if (isNotification(message)) {
    // TypeScript 知道这里 message 是 WebSocketNotification
    console.log(message.data.title); // 不应该报错
    console.log(message.data.message); // 不应该报错
  }

  if (isDataUpdate(message)) {
    // TypeScript 知道这里 message 是 WebSocketDataUpdate
    console.log(message.data.entity); // 不应该报错
    console.log(message.data.action); // 不应该报错
  }

  if (isSystemMessage(message)) {
    // TypeScript 知道这里 message 是 WebSocketSystemMessage
    console.log(message.data.code); // 不应该报错
    console.log(message.data.message); // 不应该报错
  }
});

// ============================================================
// 测试 6: 取消监听
// ============================================================

function testUnsubscribe() {
  const handleMessage = (message: WebSocketMessageType) => {
    console.log(message);
  };

  const handleError = (error: { code?: number; message: string }) => {
    console.error(error);
  };

  // 监听
  emitter.on("websocket-message", handleMessage);
  emitter.on("websocket-error", handleError);

  // 取消监听
  emitter.off("websocket-message", handleMessage);
  emitter.off("websocket-error", handleError);
}

// ============================================================
// 测试 7: 错误的用法（取消注释会看到错误）
// ============================================================

// ❌ 错误：事件名称不存在
// emitter.emit("websocket-unknown", true);

// ❌ 错误：参数类型不匹配
// emitter.emit("websocket-connected", "true");

// ❌ 错误：参数类型不匹配
// emitter.emit("websocket-message", "invalid message");

// ❌ 错误：缺少必需的属性
// emitter.emit("websocket-message", {
//   type: "notification"
//   // 缺少 data 属性
// });

// ❌ 错误：data 属性类型不匹配
// emitter.emit("websocket-message", {
//   type: "notification",
//   data: {
//     title: 123, // 应该是 string
//     message: "test"
//   }
// });

// ============================================================
// 测试总结
// ============================================================

/**
 * 如果上面的代码没有红色波浪线（除了注释掉的错误示例），
 * 说明 WebSocket 类型定义是正确的！
 *
 * ✅ 类型检查通过
 * ✅ 智能提示正常
 * ✅ 类型推断正确
 * ✅ 错误捕获有效
 */

export {
  testUseWebSocket,
  testWebsocketManager,
  testUnsubscribe,
  isNotification,
  isDataUpdate,
  isSystemMessage
};
