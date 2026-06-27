import { storageLocal } from "@/utils/global";
export const openNewTabs = (url: string, id: string = "newWindows") => {
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("rel", "noopener noreferrer");
  a.setAttribute("target", "_blank");
  a.setAttribute("id", id);
  if (!document.getElementById(id)) {
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

/**格式化日期为 yyyy-MM-dd HH:mm */
const formatDateTime = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}：${pad(date.getMinutes())}`;
};

/**导出文件 */
export const exportFile = (data: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.setAttribute(
    "download",
    `${fileName}_${formatDateTime(new Date())}.xlsx`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 将字典对象转换为 { label, value } 的对象数组
 * @param dict 字典对象
 * @param type 'number' - value 尽可能转为数字; 'string' - value 保持字符串
 */
export function dictToOptions<T extends Record<string | number, string>>(
  dict: T,
  type: "number" | "string" = "number"
): { label: string; value: string | number }[] {
  return Object.entries(dict).map(([key, label]) => ({
    label,
    value: type === "string" ? key : isNaN(Number(key)) ? key : Number(key)
  }));
}

export function timeToTimestamp(timeStr) {
  // 解析时分秒
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);

  // 获取当前日期
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // 创建新的日期对象，时间设为输入的时分秒
  const targetDate = new Date(year, month, day, hours, minutes, seconds);

  // 返回时间戳（毫秒）
  return targetDate.getTime();

  // 如果需要秒级时间戳
  // return Math.floor(targetDate.getTime() / 1000);
}

