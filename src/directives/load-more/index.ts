/**
 * v-load-more 指令 - 为 el-select 等组件实现滚动加载更多功能
 *
 * ## 核心挑战与解决方案
 *
 * ### 挑战 1: append-to-body 导致的 DOM 查找问题
 * **问题**：el-select 使用 append-to-body 后，下拉框被渲染到 <body> 中，
 *         无法通过 el.querySelector 在组件内部找到下拉框元素
 *
 * **解决方案**：
 * 1. 使用 MutationObserver 监听 aria-describedby 属性的变化
 * 2. 当属性被设置时，获取其值（popover 的 ID）
 * 3. 使用 document.getElementById 在全局 DOM 中查找下拉框
 * 4. 在下拉框内查找滚动容器并绑定滚动监听
 *
 * ### 挑战 2: 首次打开无法触发加载
 * **问题**：首次打开下拉框时，aria-describedby 的 oldValue 为 null，
 *         原来只监听 oldValue 的逻辑会失效
 *
 * **解决方案**：
 * 改为监听 newValue，只要属性被设置就绑定滚动监听，
 * 不再依赖 oldValue 存在与否
 *
 * ### 挑战 3: 重复绑定问题
 * **问题**：下拉框多次打开/关闭可能导致重复绑定滚动事件
 *
 * **解决方案**：
 * 使用 __vueLoadMoreBound__ 标记，确保同一个滚动容器只绑定一次
 *
 * ### 挑战 4: 频繁触发加载
 * **问题**：用户快速滚动或停留在底部时可能频繁触发加载
 *
 * **解决方案**：
 * 实现 1 秒防抖机制，记录上次触发时间，避免重复触发
 *
 * ## 技术要点
 *
 * 1. **MutationObserver**：监听 DOM 属性变化，适合处理动态渲染的场景
 * 2. **防抖机制**：使用时间戳判断，比 lodash.debounce 更轻量
 * 3. **事件清理**：在 beforeUnmount 中清理所有监听器和标记
 * 4. **选择器兼容性**：尝试多个可能的触发器选择器，适配不同版本的 Element Plus
 *
 * ## 使用方式
 * ```vue
 * <el-select v-load-more="handleLoadMore" append-to-body>
 *   <!-- options -->
 * </el-select>
 * ```
 *
 * ## 调试日志
 * 开启了详细的 console.log，便于开发时调试：
 * - 监听器绑定状态
 * - 滚动事件触发
 * - 接近底部的检测
 * 生产环境可以通过全局搜索替换移除这些日志
 */
import type { Directive } from "vue";

// 扩展 HTMLElement 类型以支持自定义属性
interface LoadMoreElement extends HTMLElement {
  __vueLoadMoreObserver__?: MutationObserver;
  __vueLoadMoreHandler__?: () => void;
  __vueLoadMoreBound__?: boolean;
}

/** 下拉加载更多指令（用于 el-select 等组件的滚动加载） */
export const loadMore: Directive = {
  mounted(el: LoadMoreElement, binding) {
    // 绑定滚动监听器的函数
    const bindScrollListener = (poperId: string) => {
      const poper = document.getElementById(poperId);
      if (!poper) {
        console.warn("[loadMore directive] Poper not found:", poperId);
        return;
      }

      // 获取下拉框的滚动容器
      const scrollContainer = poper.querySelector(
        ".el-scrollbar .el-select-dropdown__wrap"
      ) as LoadMoreElement;

      if (scrollContainer && !scrollContainer.__vueLoadMoreBound__) {
        // 标记已绑定，避免重复绑定
        scrollContainer.__vueLoadMoreBound__ = true;
        console.log("[loadMore directive] Scroll listener bound to:", poperId);

        let lastTriggerTime = 0;
        const handleScroll = () => {
          const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
          const scrollDistance = scrollHeight - scrollTop <= clientHeight + 5;

          // 只在接近底部时打印日志，避免刷屏
          if (scrollDistance) {
            console.log("[loadMore directive] Near bottom:", {
              scrollTop,
              scrollHeight,
              clientHeight,
              remaining: scrollHeight - scrollTop - clientHeight
            });
          }

          // 防抖：避免在同一秒内重复触发
          const now = Date.now();
          if (scrollDistance && binding.value && now - lastTriggerTime > 1000) {
            lastTriggerTime = now;
            console.log("[loadMore directive] Triggering load more");
            binding.value();
          }
        };

        // 保存事件处理器，用于卸载时清理
        scrollContainer.__vueLoadMoreHandler__ = handleScroll;
        scrollContainer.addEventListener("scroll", handleScroll);
      } else if (scrollContainer?.__vueLoadMoreBound__) {
        console.log(
          "[loadMore directive] Scroll listener already bound:",
          poperId
        );
      }
    };

    // 监视器的回调
    function callback(records: MutationRecord[]) {
      // 观察会监视属性的新增、删除，以及值的变化
      records.forEach(record => {
        if (record.attributeName === "aria-describedby") {
          const target = record.target as HTMLElement;
          const newValue = target.getAttribute("aria-describedby");

          console.log("[loadMore directive] aria-describedby changed:", {
            oldValue: record.oldValue,
            newValue
          });

          // 当属性被设置时（不管是第一次还是后续）
          if (newValue) {
            bindScrollListener(newValue);
          }
        }
      });
    }

    // 获取select的触发器元素
    const selectTrigger =
      el.querySelector(".select-trigger") ||
      el.querySelector(".el-select__wrapper") ||
      el.querySelector("input");

    if (selectTrigger) {
      // 使用 MutationObserver 监听 aria-describedby 属性的变化
      const observer = new MutationObserver(callback);
      observer.observe(selectTrigger, {
        attributes: true,
        attributeOldValue: true
      });

      // 保存 observer 实例，用于卸载时清理
      el.__vueLoadMoreObserver__ = observer;
    }
  },

  beforeUnmount(el: LoadMoreElement) {
    // 清理 MutationObserver
    if (el.__vueLoadMoreObserver__) {
      el.__vueLoadMoreObserver__.disconnect();
      delete el.__vueLoadMoreObserver__;
    }

    // 尝试清理所有可能的滚动监听器
    const selectTrigger =
      el.querySelector(".select-trigger") ||
      el.querySelector(".el-select__wrapper") ||
      el.querySelector("input");

    if (selectTrigger) {
      const ariaId = selectTrigger.getAttribute("aria-describedby");
      if (ariaId) {
        const poper = document.getElementById(ariaId);
        if (poper) {
          const scrollContainer = poper.querySelector(
            ".el-scrollbar .el-select-dropdown__wrap"
          ) as LoadMoreElement;

          if (scrollContainer && scrollContainer.__vueLoadMoreHandler__) {
            scrollContainer.removeEventListener(
              "scroll",
              scrollContainer.__vueLoadMoreHandler__
            );
            delete scrollContainer.__vueLoadMoreHandler__;
            delete scrollContainer.__vueLoadMoreBound__;
          }
        }
      }
    }
  }
};
