<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, View, Download, Delete, Document } from "@element-plus/icons-vue";
import {
  getFileList,
  deleteFile,
  downloadFile,
  type FileItem,
  type FileListQuery
} from "@/api/file";
import type { FolderNode } from "@/api/folder";
import { useFileUploadStore } from "@/store/modules/fileUpload";
import FileFolderTree from "./components/FileFolderTree.vue";
import FileUploadModal from "./components/FileUploadModal.vue";
import FilePreviewDialog from "./components/FilePreviewDialog.vue";

defineOptions({ name: "FileManagement" });

const uploadStore = useFileUploadStore();
const folderTreeRef = ref<InstanceType<typeof FileFolderTree>>();

const loading = ref(false);
const tableData = ref<FileItem[]>([]);
const total = ref(0);
const selectedFolderId = ref<number | null>(null);
const selectedFolderName = ref("全部文件");
const uploadVisible = ref(false);
const previewVisible = ref(false);
const previewFile = ref<FileItem | null>(null);

const query = reactive<FileListQuery>({
  folderId: 0,
  keyword: "",
  page: 1,
  pageSize: 10
});

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatMimeType(mime: string): string {
  if (!mime || mime === "application/octet-stream") return "未知";
  return mime.split("/").pop()?.toUpperCase() || mime;
}

async function fetchList() {
  if (!query.folderId) return;
  loading.value = true;
  try {
    const res = await getFileList(query);
    if (res.code === "00000") {
      tableData.value = res.data.list || [];
      total.value = res.data.total;
    }
  } catch {
    // error shown by interceptor
  } finally {
    loading.value = false;
  }
}

function handleFolderSelect(node: FolderNode) {
  selectedFolderId.value = node.id;
  selectedFolderName.value = node.name;
  query.folderId = node.id;
  query.page = 1;
  uploadStore.setCurrentFolder(node.id);
  fetchList();
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleReset() {
  query.keyword = "";
  query.page = 1;
  fetchList();
}

function handlePageChange() {
  fetchList();
}

function handleSizeChange() {
  query.page = 1;
  fetchList();
}

function openUpload() {
  if (selectedFolderId.value == null) {
    ElMessage.warning("请先选择文件夹");
    return;
  }
  uploadStore.setCurrentFolder(selectedFolderId.value);
  uploadVisible.value = true;
}

function handlePreview(row: FileItem) {
  previewFile.value = row;
  previewVisible.value = true;
}

async function handleDownload(row: FileItem) {
  try {
    await downloadFile(row.id, row.originalName);
  } catch {
    // error shown by interceptor
  }
}

async function handleDelete(row: FileItem) {
  await ElMessageBox.confirm(
    `确定要删除文件「${row.originalName}」吗？`,
    "删除确认",
    { type: "warning" }
  );
  try {
    await deleteFile(row.id);
    ElMessage.success("删除成功");
    fetchList();
  } catch {
    // error shown by interceptor
  }
}

function handleUploadComplete() {
  fetchList();
}

watch(selectedFolderId, (id: number | null) => {
  if (id) query.folderId = id;
});
</script>

<template>
  <div class="p-4 file-management">
    <div class="file-layout">
      <!-- 左侧文件夹树 -->
      <el-card class="folder-panel" shadow="never">
        <FileFolderTree
          ref="folderTreeRef"
          v-model:selected-id="selectedFolderId"
          @select="handleFolderSelect"
        />
      </el-card>

      <!-- 右侧文件列表 -->
      <div class="file-content">
        <el-card class="mb-4" shadow="never">
          <el-form :inline="true" :model="query">
            <el-form-item label="文件名">
              <el-input
                v-model="query.keyword"
                placeholder="搜索文件名"
                clearable
                style="width: 200px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-base font-medium">
                {{ selectedFolderName }} - 文件列表
              </span>
              <el-button type="primary" @click="openUpload">
                <el-icon class="mr-1"><Upload /></el-icon>
                上传文件
              </el-button>
            </div>
          </template>

          <el-table v-loading="loading" :data="tableData" border stripe>
            <el-table-column label="名称" min-width="200" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="flex items-center">
                  <el-icon class="mr-1"><Document /></el-icon>
                  {{ row.originalName }}
                </div>
              </template>
            </el-table-column>
            <el-table-column label="大小" width="100" align="center">
              <template #default="{ row }">
                {{ formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100" align="center">
              <template #default="{ row }">
                {{ formatMimeType(row.mimeType) }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="上传时间" min-width="160">
              <template #default="{ row }">
                {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : "-" }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  size="small"
                  :icon="View"
                  @click="handlePreview(row)"
                >
                  预览
                </el-button>
                <el-button
                  type="primary"
                  link
                  size="small"
                  :icon="Download"
                  @click="handleDownload(row)"
                >
                  下载
                </el-button>
                <el-button
                  type="danger"
                  link
                  size="small"
                  :icon="Delete"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="flex justify-end mt-4">
            <el-pagination
              v-model:current-page="query.page"
              v-model:page-size="query.pageSize"
              :total="total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </el-card>
      </div>
    </div>

    <FileUploadModal
      v-model:visible="uploadVisible"
      :folder-id="selectedFolderId"
      @complete="handleUploadComplete"
    />

    <FilePreviewDialog
      v-model:visible="previewVisible"
      :file="previewFile"
    />
  </div>
</template>

<style scoped>
.file-layout {
  display: flex;
  gap: 16px;
  min-height: calc(100vh - 160px);
}
.folder-panel {
  width: 260px;
  flex-shrink: 0;
}
.file-content {
  flex: 1;
  min-width: 0;
}
</style>
