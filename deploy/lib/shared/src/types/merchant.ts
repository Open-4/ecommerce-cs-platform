// ============================================================
// 商家 & 店铺类型
// ============================================================

import type { PlatformType } from "./platform";

/** 商家 */
export interface Merchant {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/** 店铺 */
export interface Shop {
  id: string;
  merchantId: string;
  platform: PlatformType;
  platformShopId: string;
  shopName: string;
  shopLogo?: string;
  /** 授权信息 */
  authStatus: AuthStatus;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

/** 授权状态 */
export type AuthStatus =
  | "not_authorized"   // 未授权
  | "authorizing"      // 授权中
  | "authorized"       // 已授权
  | "expired"          // 已过期
  | "revoked";         // 已撤销

/** 平台 Token */
export interface PlatformToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope?: string[];
  platformUserId?: string;
  platformShopId?: string;
}

/** 商家配置 */
export interface MerchantConfig {
  /** 自动回复开关 */
  autoReplyEnabled: boolean;
  /** AI 回复置信度阈值（低于此值转人工） */
  aiConfidenceThreshold: number;
  /** 工作时间（外时间 AI 全自动） */
  workingHours?: {
    start: string;  // "09:00"
    end: string;    // "18:00"
    timezone: string;
  };
  /** 禁止回复的关键词/话题 */
  blockedTopics?: string[];
  /** 品牌调性描述（注入 Prompt） */
  brandTone?: string;
  /** 退款策略 */
  refundStrategy?: {
    autoAgreeUnder?: number;    // 低于此金额自动同意（分）
    alwaysRequireHuman?: boolean;
    maxRefundRatio?: number;    // 最大退款率预警线
  };
}
