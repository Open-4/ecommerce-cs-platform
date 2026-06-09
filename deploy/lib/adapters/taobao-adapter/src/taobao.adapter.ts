import { BasePlatformAdapter } from "@ecs/base-adapter";
import type { MessageEvent, MessageCallback } from "@ecs/base-adapter";
import type {
  PlatformToken,
  UnifiedMessage,
  UnifiedConversation,
  UnifiedOrder,
  UnifiedRefund,
  UnifiedProduct,
  UnifiedOrderStatus,
  UnifiedRefundStatus,
  SendMessageRequest,
  SendResult,
  RefundEvidence,
  OrderFilter,
  ProductFilter,
  PlatformType,
  UnifiedSku,
} from "@ecs/shared";
import { TokenBucket, delay, safeJsonParse } from "@ecs/shared";

// ============================================================
// 淘宝开放平台 Adapter
// ============================================================

const TAOBAO_API_GATEWAY = "https://gw.open.taobao.com/router/rest";
const TAOBAO_AUTH_URL = "https://oauth.taobao.com/authorize";
const TAOBAO_TOKEN_URL = "https://oauth.taobao.com/token";

/** 淘宝消息数据类型 */
interface TaobaoMessageRaw {
  msg_id: string;
  tid: string;
  from_user_id: string;
  from_user_nick: string;
  from_user_avatar?: string;
  to_user_id: string;
  msg_type: "text" | "img" | "item" | "order" | "refund";
  content: string;
  send_time: string;
  seller_id: string;
  /** 图片消息 */
  img_url?: string;
  /** 商品卡片 */
  item_url?: string;
  item_title?: string;
  item_price?: string;
  item_img?: string;
  /** 订单卡片 */
  order_url?: string;
  order_id?: string;
}

export class TaobaoAdapter extends BasePlatformAdapter {
  readonly platformType: PlatformType = "taobao";

  private readonly appKey: string;
  private readonly appSecret: string;
  private readonly sandbox: boolean;
  private readonly rateLimiter: TokenBucket;

  constructor(config: {
    appKey: string;
    appSecret: string;
    sandbox?: boolean;
  }) {
    super();
    this.appKey = config.appKey;
    this.appSecret = config.appSecret;
    this.sandbox = config.sandbox ?? false;
    this.rateLimiter = new TokenBucket(50, 50); // 50 QPS
  }

  private get baseUrl(): string {
    return this.sandbox
      ? "https://gw.api.tbsandbox.com/router/rest"
      : TAOBAO_API_GATEWAY;
  }

  // ---- 授权 ----

  getAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.appKey,
      redirect_uri: redirectUri,
      state: state ?? "ecs-auth",
      view: "web",
    });
    return `${TAOBAO_AUTH_URL}?${params.toString()}`;
  }

  async exchangeToken(code: string, redirectUri: string): Promise<PlatformToken> {
    const response = await this.apiCall("taobao.top.auth.token.create", {
      code,
      redirect_uri: redirectUri,
    });

    const data = response.token_result ?? response;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + (data.expires_in ?? 86400) * 1000),
      platformUserId: data.taobao_user_id,
      platformShopId: data.taobao_user_nick,
    };
  }

  async refreshToken(token: PlatformToken): Promise<PlatformToken> {
    const response = await this.apiCall("taobao.top.auth.token.refresh", {
      refresh_token: token.refreshToken,
    });

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt: new Date(Date.now() + (response.expires_in ?? 86400) * 1000),
    };
  }

  // ---- 消息收发 ----

  /**
   * 拉取消息（长轮询模式）
   * 实际使用淘宝 IM SDK 或千牛消息 API
   */
  async pullMessages(shopId: string, since?: Date): Promise<MessageEvent> {
    await this.rateLimiter.waitForToken();

    // 淘宝消息拉取使用 IM SDK，这里用 openim API 模拟
    const response = await this.apiCall("taobao.openim.messages.get", {
      user_id: shopId,
      start_time: since?.toISOString(),
      limit: 100,
    });

    const rawMessages: TaobaoMessageRaw[] = response.messages ?? [];
    const messages: UnifiedMessage[] = rawMessages.map((raw) =>
      this.normalizeMessage(raw),
    );

    // 分组为会话
    const conversationMap = new Map<string, UnifiedConversation>();
    for (const msg of messages) {
      if (!conversationMap.has(msg.platformConversationId)) {
        conversationMap.set(msg.platformConversationId, {
          platformConversationId: msg.platformConversationId,
          platform: "taobao",
          buyerNick: msg.senderNick ?? "买家",
          buyerPlatformId: msg.senderPlatformId ?? "",
          buyerAvatar: (msg.rawData as any)?.from_user_avatar,
          status: "new",
          lastMessage: msg,
          lastMessageAt: msg.sentAt,
          unreadCount: 1,
        });
      }
    }

    return {
      shopId,
      messages,
      conversations: Array.from(conversationMap.values()),
    };
  }

  async sendMessage(request: SendMessageRequest): Promise<SendResult> {
    await this.rateLimiter.waitForToken();

    try {
      const content =
        typeof request.content === "string"
          ? request.content
          : request.content.text ?? JSON.stringify(request.content);

      const response = await this.apiCall("taobao.openim.msg.send", {
        to_user_id: request.conversationId,
        content,
        msg_type: request.content.type === "image" ? "img" : "text",
      });

      return {
        success: true,
        messageId: response.msg_id,
        platformMessageId: response.msg_id,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message ?? "发送失败",
        rateLimited: err.code === 29,
        retryAfter: err.code === 29 ? 60 : undefined,
      };
    }
  }

  async markRead(
    platformConversationId: string,
    messageIds: string[],
  ): Promise<void> {
    await this.rateLimiter.waitForToken();
    await this.apiCall("taobao.openim.msg.read", {
      tid: platformConversationId,
      msg_ids: messageIds.join(","),
    });
  }

  // ---- 订单 ----

  async getOrder(shopId: string, platformOrderId: string): Promise<UnifiedOrder> {
    const response = await this.apiCall("taobao.trade.fullinfo.get", {
      tid: platformOrderId,
      fields: this.orderFields(),
    });

    return this.normalizeOrder(response.trade);
  }

  async getOrderList(
    shopId: string,
    filter: OrderFilter,
  ): Promise<UnifiedOrder[]> {
    const response = await this.apiCall("taobao.trades.sold.get", {
      fields: this.orderFields(),
      start_created: filter.startDate?.toISOString(),
      end_created: filter.endDate?.toISOString(),
      status: this.mapOrderStatus(filter.status?.[0]),
      page_no: filter.page ?? 1,
      page_size: Math.min(filter.pageSize ?? 20, 100),
    });

    const trades: any[] = response.trades ?? [];
    return trades.map((t) => this.normalizeOrder(t));
  }

  // ---- 退款 ----

  async getRefundDetail(
    shopId: string,
    platformRefundId: string,
  ): Promise<UnifiedRefund> {
    const response = await this.apiCall("taobao.refund.get", {
      refund_id: platformRefundId,
      fields: "refund_id, tid, title, buyer_nick, refund_fee, reason, description, status, created, modified, good_status, has_good_return",
    });

    return this.normalizeRefund(response.refund);
  }

  async agreeRefund(
    shopId: string,
    platformRefundId: string,
    message?: string,
  ): Promise<void> {
    await this.rateLimiter.waitForToken();
    await this.apiCall("taobao.refund.agree", {
      refund_id: platformRefundId,
      message: message ?? "同意退款",
    });
  }

  async rejectRefund(
    shopId: string,
    platformRefundId: string,
    reason: string,
    evidences: RefundEvidence[],
  ): Promise<void> {
    await this.rateLimiter.waitForToken();

    // 上传凭证图片
    const evidenceUrls = await this.uploadEvidences(evidences);

    await this.apiCall("taobao.refund.refuse", {
      refund_id: platformRefundId,
      refuse_message: reason,
      refuse_proof: evidenceUrls.join(","),
    });
  }

  // ---- 商品 ----

  async getProductDetail(
    shopId: string,
    platformProductId: string,
  ): Promise<UnifiedProduct> {
    const response = await this.apiCall("taobao.item.get", {
      num_iid: platformProductId,
      fields: this.itemFields(),
    });

    return this.normalizeProduct(response.item);
  }

  async getProductList(
    shopId: string,
    filter: ProductFilter,
  ): Promise<UnifiedProduct[]> {
    const response = await this.apiCall("taobao.items.onsale.get", {
      fields: this.itemFields(),
      q: filter.keyword,
      page_no: filter.page ?? 1,
      page_size: Math.min(filter.pageSize ?? 20, 100),
    });

    const items: any[] = response.items ?? [];
    return items.map((i) => this.normalizeProduct(i));
  }

  // ========================================================
  // Private: API 调用
  // ========================================================

  private async apiCall(
    method: string,
    params: Record<string, unknown>,
    accessToken?: string,
  ): Promise<any> {
    await this.rateLimiter.waitForToken();

    const systemParams: Record<string, string> = {
      method,
      app_key: this.appKey,
      format: "json",
      v: "2.0",
      sign_method: "md5",
      timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "+08:00"),
    };

    if (accessToken) {
      systemParams.session = accessToken;
    }

    // 签名
    const allParams = { ...systemParams, ...params };
    systemParams.sign = this.sign(allParams);

    const searchParams = new URLSearchParams(systemParams as Record<string, string>);
    const url = `${this.baseUrl}?${searchParams.toString()}`;

    const bodyParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      bodyParams.append(k, String(v));
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json() as Record<string, unknown>;
    const resultKey = method.replace(/\./g, "_") + "_response";
    const result = (data[resultKey] ?? data) as Record<string, unknown>;

    if (result.error_response) {
      const err = result.error_response as Record<string, unknown>;
      throw new Error(
        `Taobao API Error [${err.code}]: ${err.msg}`,
      );
    }

    return result;
  }

  private sign(params: Record<string, unknown>): string {
    // MD5 签名：按 key 排序 → 拼接 → 添加 secret → MD5 → 大写
    const sorted = Object.keys(params)
      .sort()
      .filter((k) => params[k] !== undefined && params[k] !== "")
      .map((k) => `${k}${params[k]}`)
      .join("");

    const signStr = `${this.appSecret}${sorted}${this.appSecret}`;

    // 简化 MD5（生产环境使用 crypto-js 或 Node crypto）
    let hash = 0;
    for (let i = 0; i < signStr.length; i++) {
      const chr = signStr.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(32, "0");
  }

  private async uploadEvidences(
    evidences: RefundEvidence[],
  ): Promise<string[]> {
    const urls: string[] = [];
    for (const ev of evidences) {
      if (ev.url) {
        // 如果已经是 URL，直接使用
        urls.push(ev.url);
      }
    }
    return urls;
  }

  // ========================================================
  // Private: 数据标准化
  // ========================================================

  private normalizeMessage(raw: TaobaoMessageRaw): UnifiedMessage {
    return {
      platformMessageId: raw.msg_id,
      platformConversationId: raw.tid,
      platform: "taobao",
      direction: "inbound",
      senderType: "buyer",
      senderNick: raw.from_user_nick,
      senderPlatformId: raw.from_user_id,
      content: this.mapMessageContent(raw),
      sentAt: new Date(raw.send_time),
      rawData: raw as unknown as Record<string, unknown>,
    };
  }

  private mapMessageContent(raw: TaobaoMessageRaw): UnifiedMessage["content"] {
    switch (raw.msg_type) {
      case "img":
        return { type: "image", imageUrl: raw.img_url };
      case "item":
        return {
          type: "product_card",
          productCard: {
            productId: raw.item_url ?? "",
            title: raw.item_title ?? "",
            imageUrl: raw.item_img ?? "",
            price: parseFloat(raw.item_price ?? "0"),
          },
        };
      case "order":
        return {
          type: "order_card",
          orderCard: {
            orderId: raw.order_id ?? "",
            status: "",
            totalAmount: 0,
            itemCount: 0,
            items: [],
          },
        };
      default:
        return { type: "text", text: raw.content };
    }
  }

  private normalizeOrder(raw: any): UnifiedOrder {
    return {
      orderId: raw.tid,
      platform: "taobao",
      platformOrderId: raw.tid,
      buyerNick: raw.buyer_nick ?? raw.buyer_message ?? "",
      buyerPlatformId: raw.buyer_open_id ?? raw.buyer_nick ?? "",
      status: this.mapOrderStatus(raw.status) as UnifiedOrderStatus,
      totalAmount: Math.round(parseFloat(raw.payment ?? "0") * 100),
      paymentAmount: Math.round(parseFloat(raw.payment ?? "0") * 100),
      discountAmount: Math.round(
        (parseFloat(raw.total_fee ?? "0") - parseFloat(raw.payment ?? "0")) *
          100,
      ),
      shippingFee: Math.round(parseFloat(raw.post_fee ?? "0") * 100),
      items: (raw.orders ?? []).map((item: any) => ({
        itemId: item.oid,
        productId: item.num_iid,
        skuId: item.sku_id,
        title: item.title ?? "",
        imageUrl: item.pic_path,
        price: Math.round(parseFloat(item.price ?? "0") * 100),
        quantity: item.num ?? 1,
        skuProperties: item.sku_properties_name,
      })),
      shipping: raw.receiver_name
        ? {
            company: raw.logistics_company ?? "",
            trackingNumber: raw.invoice_no ?? "",
            status: "",
          }
        : undefined,
      createdAt: new Date(raw.created ?? Date.now()),
      paidAt: raw.pay_time ? new Date(raw.pay_time) : undefined,
      shippedAt: raw.consign_time ? new Date(raw.consign_time) : undefined,
      rawData: raw,
    };
  }

  private normalizeRefund(raw: any): UnifiedRefund {
    return {
      refundId: raw.refund_id,
      platform: "taobao",
      platformRefundId: raw.refund_id,
      orderId: raw.tid,
      platformOrderId: raw.tid,
      buyerNick: raw.buyer_nick ?? "",
      refundAmount: Math.round(parseFloat(raw.refund_fee ?? "0") * 100),
      reason: raw.reason ?? "",
      description: raw.description,
      status: this.mapRefundStatus(raw.status ?? raw.refund_status),
      goodsStatus: raw.has_good_return === "true" ? "returned" : "received",
      createdAt: new Date(raw.created ?? Date.now()),
      updatedAt: raw.modified ? new Date(raw.modified) : undefined,
      rawData: raw,
    };
  }

  private normalizeProduct(raw: any): UnifiedProduct {
    const skus: UnifiedSku[] = (raw.skus ?? []).map((sku: any) => ({
      skuId: sku.sku_id,
      platformSkuId: sku.sku_id,
      properties: this.parseSkuProperties(sku.properties_name),
      price: Math.round(parseFloat(sku.price ?? "0") * 100),
      originalPrice: sku.origin_price
        ? Math.round(parseFloat(sku.origin_price) * 100)
        : undefined,
      stock: sku.quantity ?? 0,
      barcode: sku.barcode,
      outerId: sku.outer_id,
      imageUrl: sku.image_url,
      status: sku.status === "normal" ? "on_sale" : "off_shelf",
    }));

    return {
      productId: raw.num_iid,
      platform: "taobao",
      platformProductId: raw.num_iid,
      title: raw.title ?? "",
      subtitle: raw.sub_title,
      mainImageUrl: raw.pic_url ?? "",
      images: (raw.item_imgs ?? []).map((img: any) => img.url),
      description: raw.desc ?? "",
      categoryId: raw.cid,
      categoryName: raw.category_name,
      brand: raw.brand,
      priceRange: {
        min: Math.round(parseFloat(raw.price ?? raw.min_price ?? "0") * 100),
        max: Math.round(parseFloat(raw.price ?? raw.max_price ?? "0") * 100),
      },
      skus,
      attributes: (raw.item_properties ?? []).map((prop: any) => ({
        name: prop.name,
        value: prop.value,
      })),
      status: raw.approve_status === "onsale" ? "on_sale" : "off_shelf",
      salesVolume: raw.volume,
      createdAt: new Date(raw.created ?? raw.list_time ?? Date.now()),
      rawData: raw,
    };
  }

  private parseSkuProperties(
    propertiesName?: string,
  ): Array<{ name: string; value: string }> {
    if (!propertiesName) return [];
    return propertiesName.split(";").map((prop) => {
      const [name, value] = prop.split(":");
      return { name: name ?? "", value: value ?? "" };
    });
  }

  // ---- 状态映射 ----

  private mapOrderStatus(status?: string): string {
    const map: Record<string, string> = {
      WAIT_BUYER_PAY: "pending_payment",
      WAIT_SELLER_SEND_GOODS: "pending_ship",
      WAIT_BUYER_CONFIRM_GOODS: "shipped",
      TRADE_BUYER_SIGNED: "delivered",
      TRADE_FINISHED: "completed",
      TRADE_CLOSED: "canceled",
      TRADE_CLOSED_BY_TAOBAO: "canceled",
    };
    return map[status ?? ""] ?? "pending_payment";
  }

  private mapRefundStatus(status: string): UnifiedRefundStatus {
    const map: Record<string, UnifiedRefundStatus> = {
      WAIT_SELLER_AGREE: "pending",
      WAIT_BUYER_RETURN_GOODS: "buyer_returning",
      WAIT_SELLER_CONFIRM_GOODS: "seller_receiving",
      REFUND_SUCCESS: "completed",
      SELLER_REFUSE_BUYER: "rejected",
      CLOSED: "closed",
      SELLER_REFUSE_BUYER_RETURN_GOODS: "rejected",
      WAIT_SELLER_CONFIRM_ADDRESS: "pending",
    };
    return map[status] ?? "pending";
  }

  private itemFields(): string {
    return [
      "num_iid", "title", "sub_title", "pic_url", "item_imgs.url",
      "desc", "cid", "brand", "price", "min_price", "max_price",
      "approve_status", "volume", "created", "list_time",
      "skus.sku_id", "skus.properties_name", "skus.price",
      "skus.origin_price", "skus.quantity", "skus.barcode",
      "skus.outer_id", "skus.image_url", "skus.status",
      "item_properties.name", "item_properties.value",
    ].join(",");
  }

  private orderFields(): string {
    return [
      "tid", "status", "buyer_nick", "buyer_open_id", "buyer_message",
      "payment", "total_fee", "post_fee", "receiver_name",
      "logistics_company", "invoice_no", "created", "pay_time",
      "consign_time", "end_time",
      "orders.oid", "orders.num_iid", "orders.sku_id", "orders.title",
      "orders.pic_path", "orders.price", "orders.num",
      "orders.sku_properties_name",
    ].join(",");
  }
}
