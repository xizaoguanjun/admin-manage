/**
 * 文件上传前验证工具
 * 包含文件大小、类型、配额、网络等验证
 */

// 验证结果接口
export interface ValidationResult {
  valid: boolean; // 是否通过验证
  error?: string; // 错误信息
  code?: string; // 错误代码
}

// 验证配置接口
export interface ValidationConfig {
  maxFileSize?: number; // 单文件最大大小（字节），默认 500MB
  maxTotalSize?: number; // 总文件最大大小（字节），默认 5GB
  allowedTypes?: string[]; // 允许的文件类型（MIME类型或扩展名）
  maxFilesCount?: number; // 最大文件数量，默认 100
  checkNetwork?: boolean; // 是否检查网络状态，默认 true
  checkQuota?: boolean; // 是否检查配额，默认 false（需要后端支持）
}

// 默认配置
const DEFAULT_CONFIG: Required<ValidationConfig> = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  maxTotalSize: 5 * 1024 * 1024 * 1024, // 5GB
  allowedTypes: [], // 空数组表示允许所有类型
  maxFilesCount: 100,
  checkNetwork: true,
  checkQuota: false
};

/**
 * 文件大小验证器
 */
export function validateFileSize(
  file: File,
  maxSize: number = DEFAULT_CONFIG.maxFileSize
): ValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    const fileSizeMB = Math.round(file.size / 1024 / 1024);
    return {
      valid: false,
      code: "FILE_SIZE_EXCEEDED",
      error: `文件 "${file.name}" 大小 ${fileSizeMB}MB 超过限制 ${maxSizeMB}MB`
    };
  }
  return { valid: true };
}

/**
 * 总文件大小验证器
 */
export function validateTotalSize(
  files: File[],
  maxTotalSize: number = DEFAULT_CONFIG.maxTotalSize
): ValidationResult {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    const maxSizeGB = (maxTotalSize / 1024 / 1024 / 1024).toFixed(2);
    const totalSizeGB = (totalSize / 1024 / 1024 / 1024).toFixed(2);
    return {
      valid: false,
      code: "TOTAL_SIZE_EXCEEDED",
      error: `总文件大小 ${totalSizeGB}GB 超过限制 ${maxSizeGB}GB`
    };
  }
  return { valid: true };
}

/**
 * 文件类型验证器
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = []
): ValidationResult {
  // 空数组表示允许所有类型
  if (allowedTypes.length === 0) {
    return { valid: true };
  }

  const fileType = file.type.toLowerCase();
  const fileExt = file.name.split(".").pop()?.toLowerCase();

  // 检查 MIME 类型或扩展名
  const isTypeAllowed = allowedTypes.some(
    type =>
      type.toLowerCase() === fileType ||
      type.toLowerCase() === `.${fileExt}` ||
      type.toLowerCase() === fileExt
  );

  if (!isTypeAllowed) {
    return {
      valid: false,
      code: "FILE_TYPE_NOT_ALLOWED",
      error: `文件 "${file.name}" 类型不支持。允许的类型: ${allowedTypes.join(", ")}`
    };
  }

  return { valid: true };
}

/**
 * 文件数量验证器
 */
export function validateFilesCount(
  currentCount: number,
  newFilesCount: number,
  maxCount: number = DEFAULT_CONFIG.maxFilesCount
): ValidationResult {
  const totalCount = currentCount + newFilesCount;
  if (totalCount > maxCount) {
    return {
      valid: false,
      code: "FILES_COUNT_EXCEEDED",
      error: `文件数量超过限制（当前 ${currentCount} + 新增 ${newFilesCount} = ${totalCount}，最大 ${maxCount}）`
    };
  }
  return { valid: true };
}

/**
 * 网络状态检测器
 */
export function checkNetworkStatus(): ValidationResult {
  if (!navigator.onLine) {
    return {
      valid: false,
      code: "NETWORK_OFFLINE",
      error: "网络连接已断开，请检查网络后重试"
    };
  }

  // 检查网络连接类型（如果支持）
  type NavigatorWithConn = Navigator & {
    connection?: { effectiveType?: string };
    mozConnection?: { effectiveType?: string };
    webkitConnection?: { effectiveType?: string };
  };

  const nav = navigator as NavigatorWithConn;
  const connection =
    nav.connection || nav.mozConnection || nav.webkitConnection;

  if (connection) {
    // 如果是慢速连接，给出警告（但不阻止）
    const slowTypes = ["slow-2g", "2g"];
    const effectiveType = connection.effectiveType ?? "";
    if (slowTypes.includes(effectiveType)) {
      return {
        valid: true, // 不阻止，只是警告
        code: "NETWORK_SLOW",
        error: "当前网络速度较慢，上传可能需要较长时间"
      };
    }
  }

  return { valid: true };
}

/**
 * 配额检查器（模拟，实际需要调用后端 API）
 */
export async function checkStorageQuota(
  filesTotalSize: number
): Promise<ValidationResult> {
  try {
    // 模拟后端 API 调用延迟
    await new Promise(resolve => setTimeout(resolve, 100));

    // TODO: 替换为实际的后端 API 调用
    // const response = await fetch('/api/storage/quota');
    // const data = await response.json();

    // 模拟配额数据
    const mockQuota = {
      used: 1024 * 1024 * 1024, // 已用 1GB
      total: 10 * 1024 * 1024 * 1024, // 总共 10GB
      available: 9 * 1024 * 1024 * 1024 // 可用 9GB
    };

    if (filesTotalSize > mockQuota.available) {
      const requiredGB = (filesTotalSize / 1024 / 1024 / 1024).toFixed(2);
      const availableGB = (mockQuota.available / 1024 / 1024 / 1024).toFixed(2);
      return {
        valid: false,
        code: "QUOTA_EXCEEDED",
        error: `存储空间不足。需要 ${requiredGB}GB，剩余 ${availableGB}GB`
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("检查配额失败:", error);
    return {
      valid: true, // 检查失败时不阻止上传
      code: "QUOTA_CHECK_FAILED",
      error: "无法检查存储配额，将继续上传"
    };
  }
}

/**
 * 综合验证器 - 执行所有验证
 */
export async function validateFilesBeforeUpload(
  files: File[],
  currentFiles: File[] = [],
  config: ValidationConfig = {}
): Promise<ValidationResult[]> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const results: ValidationResult[] = [];

  // 1. 验证文件数量
  const countResult = validateFilesCount(
    currentFiles.length,
    files.length,
    finalConfig.maxFilesCount
  );
  if (!countResult.valid) {
    return [countResult];
  }

  // 2. 验证每个文件的大小和类型
  for (const file of files) {
    // 文件大小验证
    const sizeResult = validateFileSize(file, finalConfig.maxFileSize);
    if (!sizeResult.valid) {
      results.push(sizeResult);
      continue;
    }

    // 文件类型验证
    const typeResult = validateFileType(file, finalConfig.allowedTypes);
    if (!typeResult.valid) {
      results.push(typeResult);
      continue;
    }
  }

  // 如果有单个文件验证失败，直接返回
  if (results.length > 0) {
    return results;
  }

  // 3. 验证总文件大小
  const allFiles = [...currentFiles, ...files];
  const totalSizeResult = validateTotalSize(allFiles, finalConfig.maxTotalSize);
  if (!totalSizeResult.valid) {
    return [totalSizeResult];
  }

  // 4. 检查网络状态
  if (finalConfig.checkNetwork) {
    const networkResult = checkNetworkStatus();
    if (!networkResult.valid) {
      return [networkResult];
    }
    // 慢速网络警告
    if (networkResult.code === "NETWORK_SLOW") {
      results.push(networkResult);
    }
  }

  // 5. 检查配额（可选）
  if (finalConfig.checkQuota) {
    const totalSize = allFiles.reduce((sum, file) => sum + file.size, 0);
    const quotaResult = await checkStorageQuota(totalSize);
    if (!quotaResult.valid) {
      return [quotaResult];
    }
  }

  // 所有验证通过
  if (results.length === 0) {
    results.push({ valid: true });
  }

  return results;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 获取友好的错误提示
 */
export function getValidationErrorMessage(results: ValidationResult[]): string {
  const errors = results.filter(r => !r.valid || r.code === "NETWORK_SLOW");
  if (errors.length === 0) return "";
  return errors.map(e => e.error).join("\n");
}
