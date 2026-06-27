/**
 * 字体加载工具函数
 * 提供字体预加载和检测功能
 */

import { getConfig } from "@/config";

/**
 * 获取CDN字体URL
 * @param fontFile - 字体文件名
 */
function getCdnFontUrl(fontFile: string): string {
  const config = getConfig();
  const cdnFonts =
    config?.CDN?.fonts || "https://staticcdn.jinbizhihui.com/fonts";
  return `${cdnFonts}/${fontFile}`;
}

/**
 * 预加载单个字体
 * @param family - 字体族名称
 * @param weight - 字体字重
 * @param fileName - 字体文件名（woff2格式）
 * @returns Promise<FontFace>
 */
export function preloadFont(
  family: string,
  weight: number,
  fileName: string
): Promise<FontFace> {
  return new Promise((resolve, reject) => {
    try {
      const fontUrl = getCdnFontUrl(fileName);
      const fontFace = new FontFace(family, `url(${fontUrl})`, {
        weight: weight.toString(),
        style: "normal",
        display: "swap"
      });

      fontFace
        .load()
        .then(loadedFont => {
          // FontFaceSet.add 方法在某些 TypeScript 配置下可能不被识别
          const fonts = document.fonts as FontFaceSet & {
            add: (font: FontFace) => void;
          };
          fonts.add(loadedFont);
          resolve(loadedFont);
        })
        .catch(error => {
          console.error(`字体加载失败: ${family} ${weight}`, error);
          reject(error);
        });
    } catch (error) {
      console.error(`字体预加载错误: ${family} ${weight}`, error);
      reject(error);
    }
  });
}

/**
 * 预加载所有 Noto Sans SC 字体
 * @returns Promise<FontFace[]>
 */
export function preloadNotoFonts(): Promise<FontFace[]> {
  const fonts = [
    { weight: 400, file: "NotoSansSC-Regular.woff2" },
    { weight: 500, file: "NotoSansSC-Medium.woff2" },
    { weight: 700, file: "NotoSansSC-Bold.woff2" }
  ];

  const loadPromises = fonts.map(font =>
    preloadFont("Noto Sans SC", font.weight, font.file)
  );

  return Promise.all(loadPromises);
}

/**
 * 检查字体是否已加载
 * @param family - 字体族名称
 * @param weight - 字体字重（可选）
 * @returns boolean
 */
export function isFontLoaded(family: string, weight?: number): boolean {
  if (!document.fonts) {
    return false;
  }

  const fontSpec = weight ? `${weight} 12px "${family}"` : `12px "${family}"`;
  return document.fonts.check(fontSpec);
}

/**
 * 等待字体加载完成
 * @param family - 字体族名称
 * @param weight - 字体字重（可选）
 * @param timeout - 超时时间（毫秒），默认3000ms
 * @returns Promise<boolean>
 */
export function waitForFont(
  family: string,
  weight?: number,
  timeout = 3000
): Promise<boolean> {
  return new Promise(resolve => {
    if (isFontLoaded(family, weight)) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isFontLoaded(family, weight)) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        console.warn(`字体加载超时: ${family} ${weight || ""}`);
        resolve(false);
      }
    }, 100);
  });
}

/**
 * 预加载单个字体文件（通过link标签）
 * @param fontFile - 字体文件名
 */
export function preloadFontFile(fontFile: string): void {
  const fontUrl = getCdnFontUrl(fontFile);
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "font";
  link.type = "font/woff2";
  link.href = fontUrl;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}

/**
 * 批量预加载 Noto Sans SC 字体文件
 */
export function preloadNotoFontFiles(): void {
  const fontFiles = [
    "NotoSansSC-Regular.woff2",
    "NotoSansSC-Medium.woff2",
    "NotoSansSC-Bold.woff2"
  ];

  fontFiles.forEach(file => preloadFontFile(file));
}
