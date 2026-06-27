<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Folder, FolderAdd, Edit, Delete } from "@element-plus/icons-vue";
import {
  getFolderTree,
  createFolder,
  updateFolder,
  deleteFolder,
  type FolderNode
} from "@/api/folder";

defineOptions({ name: "FileFolderTree" });

const props = defineProps<{
  selectedId: number | null;
}>();

const emit = defineEmits<{
  "update:selectedId": [id: number | null];
  select: [node: FolderNode];
}>();

const loading = ref(false);
const treeData = ref<FolderNode[]>([]);
const defaultExpandedKeys = ref<number[]>([]);

const treeProps = {
  label: "name",
  children: "children"
};

async function loadTree() {
  loading.value = true;
  try {
    const res = await getFolderTree();
    if (res.code === "00000") {
      treeData.value = res.data || [];
      if (treeData.value.length > 0) {
        defaultExpandedKeys.value = treeData.value.map(n => n.id);
        if (props.selectedId == null) {
          const root = treeData.value[0];
          emit("update:selectedId", root.id);
          emit("select", root);
        }
      }
    }
  } catch {
    // error shown by interceptor
  } finally {
    loading.value = false;
  }
}

function handleNodeClick(data: FolderNode) {
  emit("update:selectedId", data.id);
  emit("select", data);
}

async function handleCreate(parentId: number | null) {
  try {
    const { value } = await ElMessageBox.prompt("请输入文件夹名称", "新建文件夹", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputPattern: /\S+/,
      inputErrorMessage: "名称不能为空"
    });
    const res = await createFolder({ name: value.trim(), parentId });
    if (res.code === "00000") {
      ElMessage.success("创建成功");
      await loadTree();
    }
  } catch {
    // cancelled or error
  }
}

async function handleRename(node: FolderNode) {
  if (node.parentId == null) {
    ElMessage.warning("根目录不可重命名");
    return;
  }
  try {
    const { value } = await ElMessageBox.prompt("请输入新名称", "重命名", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      inputValue: node.name,
      inputPattern: /\S+/,
      inputErrorMessage: "名称不能为空"
    });
    const res = await updateFolder(node.id, { name: value.trim() });
    if (res.code === "00000") {
      ElMessage.success("重命名成功");
      await loadTree();
    }
  } catch {
    // cancelled or error
  }
}

async function handleDelete(node: FolderNode) {
  if (node.parentId == null) {
    ElMessage.warning("根目录不可删除");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除文件夹「${node.name}」吗？`,
      "删除确认",
      { type: "warning" }
    );
    await deleteFolder(node.id);
    ElMessage.success("删除成功");
    if (props.selectedId === node.id) {
      const root = treeData.value[0];
      if (root) {
        emit("update:selectedId", root.id);
        emit("select", root);
      }
    }
    await loadTree();
  } catch {
    // cancelled or error
  }
}

defineExpose({ loadTree });

onMounted(loadTree);
watch(() => props.selectedId, () => {});
</script>

<template>
  <div class="folder-tree-panel" v-loading="loading">
    <div class="folder-tree-header">
      <span class="font-medium">文件夹</span>
      <el-button
        type="primary"
        link
        size="small"
        :icon="FolderAdd"
        @click="handleCreate(selectedId)"
      >
        新建
      </el-button>
    </div>
    <el-tree
      :data="treeData"
      :props="treeProps"
      node-key="id"
      highlight-current
      :current-node-key="selectedId ?? undefined"
      :default-expanded-keys="defaultExpandedKeys"
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <div class="tree-node">
          <el-icon class="mr-1"><Folder /></el-icon>
          <span class="tree-node-label">{{ node.label }}</span>
          <span v-if="data.parentId != null" class="tree-node-actions">
            <el-button
              type="primary"
              link
              size="small"
              :icon="Edit"
              @click.stop="handleRename(data)"
            />
            <el-button
              type="danger"
              link
              size="small"
              :icon="Delete"
              @click.stop="handleDelete(data)"
            />
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<style scoped>
.folder-tree-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.folder-tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 8px;
}
.tree-node {
  display: flex;
  align-items: center;
  flex: 1;
  padding-right: 8px;
  overflow: hidden;
}
.tree-node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tree-node-actions {
  display: none;
  margin-left: 4px;
}
.tree-node:hover .tree-node-actions {
  display: inline-flex;
}
</style>
