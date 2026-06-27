/**
 * 下载文件工具函数
 * @param response 响应对象
 * @param fileName 文件名
 * @returns Promise<void>
 */
export const downloadFile = async (
  response: Response,
  fileName: string
): Promise<void> => {
  if (!response.ok) {
    throw new Error(`下载失败: ${response.status}`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * 从URL中提取文件名
 * @param url URL字符串
 * @returns 文件名
 */
export const getFileNameFromUrl = (url: string): string => {
  return url.split("/").pop() || "";
};
