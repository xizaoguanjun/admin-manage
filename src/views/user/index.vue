<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Upload } from "@element-plus/icons-vue";
import type {
  FormInstance,
  FormRules,
  UploadRequestOptions
} from "element-plus";
import { getToken, formatToken } from "@/utils/auth";
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  type UserItem,
  type UserListQuery,
  type CreateUserParams,
  type UpdateUserParams
} from "@/api/user";

defineOptions({ name: "UserManagement" });

// ==================== 列表状态 ====================
const loading = ref(false);
const tableData = ref<UserItem[]>([]);
const total = ref(0);

const query = reactive<UserListQuery>({
  page: 1,
  pageSize: 10,
  username: "",
  status: undefined
});

// ==================== 弹窗状态 ====================
const dialogVisible = ref(false);
const dialogTitle = ref("");
const dialogLoading = ref(false);
const isEdit = ref(false);
const editId = ref<number | null>(null);
const avatarUploading = ref(false);

const formRef = ref<FormInstance>();
const form = reactive({
  username: "",
  password: "",
  nickname: "",
  email: "",
  phone: "",
  roles: "user",
  status: 1,
  avatar: ""
});

// ==================== 表单校验 ====================
const createRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 50, message: "用户名长度 3-50 个字符", trigger: "blur" }
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码至少 6 个字符", trigger: "blur" }
  ],
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }]
};

const editRules: FormRules = {
  email: [{ type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }]
};

// ==================== 头像上传 ====================
function beforeAvatarUpload(file: File) {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    ElMessage.error("只支持 JPG/PNG/GIF/WEBP 格式图片");
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error("图片大小不能超过 5MB");
    return false;
  }
  return true;
}

async function handleAvatarUpload(options: UploadRequestOptions) {
  const tokenData = getToken();
  if (!tokenData) {
    ElMessage.error("未登录，请重新登录");
    return;
  }
  avatarUploading.value = true;
  try {
    const formData = new FormData();
    formData.append("file", options.file);

    const res = await fetch("/api/upload/avatar", {
      method: "POST",
      headers: {
        Authorization: formatToken(tokenData.refreshToken)
      },
      body: formData
    });
    const data = await res.json();
    if (data.code === "00000" && data.data?.url) {
      form.avatar = data.data.url;
      ElMessage.success("头像上传成功");
    } else {
      ElMessage.error(data.message || "上传失败");
    }
  } catch {
    ElMessage.error("上传失败，请重试");
  } finally {
    avatarUploading.value = false;
  }
}

// ==================== 列表操作 ====================
async function fetchList() {
  loading.value = true;
  try {
    const res = await getUserList(query);
    if (res.data) {
      tableData.value = res.data.list ?? [];
      total.value = res.data.total ?? 0;
    }
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleReset() {
  query.username = "";
  query.status = undefined;
  query.page = 1;
  fetchList();
}

function handlePageChange(page: number) {
  query.page = page;
  fetchList();
}

function handleSizeChange(size: number) {
  query.pageSize = size;
  query.page = 1;
  fetchList();
}

// ==================== 弹窗操作 ====================
function openCreate() {
  isEdit.value = false;
  editId.value = null;
  dialogTitle.value = "新增用户";
  Object.assign(form, {
    username: "",
    password: "",
    nickname: "",
    email: "",
    phone: "",
    roles: "user",
    status: 1,
    avatar: ""
  });
  dialogVisible.value = true;
}

function openEdit(row: UserItem) {
  isEdit.value = true;
  editId.value = row.id;
  dialogTitle.value = "编辑用户";
  Object.assign(form, {
    username: row.username,
    password: "",
    nickname: row.nickname,
    email: row.email,
    phone: row.phone,
    roles: row.roles,
    status: row.status,
    avatar: row.avatar || ""
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (!valid) return;
    dialogLoading.value = true;
    try {
      if (isEdit.value && editId.value != null) {
        const params: UpdateUserParams = {
          nickname: form.nickname,
          email: form.email,
          phone: form.phone,
          roles: form.roles,
          status: form.status,
          avatar: form.avatar
        };
        await updateUser(editId.value, params);
        ElMessage.success("更新成功");
      } else {
        const params: CreateUserParams = {
          username: form.username,
          password: form.password,
          nickname: form.nickname,
          email: form.email,
          phone: form.phone,
          roles: form.roles,
          status: form.status,
          avatar: form.avatar
        };
        await createUser(params);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
      fetchList();
    } catch {
      // error shown by interceptor
    } finally {
      dialogLoading.value = false;
    }
  });
}

async function handleDelete(row: UserItem) {
  await ElMessageBox.confirm(
    `确定要删除用户「${row.username}」吗？此操作不可恢复。`,
    "删除确认",
    { type: "warning", confirmButtonText: "确定删除", cancelButtonText: "取消" }
  );
  try {
    await deleteUser(row.id);
    ElMessage.success("删除成功");
    fetchList();
  } catch {
    // error shown by interceptor
  }
}

async function handleStatusChange(row: UserItem) {
  try {
    await updateUser(row.id, { status: row.status });
    ElMessage.success(row.status === 1 ? "已启用" : "已禁用");
  } catch {
    row.status = row.status === 1 ? 0 : 1;
  }
}

onMounted(fetchList);
</script>

<template>
  <div class="p-4">
    <!-- 搜索区域 -->
    <el-card class="mb-4" shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="用户名">
          <el-input
            v-model="query.username"
            placeholder="请输入用户名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="query.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium">用户列表</span>
          <el-button type="primary" @click="openCreate">
            <el-icon class="mr-1"><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="头像" width="70" align="center">
          <template #default="{ row }">
            <el-avatar
              :size="36"
              :src="row.avatar || undefined"
              :icon="row.avatar ? undefined : 'ep:user-filled'"
            >
              <span>{{
                row.nickname?.charAt(0) || row.username?.charAt(0)
              }}</span>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="username" label="用户名" min-width="110" />
        <el-table-column prop="nickname" label="昵称" min-width="110" />
        <el-table-column
          prop="email"
          label="邮箱"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="roles" label="角色" min-width="100">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roles.split(',')"
              :key="role"
              :type="role === 'admin' ? 'danger' : 'primary'"
              class="mr-1"
              size="small"
            >
              {{ role === "admin" ? "管理员" : "普通用户" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="155">
          <template #default="{ row }">
            {{ row.createdAt ? new Date(row.createdAt).toLocaleString() : "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">
              编辑
            </el-button>
            <el-divider direction="vertical" />
            <el-button
              type="danger"
              link
              size="small"
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="520px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="isEdit ? editRules : createRules"
        label-width="80px"
      >
        <!-- 头像上传 -->
        <el-form-item label="头像">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            accept="image/jpeg,image/png,image/gif,image/webp"
            :before-upload="beforeAvatarUpload"
            :http-request="handleAvatarUpload"
          >
            <div class="avatar-wrap">
              <el-avatar
                v-if="form.avatar"
                :size="80"
                :src="form.avatar"
                class="cursor-pointer"
              />
              <div v-else class="avatar-placeholder">
                <el-icon v-if="!avatarUploading" class="avatar-icon"
                  ><Plus
                /></el-icon>
                <el-icon v-else class="is-loading"><Upload /></el-icon>
              </div>
              <div class="avatar-mask">
                <el-icon><Upload /></el-icon>
                <span>更换</span>
              </div>
            </div>
          </el-upload>
          <div class="el-upload__tip ml-2 text-xs text-gray-400">
            支持 JPG/PNG/GIF/WEBP，最大 5MB
          </div>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            :disabled="isEdit"
            placeholder="请输入用户名（3-50 个字符）"
          />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码（至少 6 个字符）"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select
            v-model="form.roles"
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="dialogLoading"
          @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s;
}
.avatar-uploader :deep(.el-upload:hover) {
  border-color: var(--el-color-primary);
}

.avatar-wrap {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 50%;
}

.avatar-icon {
  font-size: 28px;
  color: var(--el-text-color-secondary);
}

.avatar-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 50%;
  gap: 4px;
}

.avatar-wrap:hover .avatar-mask {
  opacity: 1;
}

.avatar-mask .el-icon {
  font-size: 18px;
}
</style>
