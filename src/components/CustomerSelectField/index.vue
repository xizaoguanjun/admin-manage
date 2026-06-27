<template>
  <div
    class="customer-select-field"
    :style="{ width: '100%', cursor: 'pointer' }"
    @click="handleClick"
  >
    <el-input
      :model-value="displayText"
      :placeholder="placeholder"
      readonly
      :clearable="!!selectedCount"
      style="width: 100%"
      @clear="handleClear"
      @click="handleInputClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CustomerData } from "@/views/components/CustomerSelectDialog/types";

/**
 * CustomerSelectField - 客户选择字段组件
 * 用于在搜索表单中点击打开CustomerSelectDialog的输入框
 */

defineOptions({
  name: "CustomerSelectField"
});

interface Props {
  /** 已选择的客户列表 */
  selectedCustomers?: CustomerData[];
  /** 占位符文本 */
  placeholder?: string;
}

interface Emits {
  /** 打开客户选择弹窗 */
  (e: "open"): void;
  /** 清空已选客户 */
  (e: "clear"): void;
}

const props = withDefaults(defineProps<Props>(), {
  selectedCustomers: () => [],
  placeholder: "请选择客户"
});

const emit = defineEmits<Emits>();

/**
 * 已选客户数量
 */
const selectedCount = computed(() => props.selectedCustomers?.length || 0);

/**
 * 显示文本
 */
const displayText = computed(() => {
  if (selectedCount.value === 0) return "";
  return `已选择 ${selectedCount.value} 位客户`;
});

/**
 * 点击整个区域打开弹窗
 */
const handleClick = () => {
  emit("open");
};

/**
 * 清空选择
 */
const handleClear = () => {
  emit("clear");
};

/**
 * 处理输入框点击事件
 * 如果点击的是清除按钮，阻止打开弹窗
 */
const handleInputClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target?.closest?.(".el-input__clear")) {
    e.stopPropagation();
  }
};
</script>

<style scoped lang="scss">
.customer-select-field {
  // 保持默认样式，由父组件控制宽度
}
</style>
