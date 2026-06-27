// 多组件库的国际化和本地项目国际化兼容
import { type I18n, createI18n } from "vue-i18n";
import type { App, WritableComputedRef } from "vue";
import { responsiveStorageNameSpace } from "@/config";
import { isObject } from "lodash-es";
import Storage from "responsive-storage";

// element-plus国际化
import enLocale from "element-plus/es/locale/lang/en";
import zhLocale from "element-plus/es/locale/lang/zh-cn";

type LocaleModule = { default: Record<string, unknown> };

const siphonI18n = (function () {
  // 仅初始化一次国际化配置
  const cache = Object.fromEntries(
    Object.entries(
      import.meta.glob<LocaleModule>("../../locales/*.y(a)?ml", {
        eager: true
      })
    ).map(([key, value]) => {
      const matched = key.match(/([A-Za-z0-9-_]+)\./i)?.[1];
      const moduleValue = (value as LocaleModule).default ?? {};
      return [matched ?? key, moduleValue as Record<string, unknown>];
    })
  ) as Record<string, Record<string, unknown>>;
  return (prefix = "zh-CN") => {
    return cache[prefix];
  };
})();

export const localesConfigs: Record<string, Record<string, unknown>> = {
  zh: {
    ...(siphonI18n("zh-CN") || {}),
    ...zhLocale
  },
  en: {
    ...(siphonI18n("en") || {}),
    ...enLocale
  }
};

/** 获取对象中所有嵌套对象的key键，并将它们用点号分割组成字符串 */
function getObjectKeys(obj: unknown) {
  const stack: Array<{ obj: unknown; key: string }> = [];
  const keys: Set<string> = new Set();

  stack.push({ obj, key: "" });

  while (stack.length > 0) {
    const popped = stack.pop();
    if (!popped) continue;
    const { obj: curObj, key } = popped;
    if (!curObj || typeof curObj !== "object") continue;

    for (const k in curObj as Record<string, unknown>) {
      const newKey = key ? `${key}.${k}` : k;

      const val = (curObj as Record<string, unknown>)[k];
      if (val && isObject(val)) {
        stack.push({ obj: val, key: newKey });
      } else {
        keys.add(key);
      }
    }
  }

  return keys;
}

/** 将展开的key缓存 */
const keysCache: Map<string, Set<string>> = new Map();
const flatI18n = (prefix = "zh-CN") => {
  let cache = keysCache.get(prefix);
  if (!cache) {
    cache = getObjectKeys(siphonI18n(prefix) || {});
    keysCache.set(prefix, cache);
  }
  return cache;
};

/**
 * 国际化转换工具函数（自动读取根目录locales文件夹下文件进行国际化匹配）
 * @param message message
 * @returns 转化后的message
 */
export function transformI18n(message: unknown = "") {
  if (!message) {
    return "";
  }

  // 处理存储动态路由的title,格式 {zh:"",en:""}
  if (typeof message === "object") {
    const locale: string | WritableComputedRef<string> = i18n.global.locale;
    const localeKey = typeof locale === "string" ? locale : locale.value;
    return (message as Record<string, unknown>)[localeKey];
  }

  if (typeof message !== "string") {
    return "";
  }

  const key = message.match(/(\S*)\./)?.input;

  // 使用类型断言获取翻译函数
  const translate = i18n.global.t as (key: string) => string;

  if (key && flatI18n("zh-CN").has(key)) {
    return translate(message);
  } else if (!key && Object.hasOwn(siphonI18n("zh-CN") || {}, message)) {
    // 兼容非嵌套形式的国际化写法
    return translate(message);
  } else {
    return message;
  }
}

/** 此函数只是配合i18n Ally插件来进行国际化智能提示，并无实际意义（只对提示起作用），如果不需要国际化可删除 */
export const $t = (key: string) => key;

// vue-i18n 的 LocaleMessages 类型与我们的 Record<string, Record<string, unknown>> 不完全兼容
// 使用 unknown 中间转换以避免类型不匹配
type I18nMessages = Parameters<typeof createI18n>[0]["messages"];

export const i18n: I18n = createI18n({
  legacy: false,
  locale:
    Storage.getData("locale", responsiveStorageNameSpace())?.locale ?? "zh",
  fallbackLocale: "en",
  messages: localesConfigs as unknown as I18nMessages
});

export function useI18n(app: App) {
  app.use(i18n);
}
