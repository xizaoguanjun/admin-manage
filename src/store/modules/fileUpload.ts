import { ref, computed, onUnmounted } from "vue";
import { defineStore } from "pinia";
import {
  validateFilesBeforeUpload,
  getValidationErrorMessage,
  type ValidationConfig
} from "@/utils/uploadValidation";
import { ElMessage } from "element-plus";
import {
  speedCalculatorManager,
  UploadSpeedCalculator
} from "@/utils/uploadSpeed";
import {
  memoryMonitor,
  isMemoryHigh,
  blobURLManager
} from "@/utils/memoryManager";

// 文件上传状态枚举
export type UploadStatus =
  | "waiting"
  | "uploading"
  | "paused"
  | "completed"
  | "error";

// 上传文件接口
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  uploadedSize: number;
  currentChunk: number;
  totalChunks: number;
  targetFolder: string;
  error?: string;
  abortController?: AbortController;
  // 速度和时间预估
  speed?: number; // 当前上传速度（字节/秒）
  remainingTime?: number; // 剩余时间（秒）
  formattedSpeed?: string; // 格式化的速度字符串
  formattedRemainingTime?: string; // 格式化的剩余时间字符串
}

export const useFileUploadStore = defineStore("fileUpload", () => {
  // 状态
  const uploadFiles = ref<UploadFile[]>([]);
  const isModalVisible = ref(false);
  const isMinimized = ref(false); // 新增：最小化状态
  const currentFolder = ref("设计知识库"); // 默认文件夹

  // 文件上传完成回调函数列表
  const uploadCompleteCallbacks = ref<
    Array<(fileName: string, file: File) => void>
  >([]);

  // 方法：注册上传完成回调
  const onUploadComplete = (
    callback: (fileName: string, file: File) => void
  ) => {
    uploadCompleteCallbacks.value.push(callback);
  };

  // 方法：移除上传完成回调
  const offUploadComplete = (
    callback: (fileName: string, file: File) => void
  ) => {
    const index = uploadCompleteCallbacks.value.indexOf(callback);
    if (index > -1) {
      uploadCompleteCallbacks.value.splice(index, 1);
    }
  };

  // 方法：触发上传完成事件
  const triggerUploadComplete = (
    fileName: string,
    file: File,
    _targetFolder: string
  ) => {
    uploadCompleteCallbacks.value.forEach(callback => {
      try {
        callback(fileName, file);
      } catch (error) {
        console.error("上传完成回调执行失败:", error);
      }
    });
  };

  // 计算属性
  const totalFiles = computed(() => uploadFiles.value.length);
  const completedFiles = computed(
    () => uploadFiles.value.filter(f => f.status === "completed").length
  );
  const uploadingFiles = computed(() =>
    uploadFiles.value.filter(f => f.status === "uploading")
  );
  const uploadingFilesCount = computed(() => uploadingFiles.value.length);
  const hasUploadingFiles = computed(() => uploadingFilesCount.value > 0);

  // 上传摘要信息（用于最小化图标显示）
  const uploadSummary = computed(() => {
    const total = uploadFiles.value.length;
    const completed = completedFiles.value;
    const uploading = uploadingFilesCount.value;
    const failed = uploadFiles.value.filter(f => f.status === "error").length;

    // 计算总体进度
    const totalProgress =
      total > 0
        ? Math.round(
            uploadFiles.value.reduce((sum, file) => sum + file.progress, 0) /
              total
          )
        : 0;

    return {
      total,
      completed,
      uploading,
      failed,
      pending: total - completed - uploading - failed,
      overallProgress: totalProgress
    };
  });

  // 分片上传配置
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB分片大小
  const MAX_CONCURRENT_UPLOADS = 3; // 最大并发上传数

  // 验证配置
  const validationConfig: ValidationConfig = {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxTotalSize: 5 * 1024 * 1024 * 1024, // 5GB
    allowedTypes: [], // 空数组表示允许所有类型
    maxFilesCount: 100,
    checkNetwork: true,
    checkQuota: false // 设为 true 需要后端支持
  };

  // 方法：添加文件到上传列表
  const addFiles = async (files: File[]) => {
    // 上传前验证
    const currentFiles = uploadFiles.value.map(f => f.file);
    const validationResults = await validateFilesBeforeUpload(
      files,
      currentFiles,
      validationConfig
    );

    // 检查验证结果
    const errorMessage = getValidationErrorMessage(validationResults);
    if (errorMessage) {
      // 找到第一个严重错误（非警告）
      const hasBlockingError = validationResults.some(
        r => !r.valid && r.code !== "NETWORK_SLOW"
      );

      if (hasBlockingError) {
        // 阻止性错误，显示错误消息并返回
        ElMessage.error({
          message: errorMessage,
          duration: 5000,
          showClose: true
        });
        return;
      } else {
        // 仅警告，显示警告消息但继续
        ElMessage.warning({
          message: errorMessage,
          duration: 3000,
          showClose: true
        });
      }
    }

    // 验证通过，创建上传文件对象
    const newFiles = files.map(file => {
      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      return {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "waiting" as UploadStatus,
        uploadedSize: 0,
        currentChunk: 0,
        totalChunks,
        targetFolder: currentFolder.value,
        abortController: new AbortController()
      };
    });

    uploadFiles.value.push(...newFiles);

    // 成功添加文件提示
    ElMessage.success({
      message: `成功添加 ${files.length} 个文件到上传队列`,
      duration: 2000
    });

    // 自动开始上传未完成的文件
    startUpload();
  };

  // 方法：开始上传
  const startUpload = async () => {
    const waitingFiles = uploadFiles.value.filter(f => f.status === "waiting");
    const currentlyUploading = uploadingFilesCount.value;

    // 控制并发数量
    const filesToStart = waitingFiles.slice(
      0,
      MAX_CONCURRENT_UPLOADS - currentlyUploading
    );

    for (const file of filesToStart) {
      uploadFile(file);
    }
  };

  // 方法：上传单个文件
  const uploadFile = async (fileItem: UploadFile) => {
    fileItem.status = "uploading";

    // 初始化速度计算器
    const speedCalculator = speedCalculatorManager.getCalculator(fileItem.id);
    if (fileItem.currentChunk === 0) {
      // 新上传，重新开始计算
      speedCalculator.start(fileItem.file.size);
    }

    try {
      // 分片上传逻辑
      for (
        let chunkIndex = fileItem.currentChunk;
        chunkIndex < fileItem.totalChunks;
        chunkIndex++
      ) {
        // 检查是否被暂停（重新读取状态，因为可能被外部修改）
        if ((fileItem as UploadFile).status === "paused") {
          return;
        }

        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileItem.file.size);
        const chunk = fileItem.file.slice(start, end);

        // 上传分片
        await uploadChunk(fileItem, chunk, chunkIndex);

        // 更新进度
        fileItem.currentChunk = chunkIndex + 1;
        fileItem.uploadedSize = end;
        fileItem.progress = Math.round(
          (fileItem.uploadedSize / fileItem.file.size) * 100
        );

        // 更新速度信息
        speedCalculator.addPoint(fileItem.uploadedSize);
        const currentSpeed = speedCalculator.getCurrentSpeed();
        const remainingTime = speedCalculator.getRemainingTime(
          fileItem.uploadedSize
        );

        fileItem.speed = currentSpeed;
        fileItem.remainingTime = remainingTime;
        fileItem.formattedSpeed =
          UploadSpeedCalculator.formatSpeed(currentSpeed);
        fileItem.formattedRemainingTime =
          UploadSpeedCalculator.formatRemainingTime(remainingTime);
      }

      // 完成上传
      if (fileItem.currentChunk >= fileItem.totalChunks) {
        fileItem.status = "completed";
        fileItem.progress = 100;

        // 清理速度计算器
        speedCalculatorManager.removeCalculator(fileItem.id);

        // 触发上传完成事件
        triggerUploadComplete(
          fileItem.name,
          fileItem.file,
          fileItem.targetFolder
        );

        // 继续处理队列中的下一个文件
        const nextFile = uploadFiles.value.find(f => f.status === "waiting");
        if (nextFile) {
          uploadFile(nextFile);
        }
      }
    } catch (error) {
      // 清理速度计算器
      speedCalculatorManager.removeCalculator(fileItem.id);

      // 如果文件已经被暂停，不要覆盖状态
      if ((fileItem as UploadFile).status !== "paused") {
        fileItem.status = "error";
        if (error instanceof Error) {
          if (error.message.includes("存储空间不足")) {
            fileItem.error = "存储空间不足，请清理浏览器缓存后重试";
          } else if (error.message.includes("网络连接失败")) {
            fileItem.error = "网络连接失败，请重试";
          } else if (error.message.includes("上传已取消")) {
            // 这是由于暂停或删除导致的取消，不显示错误
            return;
          } else {
            fileItem.error = error.message;
          }
        } else {
          fileItem.error = "上传失败";
        }
        console.error("文件上传失败:", error);
      }
    }
  };

  // 方法：上传分片（简化版本，实际项目中需要替换为真实的API调用）
  const uploadChunk = async (
    uploadFile: UploadFile,
    chunk: Blob,
    chunkIndex: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 检查是否被中断
      if (uploadFile.abortController?.signal.aborted) {
        reject(new Error("上传已取消"));
        return;
      }

      // 内存检查：如果内存使用过高，暂停一下让垃圾回收
      if (isMemoryHigh(85)) {
        console.warn("[内存优化] 内存使用过高，暂停100ms等待垃圾回收");
        setTimeout(() => {
          // 继续上传
        }, 100);
      }

      // 模拟网络延迟（500-1500ms）
      const delay = Math.random() * 1000 + 500;

      const timeoutId = setTimeout(() => {
        // 模拟1%的网络错误概率
        if (Math.random() < 0.01) {
          reject(new Error("网络连接失败，请重试"));
          return;
        }

        // 更新进度
        const chunkProgress = ((chunkIndex + 1) / uploadFile.totalChunks) * 100;
        uploadFile.progress = Math.round(chunkProgress);

        console.log(
          `✅ 文件 ${uploadFile.name} 分片 ${chunkIndex + 1}/${uploadFile.totalChunks} 上传成功`
        );
        resolve();
      }, delay);

      // 监听中断信号
      uploadFile.abortController?.signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new Error("上传已取消"));
      });

      // TODO: 在实际项目中，这里应该调用真实的API上传接口
      // 示例：
      // const formData = new FormData();
      // formData.append("file", chunk);
      // formData.append("fileName", uploadFile.name);
      // formData.append("chunkIndex", chunkIndex.toString());
      // formData.append("totalChunks", uploadFile.totalChunks.toString());
      // formData.append("fileId", uploadFile.id);
      //
      // axios.post('/api/upload/chunk', formData, {
      //   signal: uploadFile.abortController?.signal
      // })
      // .then(() => resolve())
      // .catch((error) => reject(error));
    });
  };

  // 方法：暂停上传
  const pauseUpload = (fileId: string) => {
    const file = uploadFiles.value.find(f => f.id === fileId);
    if (file && file.status === "uploading") {
      file.status = "paused";
      file.abortController?.abort();
      file.abortController = new AbortController();
    }
  };

  // 方法：继续上传
  const resumeUpload = (fileId: string) => {
    const file = uploadFiles.value.find(f => f.id === fileId);
    if (file && file.status === "paused") {
      file.status = "waiting";
      uploadFile(file);
    }
  };

  // 方法：删除文件
  const removeFile = (fileId: string) => {
    const fileIndex = uploadFiles.value.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      const file = uploadFiles.value[fileIndex];
      // 如果正在上传，先取消
      if (file.status === "uploading") {
        file.abortController?.abort();
      }
      // 清理速度计算器
      speedCalculatorManager.removeCalculator(fileId);
      uploadFiles.value.splice(fileIndex, 1);
    }
  };

  // 方法：暂停所有上传
  const pauseAllUploads = () => {
    uploadFiles.value.forEach(file => {
      if (file.status === "uploading" || file.status === "waiting") {
        pauseUpload(file.id);
      }
    });
  };

  // 方法：继续所有上传
  const resumeAllUploads = () => {
    uploadFiles.value.forEach(file => {
      if (file.status === "paused") {
        resumeUpload(file.id);
      }
    });
  };

  // 方法：清空已完成的文件
  const clearCompletedFiles = () => {
    uploadFiles.value = uploadFiles.value.filter(f => f.status !== "completed");
  };

  // 方法：显示上传弹窗
  const showModal = () => {
    isModalVisible.value = true;
  };

  // 方法：隐藏上传弹窗
  const hideModal = () => {
    isModalVisible.value = false;
  };

  // 方法：切换最小化状态
  const toggleMinimize = () => {
    isMinimized.value = !isMinimized.value;
  };

  // 方法：最小化弹窗
  const minimizeModal = () => {
    isMinimized.value = true;
  };

  // 方法：展开弹窗
  const expandModal = () => {
    isMinimized.value = false;
    isModalVisible.value = true;
  };

  // 方法：设置当前文件夹
  const setCurrentFolder = (folderName: string) => {
    currentFolder.value = folderName;
  };

  // 方法：格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // 内存监控：启动监控
  memoryMonitor.start(5000); // 每5秒检查一次内存

  // 内存监控：添加回调
  memoryMonitor.onMemoryChange(memoryInfo => {
    if (memoryInfo.usagePercent > 85) {
      console.warn(
        `[上传内存警告] 当前内存使用率: ${memoryInfo.usagePercent}%`
      );
    }
  });

  // 清理：在 store 销毁时停止监控
  onUnmounted(() => {
    memoryMonitor.stop();
    blobURLManager.revokeAll();
    speedCalculatorManager.clear();
  });

  return {
    // 状态
    uploadFiles,
    isModalVisible,
    isMinimized,
    currentFolder,
    uploadCompleteCallbacks,

    // 计算属性
    totalFiles,
    completedFiles,
    uploadingFiles,
    hasUploadingFiles,
    uploadSummary,

    // 方法
    addFiles,
    startUpload,
    pauseUpload,
    resumeUpload,
    removeFile,
    pauseAllUploads,
    resumeAllUploads,
    clearCompletedFiles,
    showModal,
    hideModal,
    toggleMinimize,
    minimizeModal,
    expandModal,
    setCurrentFolder,
    formatFileSize,

    // 事件回调方法
    onUploadComplete,
    offUploadComplete,
    triggerUploadComplete
  };
});
