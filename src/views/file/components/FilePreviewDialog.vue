<script setup lang="ts">
import { ref, watch, onUnmounted, computed } from "vue";
import { Download } from "@element-plus/icons-vue";
import type { FileItem } from "@/api/file";
import { fetchPreviewBlobUrl, downloadFile } from "@/api/file";

defineOptions({ name: "FilePreviewDialog" });

const props = defineProps<{
  visible: boolean;
  file: FileItem | null;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
}>();

const loading = ref(false);
const previewUrl = ref("");
const previewType = ref<"image" | "pdf" | "video" | "audio" | "unsupported">(
  "unsupported"
);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit("update:visible", val)
});

function detectPreviewType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "unsupported";
}

async function loadPreview() {
  if (!props.file) return;
  loading.value = true;
  previewType.value = detectPreviewType(props.file.mimeType);

  if (previewType.value === "unsupported") {
    loading.value = false;
    return;
  }

  try {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = "";
    }
    previewUrl.value = await fetchPreviewBlobUrl(
      props.file.id,
      props.file.mimeType
    );
  } catch {
    previewType.value = "unsupported";
  } finally {
    loading.value = false;
  }
}

async function handleDownload() {
  if (!props.file) return;
  await downloadFile(props.file.id, props.file.originalName);
}

function handleClose() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
    previewUrl.value = "";
  }
}

watch(
  () => [props.visible, props.file?.id],
  ([visible]) => {
    if (visible && props.file) {
      loadPreview();
    } else {
      handleClose();
    }
  }
);

onUnmounted(handleClose);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="file?.originalName || '文件预览'"
    width="800px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-loading="loading" class="preview-container">
      <template v-if="file">
        <el-image
          v-if="previewType === 'image' && previewUrl"
          :src="previewUrl"
          fit="contain"
          class="preview-image"
          :preview-src-list="[previewUrl]"
        />
        <iframe
          v-else-if="previewType === 'pdf' && previewUrl"
          :src="previewUrl"
          class="preview-iframe"
        />
        <video
          v-else-if="previewType === 'video' && previewUrl"
          :src="previewUrl"
          controls
          class="preview-media"
        />
        <audio
          v-else-if="previewType === 'audio' && previewUrl"
          :src="previewUrl"
          controls
          class="preview-audio"
        />
        <div v-else class="preview-unsupported">
          <p>该文件类型不支持在线预览</p>
          <p class="text-sm text-gray-400">{{ file.mimeType }}</p>
          <el-button type="primary" :icon="Download" @click="handleDownload">
            下载文件
          </el-button>
        </div>
      </template>
    </div>

    <template #footer>
      <el-button v-if="file" :icon="Download" @click="handleDownload">
        下载
      </el-button>
      <el-button @click="dialogVisible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.preview-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-image {
  max-width: 100%;
  max-height: 500px;
}
.preview-iframe {
  width: 100%;
  height: 500px;
  border: none;
}
.preview-media {
  max-width: 100%;
  max-height: 500px;
}
.preview-audio {
  width: 100%;
}
.preview-unsupported {
  text-align: center;
  padding: 40px;
}
</style>
