// ============================================================
// 订单与退款类型
// ============================================================

import type { PlatformType } from "./platform.js";

/** 订单状态（统一抽象） */
export type UnifiedOrderStatus =
  | "pending_payment"   // 待付款
  | "pending_ship"      // 待发货
  | "shipped"           // 已发货
  | "delivered"         // 已签收
  | "completed"         // 已完成
  | "canceled"          // 已取消
  | "partial_refund"    // 部分退款
  | "full_refund";      // 全额退款

/** 退款状态（统一抽象） */
export type UnifiedRefundStatus =
  | "pending"           // 待处理
  | "buyer_returning"   // 买家退货中
  | "seller_receiving"  // 待卖家收货
  | "completed"         // 退款完成
  | "rejected"          // 已拒绝
  | "closed"            // 已关闭
  | "platform_intervening"; // 平台介入

/** 统一订单结构 */
export interface UnifiedOrder {
  orderId: string;
  platform: PlatformType;
  platformOrderId: string;
  buyerNick: string;
  buyerPlatformId: string;
  status: UnifiedOrderStatus;
  totalAmount: number;       // 单位：分
  paymentAmount: number;     // 实付金额
  discountAmount: number;    // 优惠金额
  shippingFee: number;       // 运费
  items: UnifiedOrderItem[];
  shipping?: ShippingInfo;
  createdAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  completedAt?: Date;
  rawData?: Record<string, unknown>;
}

/** 订单商品项 */
export interface UnifiedOrderItem {
  itemId: string;
  productId: string;
  skuId?: string;
  title: string;
  imageUrl?: string;
  price: number;       // 单价（分）
  quantity: number;
  skuProperties?: string;  // SKU 属性描述（颜色:红色;尺码:M）
}

/** 物流信息 */
export interface ShippingInfo {
  company: string;
  trackingNumber: string;
  status: string;
  trackingUrl?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
}

/** 统一退款结构 */
export interface UnifiedRefund {
  refundId: string;
  platform: PlatformType;
  platformRefundId: string;
  orderId: string;
  platformOrderId: string;
  buyerNick: string;
  refundAmount: number;     // 退款金额（分）
  reason: string;           // 退款原因
  description?: string;     // 退款说明
  status: UnifiedRefundStatus;
  goodsStatus?: "not_received" | "received" | "returned";
  evidenceImages?: string[];
  createdAt: Date;
  updatedAt?: Date;
  deadline?: Date;          // 处理截止时间
  rawData?: Record<string, unknown>;
}

/** 举证材料 */
export interface RefundEvidence {
  type: "image" | "video" | "text" | "logistics";
  url?: string;
  text?: string;
}

/** 订单查询过滤器 */
export interface OrderFilter {
  status?: UnifiedOrderStatus[];
  startDate?: Date;
  endDate?: Date;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
