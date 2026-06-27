import type { Emitter } from "mitt";
import mitt from "mitt";
import type { WebSocketMessageType } from "./websocket-types";

/** 全局公共事件需要在此处添加类型 */
type Events = {
  openPanel: string;
  tagOnClick: string;
  logoChange: boolean;
  tagViewsChange: string;
  changLayoutRoute: string;
  tagViewsShowModel: string;
  imageInfo: {
    img: HTMLImageElement;
    height: number;
    width: number;
    x: number;
    y: number;
  };
  // WebSocket 相关事件
  /** WebSocket 连接状态变化事件 */
  "websocket-connected": boolean;
  /** WebSocket 接收到消息事件 */
  "websocket-message": WebSocketMessageType;
  /** WebSocket 连接错误事件 */
  "websocket-error": { code?: number; message: string };
  /** WebSocket 连接关闭事件 */
  "websocket-closed": void;
};

export const emitter: Emitter<Events> = mitt<Events>();
