import { ref, watch, nextTick, type Ref } from "vue";
import type { PlusDialogForm, PlusDrawerForm } from "yc-pro-components";

/**
 * 表单重置选项
 */
export interface FormResetOptions {
  /**
   * 是否在打开时清除验证状态
   * @default true
   */
  clearValidateOnOpen?: boolean;

  /**
   * 是否在关闭时重置表单数据
   * @default true
   */
  resetFieldsOnClose?: boolean;

  /**
   * 是否在打开时重置表单数据
   * @default false - 编辑模式下通常不需要重置
   */
  resetFieldsOnOpen?: boolean;

  /**
   * 自定义重置回调函数（在关闭时调用）
   */
  onReset?: () => void;

  /**
   * 自定义清除验证回调函数（在打开时调用）
   */
  onClearValidate?: () => void;
}

/**
 * Plus Pro Form 重置 Composable
 *
 * @description
 * 用于 PlusDialogForm 和 PlusDrawerForm 组件的表单状态重置管理。
 *
 * 功能：
 * 1. 监听对话框/抽屉的打开/关闭状态
 * 2. 打开时自动清除验证状态（可选）
 * 3. 关闭时自动重置表单数据（可选）
 * 4. 支持自定义重置逻辑
 *
 * @example
 * ```ts
 * // 在组件中使用
 * const visible = ref(false);
 * const plusFormRef = ref();
 *
 * const { formRef } = usePlusFormReset(visible, {
 *   clearValidateOnOpen: true,
 *   resetFieldsOnClose: true,
 *   onReset: () => {
 *     // 自定义重置逻辑
 *     formData.value = { ...defaultFormData };
 *   }
 * });
 *
 * // 在模板中绑定 ref
 * <PlusDialogForm ref="formRef" v-model:visible="visible" ... />
 * ```
 *
 * @param visible - 对话框/抽屉的可见性状态（响应式引用）
 * @param options - 重置选项配置
 * @returns 包含 formRef 的对象
 */
export function usePlusFormReset(
  visible: Ref<boolean>,
  options: FormResetOptions = {}
) {
  const {
    clearValidateOnOpen = true,
    resetFieldsOnClose = true,
    resetFieldsOnOpen = false,
    onReset,
    onClearValidate
  } = options;

  /**
   * PlusDialogForm 或 PlusDrawerForm 的引用
   */
  const formRef =
    ref<InstanceType<typeof PlusDialogForm | typeof PlusDrawerForm>>();

  /**
   * 清除表单验证状态
   */
  const clearValidate = async () => {
    await nextTick();
    try {
      // PlusDialogForm/PlusDrawerForm 内部使用 PlusForm
      // 通过 formInstance 访问 Element Plus 的 Form 实例
      formRef.value?.formInstance?.clearValidate();

      // 调用自定义清除验证回调
      onClearValidate?.();
    } catch (error) {
      console.warn("清除表单验证状态失败:", error);
    }
  };

  /**
   * 重置表单字段到初始值
   */
  const resetFields = async () => {
    await nextTick();
    try {
      // 重置表单字段
      formRef.value?.formInstance?.resetFields();

      // 调用自定义重置回调
      onReset?.();
    } catch (error) {
      console.warn("重置表单字段失败:", error);
    }
  };

  /**
   * 监听 visible 变化，自动处理表单状态
   */
  watch(
    visible,
    async (newVisible, oldVisible) => {
      // 从关闭到打开
      if (newVisible && !oldVisible) {
        if (resetFieldsOnOpen) {
          await resetFields();
        }
        if (clearValidateOnOpen) {
          await clearValidate();
        }
      }

      // 从打开到关闭
      if (!newVisible && oldVisible) {
        if (resetFieldsOnClose) {
          await resetFields();
        }
      }
    },
    { flush: "post" } // 在 DOM 更新后执行
  );

  return {
    /**
     * 表单引用，需要绑定到 PlusDialogForm 或 PlusDrawerForm 的 ref
     */
    formRef,

    /**
     * 手动清除验证状态
     */
    clearValidate,

    /**
     * 手动重置表单字段
     */
    resetFields
  };
}

/**
 * 简化版本：仅清除验证状态（适用于编辑模式）
 *
 * @example
 * ```ts
 * const visible = ref(false);
 * const { formRef } = usePlusFormClearValidate(visible);
 *
 * <PlusDialogForm ref="formRef" v-model:visible="visible" ... />
 * ```
 */
export function usePlusFormClearValidate(visible: Ref<boolean>) {
  return usePlusFormReset(visible, {
    clearValidateOnOpen: true,
    resetFieldsOnClose: false,
    resetFieldsOnOpen: false
  });
}

/**
 * 完整版本：清除验证 + 重置表单（适用于新增模式）
 *
 * @example
 * ```ts
 * const visible = ref(false);
 * const { formRef } = usePlusFormFullReset(visible, () => {
 *   formData.value = { ...defaultFormData };
 * });
 *
 * <PlusDialogForm ref="formRef" v-model:visible="visible" ... />
 * ```
 */
export function usePlusFormFullReset(
  visible: Ref<boolean>,
  onReset?: () => void
) {
  return usePlusFormReset(visible, {
    clearValidateOnOpen: true,
    resetFieldsOnClose: true,
    resetFieldsOnOpen: false,
    onReset
  });
}
