/**
 * WebSocket 相关类型定义
 * @description 定义 WebSocket 消息的类型结构，确保类型安全
 */

/**
 * WebSocket 消息基础接口
 */
export interface WebSocketMessage<T = unknown> {
  /** 消息类型 */
  type: string;
  /** 消息数据 */
  data?: T;
  /** 时间戳 */
  timestamp?: number;
  /** 消息ID */
  messageId?: string;
}

/**
 * WebSocket 心跳消息
 */
export interface WebSocketHeartbeat {
  type: "ping" | "pong";
}

/**
 * WebSocket 通知消息
 */
export interface WebSocketNotification {
  type: "notification";
  data: {
    title: string;
    message: string;
    level?: "info" | "success" | "warning" | "error";
  };
}

/**
 * WebSocket 数据更新消息
 */
export interface WebSocketDataUpdate<T = unknown> {
  type: "data-update";
  data: {
    entity: string;
    action: "create" | "update" | "delete";
    payload: T;
  };
}

/**
 * WebSocket 系统消息
 */
export interface WebSocketSystemMessage {
  type: "system";
  data: {
    code: string;
    message: string;
  };
}

/**
 * WebSocket 所有消息类型的联合类型
 */
export type WebSocketMessageType =
  | WebSocketHeartbeat
  | WebSocketNotification
  | WebSocketDataUpdate
  | WebSocketSystemMessage
  | WebSocketMessage;

/**
 * WebSocket 连接状态
 */
export type WebSocketStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";

/**
 * WebSocket 错误信息
 */
export interface WebSocketError {
  code?: number;
  message: string;
  timestamp: number;
}
