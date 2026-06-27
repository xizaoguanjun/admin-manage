import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig,
  StandardApiResponse
} from "./types.d";
import { stringify } from "qs";
import { getToken, formatToken, removeToken } from "@/utils/auth";
import { useUserStoreHook } from "@/store/modules/user";
import { httpEnum } from "jinbi-utils";
import { message } from "@/utils/message";
// import { localForage } from "../localforage";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求超时时间
  timeout: 60000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** `token`过期后，暂存待执行的请求 */
  // TODO: 等刷新token接口准备好后，恢复使用
  private static requests: Array<(token: string) => void> = [];

  /** 防止重复刷新`token` */
  // TODO: 等刷新token接口准备好后，恢复使用
  private static isRefreshing = false;

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  // TODO: 等刷新token接口准备好后，恢复使用
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise<PureHttpRequestConfig>(resolve => {
      PureHttp.requests.push((token: string) => {
        // 设置Authorization请求头（登录后token的请求头字段名）
        // 步骤1：获取新的token
        // 步骤2：通过formatToken函数格式化为Bearer {token}格式
        // 步骤3：设置到请求头的Authorization字段
        if (config.headers) {
          config.headers["Authorization"] = formatToken(token);
        }
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (
        config: InternalAxiosRequestConfig
      ): Promise<InternalAxiosRequestConfig> => {
        // console.log("config", config.url, typeof config.data);
        // const localData = localForage();
        // if (config.data && typeof config.data === "object") {
        //   if ("limit" in config.data && "offset" in config.data) {
        //     const paramsMap = (await localData.getItem("export-params")) as Map<
        //       string,
        //       unknown
        //     >;
        //     if (!paramsMap) {
        //       const paramsMap = new Map();
        //       paramsMap.set(config.url, config.data);
        //       localData.setItem("export-params", paramsMap);
        //     } else {
        //       const currExportParams = paramsMap.get(config.url as string); // 获取出当前url的导出方法
        //       if (!currExportParams) {
        //         // 如果不存在当前url的参数
        //         paramsMap.set(config.url as string, config.data);
        //       }
        //       localData.setItem("export-params", paramsMap);
        //     }
        //   }
        // }
        window.CURR_HTTP_URL = config.url as string;
        window.CURR_HTTP_DATA = config.data as unknown;
        const httpConfig = config as PureHttpRequestConfig;
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof httpConfig.beforeRequestCallback === "function") {
          httpConfig.beforeRequestCallback(httpConfig);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(httpConfig);
          return config;
        }
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = ["/refresh-token", "/login"];
        if (config.url && whiteList.some(url => config.url!.endsWith(url))) {
          return config;
        }
        return new Promise<InternalAxiosRequestConfig>(resolve => {
          const data = getToken();
          if (data) {
            const now = new Date().getTime();
            const expired = parseInt(data.expires) - now <= 0;
            if (expired) {
              // TODO: 等刷新token接口准备好后，恢复自动刷新功能
              // 目前暂时禁用自动刷新，token过期时直接跳转登录页
              removeToken();
              useUserStoreHook().logOut();
              message("登录已过期，请重新登录", { type: "warning" });
              // 拒绝请求，避免继续发送
              return Promise.reject(
                new Error("Token expired, please login again")
              );
            } else {
              // 设置Authorization请求头（登录后token的请求头字段名）
              // 步骤1：获取refreshToken
              // 步骤2：通过formatToken函数格式化为Bearer {token}格式
              // 步骤3：设置到请求头的Authorization字段
              if (config.headers) {
                config.headers["Authorization"] = formatToken(
                  data.refreshToken
                );
              }
              resolve(config);
            }
          } else {
            resolve(config);
          }
        });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * 检测是否为文件流响应
   */
  private isFileStreamResponse(config: PureHttpRequestConfig): boolean {
    const responseType = config.responseType;
    return (
      responseType === "blob" ||
      responseType === "arraybuffer" ||
      responseType === "stream"
    );
  }

  /**
   * 处理业务错误码
   * @throws 当业务错误码不是成功码时，抛出包含错误信息的错误对象
   */
  private handleBusinessError(
    responseData: unknown,
    config: PureHttpRequestConfig
  ): void {
    // 跳过错误拦截
    if (config.skipErrorIntercept) {
      return;
    }

    // 检查是否为标准 API 响应格式
    if (
      !responseData ||
      typeof responseData !== "object" ||
      !("code" in responseData)
    ) {
      return;
    }

    const apiResponse = responseData as StandardApiResponse;
    const code = apiResponse.code;

    // 成功码，无需处理
    if (code === httpEnum.CODES.Success) {
      return;
    }

    // 检查错误码白名单（包括全局白名单和请求配置中的白名单）
    const whitelist = [
      ...httpEnum.ERR_CODE_WHITE_LIST,
      ...(config.errorCodeWhitelist || [])
    ];

    if (whitelist.includes(code)) {
      return;
    }

    // 显示错误提示
    const errorMessage = apiResponse.message || "请求失败，请稍后重试";
    message(errorMessage, { type: "error" });

    // 抛出错误，让调用方可以通过 catch 处理
    const error = new Error(errorMessage) as Error & {
      code: string;
      response?: StandardApiResponse;
    };
    error.code = code;
    error.response = apiResponse;
    throw error;
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    // 注意：如果后端在响应头中设置了 Set-Cookie，浏览器会自动处理并设置 cookie
    // 这不是前端代码设置的，而是浏览器根据 HTTP 协议自动处理的
    // 如果需要阻止浏览器处理 Set-Cookie，需要后端配合移除响应头中的 Set-Cookie
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse): AxiosResponse | Promise<never> => {
        const $config = response.config;

        // 文件流响应，直接返回完整响应对象（不检查业务错误码，因为文件流响应格式不同）
        if (this.isFileStreamResponse($config)) {
          return response as unknown as AxiosResponse;
        }

        // 处理业务错误码（如果检测到错误会抛出异常）
        // 注意：文件流响应已在上方处理，不会执行到这里
        try {
          this.handleBusinessError(response.data, $config);
        } catch (error) {
          // 将业务错误转换为 Promise rejection，让调用方可以通过 catch 处理
          return Promise.reject(error);
        }

        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          // 如果配置了返回完整响应，则返回完整响应对象
          if ($config.returnFullResponse) {
            return response as unknown as AxiosResponse;
          }
          // 返回修改后的响应对象，将 data 作为响应数据
          return response as unknown as AxiosResponse;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          // 如果配置了返回完整响应，则返回完整响应对象
          if ($config.returnFullResponse) {
            return response as unknown as AxiosResponse;
          }
          // 返回修改后的响应对象，将 data 作为响应数据
          return response as unknown as AxiosResponse;
        }

        // 如果配置了返回完整响应，则返回完整响应对象
        if ($config.returnFullResponse) {
          return response as unknown as AxiosResponse;
        }

        // 默认返回响应对象
        return response as unknown as AxiosResponse;
      },
      (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);

        // 取消请求，直接返回错误
        if ($error.isCancelRequest) {
          return Promise.reject($error);
        }

        const config = $error.config as PureHttpRequestConfig | undefined;

        // 跳过错误拦截
        if (config?.skipErrorIntercept) {
          return Promise.reject($error);
        }

        // 处理 HTTP 状态码错误
        if ($error.response) {
          let errorMessage = "请求失败，请稍后重试";

          // 尝试从响应数据中获取错误消息
          const responseData = $error.response.data;
          if (
            responseData &&
            typeof responseData === "object" &&
            "message" in responseData
          ) {
            errorMessage = (responseData.message as string) || "";
          }

          message(errorMessage, { type: "error" });
        } else if ($error.request) {
          // 网络错误
          // message("网络连接失败，请检查网络设置", { type: "error" });
        } else {
          // 其他错误
          const errorMessage = $error.message || "请求失败，请稍后重试";
          message(errorMessage, { type: "error" });
        }

        // 所有的响应异常 区分来源为取消请求/非取消请求
        return Promise.reject($error);
      }
    );
  }

  /** 通用请求工具函数 */
  public request<T = unknown>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;
    // ✅ 自动处理 FormData：移除 Content-Type，让浏览器自动设置
    if (config.data instanceof FormData) {
      config.headers = {
        ...config.headers,
        "Content-Type": undefined
      };
    }
    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then((response: PureHttpResponse) => {
          resolve(response.data as T);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /** 单独抽离的`post`工具函数 */
  public post<T = unknown, P = unknown>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /** 单独抽离的`get`工具函数 */
  public get<T = unknown, P = unknown>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }
}

export const http = new PureHttp();
