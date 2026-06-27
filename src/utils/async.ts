/**
 * 创建一个异步函数，确保在上一次调用完成之前，不会进行下一次调用
 * @param {Function} fn 需要包装的异步函数
 * @returns {Function} 返回一个新的异步函数，该函数会在内部维护一个队列，确保按顺序执行
 */
export function createAsyncQueue(fn: (...args: any[]) => Promise<any>) {
  // 标记当前是否有异步操作正在进行
  let running = false;
  // 存储待执行的异步操作队列
  const queue: ((...args: any[]) => Promise<any>)[] = [];
  return function (...args: any[]) {
    return new Promise((..._args) => {
      // 定义一个回调函数，用于执行异步操作
      const cb = () => {
        running = true;
        // 执行异步操作，并在操作完成后更新状态和执行队列中的下一个操作
        return fn(...args)
          .then(..._args)
          .finally(() => {
            // 重置标记为false，表示当前没有异步操作正在进行
            running = false;
            // 执行队列中的下一个操作
            queue.shift()?.();
          });
      };
      // 将回调函数加入到队列中
      queue.push(() => cb());
      // 如果当前有异步操作正在进行，则不执行新的操作
      if (running) return;
      // 执行队列中的第一个操作
      queue.shift()?.();
    });
  };
}
