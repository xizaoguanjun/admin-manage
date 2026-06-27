/**
 * 上传速度计算和时间预估工具
 * 使用滑动窗口算法计算实时上传速度
 */

// 速度记录点
interface SpeedPoint {
  timestamp: number; // 时间戳（毫秒）
  uploadedBytes: number; // 已上传字节数
}

// 速度计算器类
export class UploadSpeedCalculator {
  private speedPoints: SpeedPoint[] = []; // 速度记录点列表
  private readonly windowSize: number; // 滑动窗口大小（秒）
  private readonly minPoints: number; // 最少记录点数
  private startTime: number = 0; // 开始时间
  private totalBytes: number = 0; // 总字节数

  /**
   * @param windowSize 滑动窗口大小（秒），默认 10 秒
   * @param minPoints 最少记录点数，默认 3 个
   */
  constructor(windowSize: number = 10, minPoints: number = 3) {
    this.windowSize = windowSize;
    this.minPoints = minPoints;
  }

  /**
   * 开始计算
   * @param totalBytes 总字节数
   */
  start(totalBytes: number): void {
    this.startTime = Date.now();
    this.totalBytes = totalBytes;
    this.speedPoints = [];
    this.addPoint(0); // 添加起始点
  }

  /**
   * 添加速度记录点
   * @param uploadedBytes 已上传字节数
   */
  addPoint(uploadedBytes: number): void {
    const now = Date.now();
    this.speedPoints.push({
      timestamp: now,
      uploadedBytes
    });

    // 清理过期的记录点（超出滑动窗口）
    const windowMs = this.windowSize * 1000;
    this.speedPoints = this.speedPoints.filter(
      point => now - point.timestamp <= windowMs
    );
  }

  /**
   * 计算当前上传速度（字节/秒）
   */
  getCurrentSpeed(): number {
    if (this.speedPoints.length < this.minPoints) {
      return 0;
    }

    const oldestPoint = this.speedPoints[0];
    const newestPoint = this.speedPoints[this.speedPoints.length - 1];

    const timeDiff = (newestPoint.timestamp - oldestPoint.timestamp) / 1000; // 秒
    const bytesDiff = newestPoint.uploadedBytes - oldestPoint.uploadedBytes;

    if (timeDiff === 0) {
      return 0;
    }

    return bytesDiff / timeDiff;
  }

  /**
   * 计算平均上传速度（字节/秒）
   */
  getAverageSpeed(): number {
    if (this.startTime === 0 || this.speedPoints.length === 0) {
      return 0;
    }

    const now = Date.now();
    const timeDiff = (now - this.startTime) / 1000; // 秒
    const newestPoint = this.speedPoints[this.speedPoints.length - 1];
    const uploadedBytes = newestPoint.uploadedBytes;

    if (timeDiff === 0) {
      return 0;
    }

    return uploadedBytes / timeDiff;
  }

  /**
   * 计算剩余时间（秒）
   * @param uploadedBytes 已上传字节数
   * @returns 剩余秒数，-1 表示无法计算
   */
  getRemainingTime(uploadedBytes: number): number {
    const speed = this.getCurrentSpeed();
    if (speed === 0) {
      return -1;
    }

    const remainingBytes = this.totalBytes - uploadedBytes;
    return remainingBytes / speed;
  }

  /**
   * 格式化速度（自动选择单位）
   * @param bytesPerSecond 速度（字节/秒）
   */
  static formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond === 0) {
      return "0 B/s";
    }

    const k = 1024;
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    const speed = parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2));

    return `${speed} ${sizes[i]}`;
  }

  /**
   * 格式化剩余时间（友好显示）
   * @param seconds 剩余秒数
   */
  static formatRemainingTime(seconds: number): string {
    if (seconds < 0 || !isFinite(seconds)) {
      return "计算中...";
    }

    if (seconds < 60) {
      return `${Math.ceil(seconds)} 秒`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} 分钟`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      return remainingMinutes > 0
        ? `${hours} 小时 ${remainingMinutes} 分钟`
        : `${hours} 小时`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0
      ? `${days} 天 ${remainingHours} 小时`
      : `${days} 天`;
  }

  /**
   * 获取上传进度百分比
   * @param uploadedBytes 已上传字节数
   */
  getProgress(uploadedBytes: number): number {
    if (this.totalBytes === 0) {
      return 0;
    }
    return Math.min(100, (uploadedBytes / this.totalBytes) * 100);
  }

  /**
   * 重置计算器
   */
  reset(): void {
    this.speedPoints = [];
    this.startTime = 0;
    this.totalBytes = 0;
  }
}

/**
 * 全局速度计算器管理器
 * 为每个文件维护独立的速度计算器
 */
export class SpeedCalculatorManager {
  private calculators: Map<string, UploadSpeedCalculator> = new Map();

  /**
   * 获取或创建文件的速度计算器
   * @param fileId 文件 ID
   */
  getCalculator(fileId: string): UploadSpeedCalculator {
    if (!this.calculators.has(fileId)) {
      this.calculators.set(fileId, new UploadSpeedCalculator());
    }
    return this.calculators.get(fileId)!;
  }

  /**
   * 移除文件的速度计算器
   * @param fileId 文件 ID
   */
  removeCalculator(fileId: string): void {
    this.calculators.delete(fileId);
  }

  /**
   * 清空所有计算器
   */
  clear(): void {
    this.calculators.clear();
  }

  /**
   * 获取所有文件的总速度
   */
  getTotalSpeed(): number {
    let totalSpeed = 0;
    for (const calculator of this.calculators.values()) {
      totalSpeed += calculator.getCurrentSpeed();
    }
    return totalSpeed;
  }
}

// 导出单例实例
export const speedCalculatorManager = new SpeedCalculatorManager();
