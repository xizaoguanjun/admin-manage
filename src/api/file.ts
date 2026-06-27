// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore file-saver has no bundled types
import { saveAs } from "file-saver";
import { http } from "@/utils/http";

/** 普通上传最大 10MB，与后端一致 */
export const DIRECT_UPLOAD_MAX_SIZE = 10 * 1024 * 1024;

export interface FileItem {
  id: number;
  folderId: number;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  uploaderId: number;
  status: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileListQuery {
  folderId: number;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface FileListResult {
  code: string;
  message: string;
  data: {
    list: FileItem[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export interface FileResult {
  code: string;
  message: string;
  data: FileItem;
}

export interface ChunkStatusResult {
  code: string;
  message: string;
  data: {
    uploadedChunks: number[];
  };
}

export interface MergeFileParams {
  fileId: string;
  fileName: string;
  totalChunks: number;
  folderId: number;
  mimeType?: string;
}

export const getFileList = (params: FileListQuery) =>
  http.get<FileListResult>("/api/files", { params });

export const getFileById = (id: number) =>
  http.get<FileResult>(`/api/files/${id}`);

export const uploadFile = (file: File, folderId: number) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folderId", String(folderId));
  return http.post<FileResult>("/api/files/upload", { data: formData });
};

export const uploadFileChunk = (
  chunk: Blob,
  params: {
    fileId: string;
    fileName: string;
    chunkIndex: number;
    totalChunks: number;
    folderId: number;
    mimeType?: string;
  },
  signal?: AbortSignal
) => {
  const formData = new FormData();
  formData.append("file", chunk);
  formData.append("fileId", params.fileId);
  formData.append("fileName", params.fileName);
  formData.append("chunkIndex", String(params.chunkIndex));
  formData.append("totalChunks", String(params.totalChunks));
  formData.append("folderId", String(params.folderId));
  if (params.mimeType) {
    formData.append("mimeType", params.mimeType);
  }
  return http.request<{ code: string; message: string; data: unknown }>(
    "post",
    "/api/files/upload/chunk",
    { data: formData, signal },
    { skipErrorIntercept: false }
  );
};

export const getChunkStatus = (fileId: string, totalChunks: number) =>
  http.get<ChunkStatusResult>("/api/files/upload/chunk/status", {
    params: { fileId, totalChunks }
  });

export const mergeFileUpload = (data: MergeFileParams) =>
  http.post<FileResult>("/api/files/upload/merge", { data });

export const deleteFile = (id: number) =>
  http.request<{ code: string; message: string; data: null }>(
    "delete",
    `/api/files/${id}`
  );

export const getPreviewUrl = (id: number) => `/api/files/${id}/preview`;

export const downloadFile = async (id: number, fileName: string) => {
  const blob = await http.request<Blob>(
    "get",
    `/api/files/${id}/download`,
    { responseType: "blob" },
    { skipErrorIntercept: true }
  );
  saveAs(blob, fileName);
};

/** 带鉴权获取预览 Blob URL */
export const fetchPreviewBlobUrl = async (
  id: number,
  mimeType: string
): Promise<string> => {
  const blob = await http.request<Blob>(
    "get",
    `/api/files/${id}/preview`,
    { responseType: "blob" },
    { skipErrorIntercept: true }
  );
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
};
