import { getCdnUrl } from "@/config";

/**
 * 全局图标配置接口
 */
export interface GlobalIcons {
  /** 新增加号图标 */
  addPlus: string;
  /** 删除图标 */
  delIcon: string;
  /** 移除图标 */
  removeIcon: string;
  /** 上传图标 */
  uploadIcon: string;
  /** 下载图标 */
  downloadIcon: string;
  /** 审核图标 */
  reviewIcon: string;
  /** 日历图标 */
  calendarIcon: string;
  /** 删除图标 */
  deleteIcon: string;
  /** 设置图标 */
  settingIcon: string;
  /** 应收入账图标 */
  incomeIcon: string;
  /** 应收减免图标 */
  incomeReductionIcon: string;
  /** 违约金减免图标 */
  penaltyReductionIcon: string;
  /** Excel图标 */
  excelIcon: string;
  /** 权重图标 */
  weightIcon: string;
  /** 问题图标 */
  questionIcon: string;
  // 可以继续添加其他全局图标
  logoIcon: string;
  logoTextIcon: string;
  moreIcon: string;
  miIcon: string;
}

/**
 * 全局图标配置对象
 * 通过 unplugin-auto-import 自动导入，无需手动 import
 */
export const globalIcons: GlobalIcons = {
  addPlus: getCdnUrl("images", "add_plus.svg"), // 新增图标
  delIcon: getCdnUrl("images", "del-icon.svg"), // 删除图标
  removeIcon: getCdnUrl("images", "remove.svg"), // 移除图标
  uploadIcon: getCdnUrl("images", "upload-icon.svg"), // 上传图标，导入图标
  downloadIcon: getCdnUrl("images", "download-icon.svg"), // 下载图标
  reviewIcon: getCdnUrl("images", "review-icon.svg"), // 审核图标
  calendarIcon: getCdnUrl("images", "calendar-icon.svg"), // 日历图标
  deleteIcon: getCdnUrl("images", "delete-icon.svg"), // 删除图标
  settingIcon: getCdnUrl("images", "setting-icon.svg"), // 设置图标
  incomeIcon: getCdnUrl("images", "income-icon.svg"), // 应收入账图标
  incomeReductionIcon: getCdnUrl("images", "income-reduction-icon.svg"), // 应收减免图标
  penaltyReductionIcon: getCdnUrl("images", "penalty-reduction-icon.svg"), // 违约金减免图标
  // 可以在这里添加更多全局图标
  excelIcon: getCdnUrl("images", "excel-icon.svg"), // Excel图标
  weightIcon: getCdnUrl("images", "weight-icon.svg"), // 权重图标
  questionIcon: getCdnUrl("images", "question-icon.svg"), // 问题图标
  logoIcon: getCdnUrl("images", "main-logo.svg"), // logo图标
  logoTextIcon: getCdnUrl("images", "logo-text.svg"), // logo文字图标
  moreIcon: getCdnUrl("images", "tree_more.svg"), // 更多图标
  miIcon: getCdnUrl("images", "mi-icon.svg") // 更多图标
} as const;
/**
 * 导出单个图标，方便按需使用
 * 这些导出会被 unplugin-auto-import 自动导入到全局
 */
export const {
  addPlus,
  delIcon,
  removeIcon,
  uploadIcon,
  downloadIcon,
  reviewIcon,
  calendarIcon,
  deleteIcon,
  settingIcon,
  incomeIcon,
  incomeReductionIcon,
  penaltyReductionIcon,
  excelIcon,
  weightIcon,
  questionIcon,
  logoIcon,
  logoTextIcon,
  moreIcon,
  miIcon
} = globalIcons;
