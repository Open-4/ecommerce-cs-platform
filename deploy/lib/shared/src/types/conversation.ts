// ============================================================
// 会话与消息类型
// ============================================================

import type { PlatformType } from "./platform";

/** 会话状态 */
export type ConversationStatus =
  | "new"
  | "ai_processing"
  | "ai_replied"
  | "need_human"
  | "human_processing"
  | "resolved"
  | "closed";

/** 消息方向 */
export type MessageDirection = "inbound" | "outbound";

/** 发送者类型 */
export type SenderType = "buyer" | "ai" | "human" | "system";

/** 消息内容类型 */
export type ContentType = "text" | "image" | "product_card" | "order_card" | "refund_card";

/** 消息内容结构 */
export interface MessageContent {
  type: ContentType;
  text?: string;
  imageUrl?: string;
  productCard?: ProductCardData;
  orderCard?: OrderCardData;
  refundCard?: RefundCardData;
}

/** 商品卡片数据 */
export interface ProductCardData {
  productId: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  link?: string;
}

/** 订单卡片数据 */
export interface OrderCardData {
  orderId: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  items: Array<{
    title: string;
    imageUrl: string;
    price: number;
    quantity: number;
  }>;
}

/** 退款卡片数据 */
export interface RefundCardData {
  refundId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: string;
}

/** 统一消息结构 */
export interface UnifiedMessage {
  /** 系统内部消息 ID */
  id?: string;
  /** 平台侧消息 ID */
  platformMessageId: string;
  /** 平台侧会话 ID */
  platformConversationId: string;
  /** 平台 */
  platform: PlatformType;
  /** 方向 */
  direction: MessageDirection;
  /** 发送者类型 */
  senderType: SenderType;
  /** 发送者昵称 */
  senderNick?: string;
  /** 发送者平台 ID */
  senderPlatformId?: string;
  /** 内容 */
  content: MessageContent;
  /** 是否 AI 生成 */
  aiGenerated?: boolean;
  /** AI 置信度 (0-1) */
  aiConfidence?: number;
  /** 发送时间 */
  sentAt: Date;
  /** 原始数据（调试用） */
  rawData?: Record<string, unknown>;
}

/** 统一会话结构 */
export interface UnifiedConversation {
  /** 系统内部会话 ID */
  id?: string;
  /** 平台侧会话 ID */
  platformConversationId: string;
  /** 平台 */
  platform: PlatformType;
  /** 店铺 ID */
  shopId?: string;
  /** 买家昵称 */
  buyerNick: string;
  /** 买家平台 ID */
  buyerPlatformId: string;
  /** 买家头像 */
  buyerAvatar?: string;
  /** 会话状态 */
  status: ConversationStatus;
  /** 最新消息 */
  lastMessage?: UnifiedMessage;
  /** 最后消息时间 */
  lastMessageAt: Date;
  /** 标签 */
  tags?: string[];
  /** 未读消息数 */
  unreadCount?: number;
  /** 原始数据 */
  rawData?: Record<string, unknown>;
}

/** 发送消息请求 */
export interface SendMessageRequest {
  conversationId: string;
  content: MessageContent;
  /** 发送者类型，默认 human */
  senderType?: SenderType;
}

/** 发送结果 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  platformMessageId?: string;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}
