/**
 * sm-crypto 模块类型声明
 * @description sm-crypto 是一个纯 JavaScript 库，没有官方的 TypeScript 类型定义
 */
declare module "sm-crypto" {
  /**
   * SM2 椭圆曲线公钥密码算法
   */
  export const sm2: {
    generateKeyPairHex: () => { privateKey: string; publicKey: string };
    doEncrypt: (msg: string, publicKey: string, cipherMode?: 0 | 1) => string;
    doDecrypt: (
      encryptData: string,
      privateKey: string,
      cipherMode?: 0 | 1
    ) => string;
    doSignature: (
      msg: string,
      privateKey: string,
      options?: {
        pointPool?: Array<{ x: string; y: string }>;
        der?: boolean;
        hash?: boolean;
        publicKey?: string;
        userId?: string;
      }
    ) => string;
    doVerifySignature: (
      msg: string,
      signHex: string,
      publicKey: string,
      options?: {
        der?: boolean;
        hash?: boolean;
        userId?: string;
      }
    ) => boolean;
  };

  /**
   * SM3 密码杂凑算法
   * @param msg 待哈希的字符串
   * @returns 64 位十六进制哈希字符串
   */
  export function sm3(msg: string): string;

  /**
   * SM4 分组密码算法
   */
  export const sm4: {
    encrypt: (
      inArray: number[] | string,
      key: number[] | string,
      options?: {
        mode?: "cbc" | "ecb";
        iv?: number[] | string;
        output?: "array" | "string";
      }
    ) => number[] | string;
    decrypt: (
      inArray: number[] | string,
      key: number[] | string,
      options?: {
        mode?: "cbc" | "ecb";
        iv?: number[] | string;
        output?: "array" | "string";
      }
    ) => number[] | string;
  };
}
