import { onUnmounted, nextTick, type Ref } from "vue";

/**
 * 禁用 HTML5 原生 number input 的 step 验证提示
 *
 * 浏览器对 `<input type="number">` 元素会显示原生的 step 验证提示（如："请输入有效值。两个最接近的有效值分别为2和3"）
 * 该 composable 通过设置 `step="any"` 来禁用这个行为
 *
 * @example
 * ```ts
 * // 在弹窗组件中使用
 * const { start, stop } = useDisableNumberInputStepValidation(formRef);
 *
 * watch(visible, (newVal) => {
 *   if (newVal) {
 *     nextTick(() => start());
 *   } else {
 *     stop();
 *   }
 * });
 * ```
 *
 * @param containerRef - 包含 number input 的容器元素的 ref（如表单组件的 ref）
 * @returns { start, stop } - 启动和停止监听的方法
 */
export function useDisableNumberInputStepValidation(
  containerRef: Ref<{ $el?: HTMLElement } | HTMLElement | null | undefined>
) {
  let observer: MutationObserver | null = null;

  /**
   * 获取实际的 DOM 元素
   */
  const getContainerElement = (): HTMLElement | null => {
    const ref = containerRef.value;
    if (!ref) return null;

    // 如果是 Vue 组件实例，获取 $el
    if ("$el" in ref && ref.$el) {
      return ref.$el as HTMLElement;
    }

    // 如果直接是 HTMLElement
    if (ref instanceof HTMLElement) {
      return ref;
    }

    return null;
  };

  /**
   * 为指定容器内的所有 number input 设置 step="any"
   */
  const setStepAnyForNumberInputs = (container: Element) => {
    const numberInputs = container.querySelectorAll('input[type="number"]');
    numberInputs.forEach((input: Element) => {
      if (input.getAttribute("step") !== "any") {
        input.setAttribute("step", "any");
      }
    });
  };

  /**
   * 启动 MutationObserver 监听
   * 会自动为已存在和新添加的 number input 设置 step="any"
   */
  const start = () => {
    const container = getContainerElement();
    if (!container) return;

    // 先设置已存在的 input
    setStepAnyForNumberInputs(container);

    // 如果已存在 observer，先断开
    if (observer) {
      observer.disconnect();
    }

    // 创建 MutationObserver 监听 DOM 变化
    observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        // 检查新添加的节点
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // 如果添加的是 input[type="number"]，直接设置
            if (
              element.tagName === "INPUT" &&
              element.getAttribute("type") === "number"
            ) {
              element.setAttribute("step", "any");
            }
            // 如果添加的是容器，查找其中的 input[type="number"]
            setStepAnyForNumberInputs(element);
          }
        });

        // 检查属性变化（某些组件可能动态修改 type）
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "type" &&
          mutation.target instanceof Element
        ) {
          const target = mutation.target as Element;
          if (
            target.tagName === "INPUT" &&
            target.getAttribute("type") === "number"
          ) {
            target.setAttribute("step", "any");
          }
        }
      });
    });

    // 开始观察
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["type"]
    });
  };

  /**
   * 停止 MutationObserver 监听
   */
  const stop = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  // 组件卸载时自动清理
  onUnmounted(() => {
    stop();
  });

  return {
    /** 启动监听，为所有 number input 设置 step="any" */
    start,
    /** 停止监听 */
    stop
  };
}
