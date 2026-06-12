// @ts-nocheck
import type {
  PlatformToken,
  UnifiedMessage,
  UnifiedConversation,
  UnifiedOrder,
  UnifiedRefund,
  UnifiedProduct,
  SendMessageRequest,
  SendResult,
  RefundEvidence,
  OrderFilter,
  ProductFilter,
  PlatformType,
} from "@ecs/shared";

// ============================================================
// 平台适配器抽象接口
// ============================================================

/**
 * 消息拉取事件
 */
export interface MessageEvent {
  shopId: string;
  messages: UnifiedMessage[];
  conversations: UnifiedConversation[];
}

/**
 * 消息拉取回调
 */
export type MessageCallback = (event: MessageEvent) => Promise<void>;

/**
 * 平台适配器抽象接口
 * 每个电商平台实现自己的 Adapter，遵循此接口
 */
export interface IPlatformAdapter {
  /** 平台类型标识 */
  readonly platformType: PlatformType;

  // ---- 授权 ----

  /** 获取授权跳转 URL */
  getAuthUrl(redirectUri: string, state?: string): string;

  /** 用授权码换取 Token */
  exchangeToken(code: string, redirectUri: string): Promise<PlatformToken>;

  /** 刷新 Token */
  refreshToken(token: PlatformToken): Promise<PlatformToken>;

  // ---- 消息收发 ----

  /**
   * 拉取消息（长轮询模式）
   * 返回自指定时间以来的新消息和更新的会话
   */
  pullMessages(shopId: string, since?: Date): Promise<MessageEvent>;

  /**
   * 订阅消息（Webhook 模式）
   * 注册消息回调，平台有消息时通过 Webhook 推送给我们的服务器
   */
  subscribeMessages(callback: MessageCallback): void;

  /** 取消消息订阅 */
  unsubscribeMessages(): void;

  /** 发送消息到平台 */
  sendMessage(request: SendMessageRequest): Promise<SendResult>;

  /** 标记消息已读 */
  markRead(platformConversationId: string, messageIds: string[]): Promise<void>;

  // ---- 订单 ----

  /** 获取单个订单详情 */
  getOrder(shopId: string, platformOrderId: string): Promise<UnifiedOrder>;

  /** 获取订单列表 */
  getOrderList(shopId: string, filter: OrderFilter): Promise<UnifiedOrder[]>;

  // ---- 退款 ----

  /** 获取退款详情 */
  getRefundDetail(shopId: string, platformRefundId: string): Promise<UnifiedRefund>;

  /** 同意退款 */
  agreeRefund(
    shopId: string,
    platformRefundId: string,
    message?: string,
  ): Promise<void>;

  /** 拒绝退款 */
  rejectRefund(
    shopId: string,
    platformRefundId: string,
    reason: string,
    evidences: RefundEvidence[],
  ): Promise<void>;

  // ---- 商品 ----

  /** 获取单个商品详情 */
  getProductDetail(shopId: string, platformProductId: string): Promise<UnifiedProduct>;

  /** 获取商品列表 */
  getProductList(shopId: string, filter: ProductFilter): Promise<UnifiedProduct[]>;
}

/**
 * 平台适配器抽象基类
 * 提供公共逻辑，子类实现平台特定接口
 */
export abstract class BasePlatformAdapter implements IPlatformAdapter {
  abstract readonly platformType: PlatformType;

  // 授权相关 - 由于平台差异大，留给子类实现
  abstract getAuthUrl(redirectUri: string, state?: string): string;
  abstract exchangeToken(code: string, redirectUri: string): Promise<PlatformToken>;
  abstract refreshToken(token: PlatformToken): Promise<PlatformToken>;

  // 消息相关
  abstract pullMessages(shopId: string, since?: Date): Promise<MessageEvent>;
  abstract sendMessage(request: SendMessageRequest): Promise<SendResult>;
  abstract markRead(platformConversationId: string, messageIds: string[]): Promise<void>;

  // 订阅管理
  protected messageCallbacks: MessageCallback[] = [];

  subscribeMessages(callback: MessageCallback): void {
    this.messageCallbacks.push(callback);
  }

  unsubscribeMessages(): void {
    this.messageCallbacks = [];
  }

  /** 通知所有订阅者 */
  protected async notifySubscribers(event: MessageEvent): Promise<void> {
    await Promise.allSettled(
      this.messageCallbacks.map((cb) => cb(event)),
    );
  }

  // 订单相关
  abstract getOrder(shopId: string, platformOrderId: string): Promise<UnifiedOrder>;
  abstract getOrderList(shopId: string, filter: OrderFilter): Promise<UnifiedOrder[]>;

  // 退款相关
  abstract getRefundDetail(shopId: string, platformRefundId: string): Promise<UnifiedRefund>;
  abstract agreeRefund(
    shopId: string,
    platformRefundId: string,
    message?: string,
  ): Promise<void>;
  abstract rejectRefund(
    shopId: string,
    platformRefundId: string,
    reason: string,
    evidences: RefundEvidence[],
  ): Promise<void>;

  // 商品相关
  abstract getProductDetail(shopId: string, platformProductId: string): Promise<UnifiedProduct>;
  abstract getProductList(shopId: string, filter: ProductFilter): Promise<UnifiedProduct[]>;
}
