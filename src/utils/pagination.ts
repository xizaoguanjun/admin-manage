/**
 * 分页工具函数
 * @description 提供分页相关的通用工具方法
 */

import type { Ref } from "vue";
import type { PlusPage } from "yc-pro-components";

/**
 * RePlusPage 组件的 Ref 类型
 * @description 包含 plusPageRef 属性的对象
 */
export interface RePlusPageRef {
  plusPageRef?: InstanceType<typeof PlusPage>;
}

/**
 * 删除后刷新列表的智能分页逻辑
 * @description
 * 1. 如果删除后当前页还有数据，则刷新当前页
 * 2. 如果删除后当前页没有数据了（比如当前页只有1条数据被删除），则自动跳转到上一页
 * 3. 如果当前在第1页，则始终刷新第1页
 *
 * @param plusPageRef - RePlusPage 组件的 ref 引用
 * @param totalRef - 总条数的 ref（需要在组件中维护）
 * @param pageSize - 每页显示条数，默认 20
 * @param deleteCount - 删除的条数，默认 1
 *
 * @example
 * ```ts
 * // 在组件中维护 total
 * const totalCount = ref(0);
 * const getList = async (query) => {
 *   const response = await queryMeterPageList(...);
 *   totalCount.value = response.data.total || 0; // 更新 total
 *   return { data: response.data.result, success: true, total: response.data.total };
 * };
 *
 * // 在删除成功后调用
 * const confirmDelete = async () => {
 *   const response = await delMeter({ id: currentDeleteRow.value.id });
 *   if (response.code === "00000") {
 *     ElMessage.success("删除成功");
 *     deleteVisible.value = false;
 *     // 智能刷新列表
 *     refreshListAfterDelete(plusPageRef, totalCount);
 *   }
 * };
 * ```
 */
export function refreshListAfterDelete(
  plusPageRef: Ref<RePlusPageRef | undefined>,
  totalRef: Ref<number>,
  pageSize = 20,
  deleteCount = 1
): void {
  if (!plusPageRef?.value?.plusPageRef) {
    console.warn("[refreshListAfterDelete] plusPageRef 不存在，无法刷新列表");
    return;
  }

  // 获取 PlusPage 实例
  const plusPage = plusPageRef.value.plusPageRef;

  // 获取当前总条数
  const currentTotal = totalRef.value;

  // 尝试获取当前页码（从 PlusPage 内部状态获取）
  let currentPage = 1;

  try {
    // 尝试从 PlusPage 实例中获取当前页码
    // 不同版本的 yc-pro-components（plus fork）可能有不同的内部结构
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageInfo = (plusPage as any).pageInfo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = (plusPage as any).page;

    if (pageInfo?.page) {
      currentPage = pageInfo.page;
    } else if (page) {
      currentPage = page;
    }
  } catch {
    console.warn("[refreshListAfterDelete] 无法获取当前页码，使用默认值 1");
  }

  // 计算删除后的总条数
  const newTotal = Math.max(0, currentTotal - deleteCount);

  // 计算删除后的总页数
  const totalPages = newTotal > 0 ? Math.ceil(newTotal / pageSize) : 1;

  // 判断删除后当前页是否还存在
  // 如果当前页 > 总页数，说明当前页已经不存在了，需要跳转到上一页
  const targetPage = currentPage > totalPages ? totalPages : currentPage;

  // 确保页码至少为 1
  const finalPage = Math.max(1, targetPage);

  console.log("[refreshListAfterDelete] 删除后刷新列表:", {
    currentPage,
    currentTotal,
    deleteCount,
    newTotal,
    totalPages,
    targetPage,
    finalPage
  });

  // 如果需要跳转到其他页，则先设置页码再刷新
  if (finalPage !== currentPage) {
    // 尝试设置页码
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageInfo = (plusPage as any).pageInfo;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = (plusPage as any).page;

      if (pageInfo) {
        pageInfo.page = finalPage;
      } else if (page !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (plusPage as any).page = finalPage;
      }
    } catch (err) {
      console.warn("[refreshListAfterDelete] 无法设置页码:", err);
    }
  }

  // 刷新列表
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (plusPage as any).getList?.();
}

/**
 * 获取 RePlusPage 的当前分页信息
 * @param plusPageRef - RePlusPage 组件的 ref 引用
 * @returns 分页信息对象，包含 page, pageSize, total
 */
export function getPaginationInfo(
  plusPageRef: Ref<RePlusPageRef | undefined>
): {
  page: number;
  pageSize: number;
  total: number;
} {
  const defaultInfo = { page: 1, pageSize: 20, total: 0 };

  if (!plusPageRef?.value?.plusPageRef) {
    console.warn("[getPaginationInfo] plusPageRef 不存在");
    return defaultInfo;
  }

  const plusPage = plusPageRef.value.plusPageRef;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageInfo = (plusPage as any).pageInfo;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = (plusPage as any).page || 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageSize = (plusPage as any).pageSize || 20;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = (plusPage as any).total || 0;

    return {
      page: pageInfo?.page || page,
      pageSize: pageInfo?.pageSize || pageSize,
      total: pageInfo?.total || total
    };
  } catch (err) {
    console.warn("[getPaginationInfo] 获取分页信息失败:", err);
    return defaultInfo;
  }
}
