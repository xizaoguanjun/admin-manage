import { http } from "@/utils/http";

export interface FolderNode {
  id: number;
  name: string;
  parentId: number | null;
  children?: FolderNode[];
}

export interface FolderItem {
  id: number;
  name: string;
  parentId: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderTreeResult {
  code: string;
  message: string;
  data: FolderNode[];
}

export interface FolderResult {
  code: string;
  message: string;
  data: FolderItem;
}

export interface CreateFolderParams {
  name: string;
  parentId?: number | null;
}

export interface UpdateFolderParams {
  name?: string;
  parentId?: number | null;
}

export const getFolderTree = () =>
  http.get<FolderTreeResult>("/api/folders/tree");

export const createFolder = (data: CreateFolderParams) =>
  http.post<FolderResult>("/api/folders", { data });

export const updateFolder = (id: number, data: UpdateFolderParams) =>
  http.request<FolderResult>("put", `/api/folders/${id}`, { data });

export const deleteFolder = (id: number) =>
  http.request<{ code: string; message: string; data: null }>(
    "delete",
    `/api/folders/${id}`
  );
