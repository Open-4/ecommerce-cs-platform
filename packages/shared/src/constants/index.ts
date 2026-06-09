// ============================================================
// 常量定义
// ============================================================

/** 会话状态标签映射 */
export const CONVERSATION_STATUS_LABELS: Record<string, string> = {
  new: "新会话",
  ai_processing: "AI 处理中",
  ai_replied: "AI 已回复",
  need_human: "需要人工",
  human_processing: "人工处理中",
  resolved: "已解决",
  closed: "已关闭",
};

/** 订单状态标签映射 */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "待付款",
  pending_ship: "待发货",
  shipped: "已发货",
  delivered: "已签收",
  completed: "已完成",
  canceled: "已取消",
  partial_refund: "部分退款",
  full_refund: "全额退款",
};

/** 退款状态标签映射 */
export const REFUND_STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  buyer_returning: "买家退货中",
  seller_receiving: "待卖家收货",
  completed: "退款完成",
  rejected: "已拒绝",
  closed: "已关闭",
  platform_intervening: "平台介入",
};

/** 消息内容类型标签 */
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  text: "文本",
  image: "图片",
  product_card: "商品卡片",
  order_card: "订单卡片",
  refund_card: "退款卡片",
};

/** 退款风险评分维度权重 */
export const REFUND_RISK_WEIGHTS = {
  buyerReturnRate: 0.20,      // 买家历史退货率
  categoryReturnRate: 0.15,   // 品类退货率
  orderAmount: 0.10,          // 订单金额（反向）
  logisticAbnormal: 0.10,     // 物流异常
  buyerEmotion: 0.15,         // 买家情绪
  buyerHistory: 0.15,         // 买家历史纠纷
  refundReason: 0.10,         // 退款原因合理性
  conversationQuality: 0.05,  // 沟通质量
} as const;

/** 意图分类标签 */
export const INTENT_CATEGORIES = {
  // 售前
  product_inquiry: "商品咨询",
  price_inquiry: "价格咨询",
  stock_inquiry: "库存咨询",
  promotion_inquiry: "活动咨询",
  comparison: "对比咨询",
  recommendation: "推荐咨询",
  // 售中
  order_status: "订单查询",
  shipping_status: "物流查询",
  modification: "修改订单",
  // 售后
  refund_request: "退款申请",
  return_request: "退货申请",
  complaint: "投诉",
  exchange: "换货",
  // 通用
  greeting: "问候",
  gratitude: "感谢",
  chitchat: "闲聊",
  other: "其他",
} as const;

/** 默认分页大小 */
export const DEFAULT_PAGE_SIZE = 20;

/** 最大分页大小 */
export const MAX_PAGE_SIZE = 100;

/** Token Bucket 默认配置 */
export const DEFAULT_RATE_LIMIT = {
  maxRequests: 50,
  windowSeconds: 1,
} as const;
