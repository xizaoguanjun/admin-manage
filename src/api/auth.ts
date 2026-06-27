import { http } from "@/utils/http";
import type { DataInfo } from "@/utils/auth";

export interface LoginParams {
  username: string;
  password: string;
}

export interface RegisterParams {
  username: string;
  password: string;
  nickname?: string;
  phone?: string;
}

export interface LoginResult {
  code: string;
  message: string;
  data: DataInfo<string>;
}

export interface RegisterResult {
  code: string;
  message: string;
  data: { id: number; username: string };
}

export const loginApi = (data: LoginParams) =>
  http.post<LoginResult>("/api/auth/login", { data });

export const registerApi = (data: RegisterParams) =>
  http.post<RegisterResult>("/api/auth/register", { data });
