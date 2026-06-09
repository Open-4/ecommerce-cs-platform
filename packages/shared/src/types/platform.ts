// ============================================================
// 平台抽象类型
// ============================================================

/** 支持的平台 */
export type PlatformType = "taobao" | "douyin" | "jd" | "pinduoduo";

/** 平台配置 */
export interface PlatformConfig {
  type: PlatformType;
  name: string;
  icon: string;
  /** API 基础 URL */
  apiBaseUrl: string;
  /** OAuth 授权地址 */
  authUrl: string;
  /** Token 交换地址 */
  tokenUrl: string;
  /** 消息拉取间隔（毫秒），0 表示使用 Webhook */
  messagePullInterval: number;
  /** 最大消息拉取并发 */
  maxPullConcurrency: number;
  /** API 限流配置 */
  rateLimit: {
    maxRequests: number;
    windowSeconds: number;
  };
}

/** 各平台预设配置 */
export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
  taobao: {
    type: "taobao",
    name: "淘宝/天猫",
    icon: "/icons/taobao.svg",
    apiBaseUrl: "https://gw.open.taobao.com/router/rest",
    authUrl: "https://oauth.taobao.com/authorize",
    tokenUrl: "https://oauth.taobao.com/token",
    messagePullInterval: 5000,
    maxPullConcurrency: 5,
    rateLimit: { maxRequests: 50, windowSeconds: 1 },
  },
  douyin: {
    type: "douyin",
    name: "抖音电商",
    icon: "/icons/douyin.svg",
    apiBaseUrl: "https://open.douyin.com",
    authUrl: "https://open.douyin.com/platform/oauth/connect",
    tokenUrl: "https://open.douyin.com/oauth/access_token",
    messagePullInterval: 0, // Webhook 模式
    maxPullConcurrency: 3,
    rateLimit: { maxRequests: 100, windowSeconds: 60 },
  },
  jd: {
    type: "jd",
    name: "京东",
    icon: "/icons/jd.svg",
    apiBaseUrl: "https://api.jd.com/routerjson",
    authUrl: "https://oauth.jd.com/authorize",
    tokenUrl: "https://oauth.jd.com/token",
    messagePullInterval: 5000,
    maxPullConcurrency: 5,
    rateLimit: { maxRequests: 50, windowSeconds: 1 },
  },
  pinduoduo: {
    type: "pinduoduo",
    name: "拼多多",
    icon: "/icons/pinduoduo.svg",
    apiBaseUrl: "https://gw-api.pinduoduo.com/api/router",
    authUrl: "https://mms.pinduoduo.com/open.html",
    tokenUrl: "https://open-api.pinduoduo.com/oauth/token",
    messagePullInterval: 5000,
    maxPullConcurrency: 5,
    rateLimit: { maxRequests: 30, windowSeconds: 1 },
  },
};
