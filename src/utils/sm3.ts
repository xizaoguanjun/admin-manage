/**
 * SM3 国密哈希算法工具
 * @description 使用 sm-crypto 库对敏感数据（如密码）进行 SM3 加密
 *
 * SM3 是中国国家密码管理局发布的密码杂凑算法标准
 * 输出 256 位（32 字节）的哈希值
 */

import { sm3 as sm3Hash } from "sm-crypto";

/**
 * SM3 哈希计算
 * @param message 待哈希的字符串
 * @returns 64 位十六进制字符串
 *
 * @example
 * ```ts
 * const hash = sm3('hello world');
 * ```
 */
export function sm3(message: string): string {
  return sm3Hash(message);
}

/**
 * 对密码进行 SM3 加密
 * @param password 原始密码
 * @returns SM3 加密后的密码（64 位十六进制字符串）
 *
 * @example
 * ```ts
 * const encryptedPassword = encryptPassword('admin123');
 * ```
 */
export function encryptPassword(password: string): string {
  return sm3Hash(password);
}

export default sm3;
