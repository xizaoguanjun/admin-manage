import { http } from "@/utils/http";

export interface UserItem {
  id: number;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  avatar: string;
  status: number;
  roles: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserListQuery {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: number;
}

export interface UserListResult {
  code: string;
  message: string;
  data: {
    list: UserItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface UserResult {
  code: string;
  message: string;
  data: UserItem;
}

export interface CreateUserParams {
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  phone?: string;
  roles?: string;
  status?: number;
  avatar?: string;
}

export interface UpdateUserParams {
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  roles?: string;
  status?: number;
}

export const getUserList = (params: UserListQuery) =>
  http.get<UserListResult>("/api/users", { params });

export const getUserById = (id: number) =>
  http.get<UserResult>(`/api/users/${id}`);

export const createUser = (data: CreateUserParams) =>
  http.post<UserResult>("/api/users", { data });

export const updateUser = (id: number, data: UpdateUserParams) =>
  http.request<UserResult>("put", `/api/users/${id}`, { data });

export const deleteUser = (id: number) =>
  http.request<{ code: string; message: string; data: null }>(
    "delete",
    `/api/users/${id}`
  );
