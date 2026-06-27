/**
 * china-area-data 模块类型声明
 */
declare module "china-area-data" {
  /**
   * 区域数据映射表
   * 键为区域代码，值为下一级区域的代码到名称的映射
   * 例如：REGION_DATA['86'] 为省份数据
   */
  const REGION_DATA: Record<string, Record<string, string>>;
  export default REGION_DATA;
}
