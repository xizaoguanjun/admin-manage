<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  UploadFilled,
  VideoPause,
  VideoPlay,
  Close,
  Delete
} from "@element-plus/icons-vue";
import { useFileUploadStore } from "@/store/modules/fileUpload";

defineOptions({ name: "FileUploadModal" });

const props = defineProps<{
  visible: boolean;
  folderId: number | null;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  complete: [];
}>();

const uploadStore = useFileUploadStore();
const fileInputRef = ref<HTMLInputElement>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit("update:visible", val)
});

function handleClose() {
  dialogVisible.value = false;
}

function openFilePicker() {
  fileInputRef.value?.click();
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files?.length) return;
  if (props.folderId != null) {
    uploadStore.setCurrentFolder(props.folderId);
  }
  uploadStore.addFiles(Array.from(files));
  input.value = "";
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (!files?.length) return;
  if (props.folderId != null) {
    uploadStore.setCurrentFolder(props.folderId);
  }
  uploadStore.addFiles(Array.from(files));
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

function statusTagType(
  status: string
): "info" | "success" | "warning" | "primary" | "danger" {
  const map: Record<string, "info" | "success" | "warning" | "primary" | "danger"> = {
    waiting: "info",
    uploading: "primary",
    paused: "warning",
    completed: "success",
    error: "danger"
  };
  return map[status] || "info";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    waiting: "等待中",
    uploading: "上传中",
    paused: "已暂停",
    completed: "已完成",
    error: "失败"
  };
  return map[status] || status;
}

onMounted(() => {
  uploadStore.onUploadComplete(handleComplete);
});

onUnmounted(() => {
  uploadStore.offUploadComplete(handleComplete);
});

function handleComplete() {
  emit("complete");
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="上传文件"
    width="640px"
    destroy-on-close
    @close="handleClose"
  >
    <div
      class="upload-dropzone"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @click="openFilePicker"
    >
      <el-icon class="upload-icon"><UploadFilled /></el-icon>
      <p>将文件拖到此处，或<em>点击选择</em></p>
      <p class="upload-tip">小文件（≤10MB）直接上传，大文件自动分片上传</p>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden-input"
        @change="handleFileChange"
      />
    </div>

    <div v-if="uploadStore.uploadFiles.length" class="upload-list">
      <div
        v-for="item in uploadStore.uploadFiles"
        :key="item.id"
        class="upload-item"
      >
        <div class="upload-item-header">
          <span class="upload-item-name" :title="item.name">{{ item.name }}</span>
          <el-tag :type="statusTagType(item.status)" size="small">
            {{ statusLabel(item.status) }}
          </el-tag>
        </div>
        <el-progress
          :percentage="item.progress"
          :status="item.status === 'error' ? 'exception' : item.status === 'completed' ? 'success' : undefined"
        />
        <div class="upload-item-meta">
          <span>{{ uploadStore.formatFileSize(item.size) }}</span>
          <span v-if="item.formattedSpeed">{{ item.formattedSpeed }}</span>
          <span v-if="item.formattedRemainingTime">剩余 {{ item.formattedRemainingTime }}</span>
          <span v-if="item.error" class="text-red-500">{{ item.error }}</span>
        </div>
        <div class="upload-item-actions">
          <el-button
            v-if="item.status === 'uploading'"
            type="warning"
            link
            size="small"
            :icon="VideoPause"
            @click="uploadStore.pauseUpload(item.id)"
          >
            暂停
          </el-button>
          <el-button
            v-if="item.status === 'paused' || item.status === 'error'"
            type="primary"
            link
            size="small"
            :icon="VideoPlay"
            @click="uploadStore.resumeUpload(item.id)"
          >
            继续
          </el-button>
          <el-button
            type="danger"
            link
            size="small"
            :icon="Delete"
            @click="uploadStore.removeFile(item.id)"
          >
            移除
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="uploadStore.clearCompletedFiles()">清空已完成</el-button>
      <el-button :icon="Close" @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.upload-dropzone {
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s;
}
.upload-dropzone:hover {
  border-color: var(--el-color-primary);
}
.upload-icon {
  font-size: 48px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.upload-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 8px;
}
.hidden-input {
  display: none;
}
.upload-list {
  margin-top: 16px;
  max-height: 300px;
  overflow-y: auto;
}
.upload-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  margin-bottom: 8px;
}
.upload-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.upload-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
  font-size: 14px;
}
.upload-item-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
.upload-item-actions {
  margin-top: 4px;
}
</style>
