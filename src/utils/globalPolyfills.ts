// 如果项目出现 `global is not defined` 报错，可能是您引入某个库的问题，比如 aws-sdk-js https://github.com/aws/aws-sdk-js
// 解决办法就是将该文件引入 src/main.ts 即可 import "@/utils/globalPolyfills";
type WindowWithGlobal = Window &
  typeof globalThis & {
    global?: unknown;
  };

const win = window as WindowWithGlobal;

if (typeof win.global === "undefined") {
  win.global = win;
}

export {};
