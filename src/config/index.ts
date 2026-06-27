import axios from "axios";
import type { App } from "vue";

let config: Record<string, unknown> = {};
const { VITE_PUBLIC_PATH } = import.meta.env;

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

const getConfig = (key?: string): PlatformConfigs => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data: Record<string, unknown> | unknown = config;
      arr.forEach(v => {
        if (
          data &&
          typeof (data as Record<string, unknown>)[v] !== "undefined"
        ) {
          data = (data as Record<string, unknown>)[v];
        } else {
          data = null;
        }
      });
      return data as PlatformConfigs;
    }
  }
  return config as PlatformConfigs;
};

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<PlatformConfigs> => {
  app.config.globalProperties.$config = getConfig();

  try {
    const response = await axios({
      method: "get",
      url: `${VITE_PUBLIC_PATH}platform-config.json`,
      timeout: 2000 // ✅ 添加超时设置，避免长时间等待
    });

    const { data: config } = response;
    let $config = app.config.globalProperties.$config;
    // 自动注入系统配置
    if (app && $config && typeof config === "object") {
      $config = Object.assign($config, config);
      app.config.globalProperties.$config = $config;
      // 设置全局配置
      setConfig($config);
    }
    return $config as PlatformConfigs;
  } catch (error) {
    // ✅ 修复：不抛出错误，而是返回默认配置，避免阻塞应用启动
    console.warn("[getPlatformConfig] 获取平台配置失败，使用默认配置:", error);
    const defaultConfig = getConfig() as PlatformConfigs;
    app.config.globalProperties.$config = defaultConfig;
    return defaultConfig;
  }
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

/**
 * 获取 CDN 资源 URL
 * @param type - 资源类型：'base' | 'images' | 'fonts' | 'files'
 * @param path - 资源路径（可选），如果提供则拼接到对应CDN路径后
 * @returns CDN 完整 URL
 */
export const getCdnUrl = (
  type: "base" | "images" | "fonts" | "files" = "base",
  path?: string
): string => {
  const config = getConfig();
  const cdn = config?.CDN;

  // 默认CDN地址
  const defaultCdn = {
    base: "https://staticcdn.jinbizhihui.com",
    images: "https://staticcdn.jinbizhihui.com/images/data-center-admin",
    fonts: "https://staticcdn.jinbizhihui.com/fonts",
    files: "https://staticcdn.jinbizhihui.com/files"
  };

  const baseUrl = cdn?.[type] || defaultCdn[type];

  // 如果提供了路径，则拼接
  if (path) {
    // 确保路径以 / 开头
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }

  return baseUrl;
};

/**
 * 获取图片资源 URL
 * @param imageName - 图片文件名
 * @returns 图片完整 URL
 */
export const getImageUrl = (imageName: string): string => {
  return getCdnUrl("images", imageName);
};

/**
 * 获取字体资源 URL
 * @param fontName - 字体文件名
 * @returns 字体完整 URL
 */
export const getFontUrl = (fontName: string): string => {
  return getCdnUrl("fonts", fontName);
};

export { getConfig, setConfig, responsiveStorageNameSpace };
