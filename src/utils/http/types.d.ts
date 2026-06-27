import type {
  Method,
  AxiosError,
  AxiosResponse,
  AxiosRequestConfig
} from "axios";

export type resultType = {
  accessToken?: string;
};

export type RequestMethods = Extract<
  Method,
  "get" | "post" | "put" | "delete" | "patch" | "option" | "head"
>;

export interface PureHttpError extends AxiosError {
  isCancelRequest?: boolean;
}

export interface PureHttpResponse<T = unknown> extends AxiosResponse<T> {
  config: PureHttpRequestConfig;
}

/**
 * 标准 API 响应格式
 */
export interface StandardApiResponse<T = unknown> {
  /** 响应码 */
  code: string;
  /** 响应数据 */
  data: T;
  /** 响应消息 */
  message: string;
}

export interface PureHttpRequestConfig extends AxiosRequestConfig {
  beforeRequestCallback?: (request: PureHttpRequestConfig) => void;
  beforeResponseCallback?: <T = unknown>(response: PureHttpResponse<T>) => void;
  /** 是否返回完整响应对象（包括 headers、status 等），默认 false，仅返回 data */
  returnFullResponse?: boolean;
  /** 是否跳过错误拦截处理，默认 false，会统一拦截并提示错误 */
  skipErrorIntercept?: boolean;
  /** 错误码白名单，这些错误码不会触发统一错误提示 */
  errorCodeWhitelist?: string[];
}

export default class PureHttp {
  request<T = unknown>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T>;
  post<T = unknown, P = unknown>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T>;
  get<T = unknown, P = unknown>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T>;
}
