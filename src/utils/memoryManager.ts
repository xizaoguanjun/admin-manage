/**
 * 内存管理工具
 * 用于监控和优化大文件上传时的内存使用
 */

// 内存信息接口
export interface MemoryInfo {
  totalJSHeapSize: number; // 总内存大小（字节）
  usedJSHeapSize: number; // 已使用内存大小（字节）
  jsHeapSizeLimit: number; // 内存大小限制（字节）
  usagePercent: number; // 使用百分比
}

// Blob URL 管理器
class BlobURLManager {
  private blobURLs: Set<string> = new Set();

  /**
   * 创建 Blob URL 并记录
   */
  createURL(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.blobURLs.add(url);
    return url;
  }

  /**
   * 释放指定的 Blob URL
   */
  revokeURL(url: string): void {
    if (this.blobURLs.has(url)) {
      URL.revokeObjectURL(url);
      this.blobURLs.delete(url);
    }
  }

  /**
   * 释放所有 Blob URL
   */
  revokeAll(): void {
    this.blobURLs.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.blobURLs.clear();
  }

  /**
   * 获取当前管理的 Blob URL 数量
   */
  getCount(): number {
    return this.blobURLs.size;
  }
}

// 导出单例
export const blobURLManager = new BlobURLManager();

/**
 * 获取当前内存信息
 * 注意：performance.memory 只在 Chrome/Edge 中可用
 */
export function getMemoryInfo(): MemoryInfo | null {
  if (
    typeof performance !== "undefined" &&
    "memory" in performance &&
    performance.memory
  ) {
    interface PerformanceWithMemory extends Performance {
      memory?: {
        totalJSHeapSize: number;
        usedJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    }

    const memory = (performance as PerformanceWithMemory).memory;
    if (!memory) return null;

    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    return {
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercent: Math.round(usagePercent * 100) / 100
    };
  }
  return null;
}

/**
 * 格式化内存大小
 */
export function formatMemorySize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 检查内存使用是否过高
 * @param threshold 阈值（百分比），默认 80%
 */
export function isMemoryHigh(threshold: number = 80): boolean {
  const memoryInfo = getMemoryInfo();
  if (!memoryInfo) {
    return false; // 无法获取内存信息，假定正常
  }
  return memoryInfo.usagePercent >= threshold;
}

/**
 * 内存监控器
 */
export class MemoryMonitor {
  private interval: number | null = null;
  private callbacks: Array<(info: MemoryInfo) => void> = [];
  private warningThreshold: number = 80; // 警告阈值（百分比）
  private criticalThreshold: number = 90; // 严重阈值（百分比）

  constructor(warningThreshold: number = 80, criticalThreshold: number = 90) {
    this.warningThreshold = warningThreshold;
    this.criticalThreshold = criticalThreshold;
  }

  /**
   * 开始监控
   * @param intervalMs 监控间隔（毫秒），默认 5000ms
   */
  start(intervalMs: number = 5000): void {
    if (this.interval !== null) {
      return; // 已经在监控
    }

    this.interval = window.setInterval(() => {
      const memoryInfo = getMemoryInfo();
      if (memoryInfo) {
        // 触发回调
        this.callbacks.forEach(callback => {
          try {
            callback(memoryInfo);
          } catch (error) {
            console.error("内存监控回调执行失败:", error);
          }
        });

        // 检查是否超过阈值
        if (memoryInfo.usagePercent >= this.criticalThreshold) {
          console.warn(
            `[内存警告] 内存使用率达到 ${memoryInfo.usagePercent}%，已超过严重阈值 ${this.criticalThreshold}%`
          );
          this.triggerMemoryOptimization();
        } else if (memoryInfo.usagePercent >= this.warningThreshold) {
          console.warn(
            `[内存警告] 内存使用率达到 ${memoryInfo.usagePercent}%，已超过警告阈值 ${this.warningThreshold}%`
          );
        }
      }
    }, intervalMs);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.interval !== null) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * 添加回调函数
   */
  onMemoryChange(callback: (info: MemoryInfo) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * 移除回调函数
   */
  offMemoryChange(callback: (info: MemoryInfo) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * 触发内存优化
   */
  private triggerMemoryOptimization(): void {
    // 释放所有 Blob URL
    blobURLManager.revokeAll();

    // 建议浏览器进行垃圾回收（仅在开发环境有效）
    const globalWithGc = globalThis as typeof globalThis & {
      gc?: () => void;
    };
    if (typeof globalWithGc.gc === "function") {
      globalWithGc.gc();
    }
  }
}

/**
 * 分片读取器
 * 用于优化大文件处理，避免一次性加载整个文件到内存
 */
export class ChunkReader {
  private file: File;
  private chunkSize: number;
  private currentChunk: Blob | null = null;

  constructor(file: File, chunkSize: number = 2 * 1024 * 1024) {
    this.file = file;
    this.chunkSize = chunkSize;
  }

  /**
   * 读取指定索引的分片
   * @param chunkIndex 分片索引
   */
  async readChunk(chunkIndex: number): Promise<Blob> {
    const start = chunkIndex * this.chunkSize;
    const end = Math.min(start + this.chunkSize, this.file.size);

    // 释放之前的分片（帮助垃圾回收）
    this.releaseCurrentChunk();

    // 读取新分片
    this.currentChunk = this.file.slice(start, end);
    return this.currentChunk;
  }

  /**
   * 释放当前分片
   */
  releaseCurrentChunk(): void {
    this.currentChunk = null;
  }

  /**
   * 获取总分片数
   */
  getTotalChunks(): number {
    return Math.ceil(this.file.size / this.chunkSize);
  }
}

/**
 * 内存安全的分片上传管理器
 */
export class MemorySafeChunkUploader {
  private activeChunks: Map<string, Blob> = new Map(); // 当前活动的分片
  private maxActiveChunks: number = 3; // 最大同时持有的分片数

  constructor(maxActiveChunks: number = 3) {
    this.maxActiveChunks = maxActiveChunks;
  }

  /**
   * 添加活动分片
   */
  addActiveChunk(chunkId: string, chunk: Blob): void {
    // 如果超过最大数量，移除最旧的分片
    if (this.activeChunks.size >= this.maxActiveChunks) {
      const firstKey = this.activeChunks.keys().next().value;
      if (firstKey) {
        this.activeChunks.delete(firstKey);
      }
    }
    this.activeChunks.set(chunkId, chunk);
  }

  /**
   * 移除活动分片
   */
  removeActiveChunk(chunkId: string): void {
    this.activeChunks.delete(chunkId);
  }

  /**
   * 清除所有活动分片
   */
  clearAllChunks(): void {
    this.activeChunks.clear();
  }

  /**
   * 获取当前活动分片数
   */
  getActiveChunkCount(): number {
    return this.activeChunks.size;
  }
}

// 导出全局内存监控器实例
export const memoryMonitor = new MemoryMonitor();
