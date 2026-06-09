import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ConversationService } from "../conversation/conversation.service";
import { ConversationGateway } from "../conversation/conversation.gateway";
import { AiService } from "../ai/ai.service";

@Controller("webhook")
export class WebhookController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly conversationGateway: ConversationGateway,
    private readonly aiService: AiService,
  ) {}

  /** 淘宝消息推送回调 */
  @Post("taobao/message")
  @HttpCode(HttpStatus.OK)
  async taobaoMessage(@Body() body: any) {
    try {
      // 解析淘宝消息格式 → UnifiedMessage
      const parsed = this.parseTaobaoMessage(body);

      // 查找或创建会话
      const conversation = await this.conversationService.upsertConversation({
        shopId: parsed.shopId,
        platform: "taobao",
        platformConversationId: parsed.platformConversationId,
        buyerNick: parsed.buyerNick,
        buyerPlatformId: parsed.buyerPlatformId,
        buyerAvatar: parsed.buyerAvatar,
      });

      // 保存消息
      if (conversation) {
        await this.conversationService.saveMessage({
          conversationId: conversation.id,
          direction: "inbound",
          senderType: "buyer",
          contentType: parsed.contentType,
          content: parsed.content,
          platformMessageId: parsed.platformMessageId,
        });

        // 增加未读计数
        await this.conversationService.incrementUnread(conversation.id);

        // 推送新消息到前端
        this.conversationGateway.notifyNewMessage(conversation.id, {
          id: parsed.platformMessageId,
          conversationId: conversation.id,
          direction: "inbound",
          senderType: "buyer",
          contentType: parsed.contentType,
          content: parsed.content,
          sentAt: new Date().toISOString(),
        });

        // 触发 AI 处理（异步，不阻塞响应）
        this.aiService
          .processIncomingMessage(conversation.id, parsed.content, parsed.shopId)
          .catch((err) =>
            console.error("[Webhook] AI processing error:", err),
          );
      }

      return { code: 0, message: "success" };
    } catch (err) {
      console.error("[Webhook] Taobao message error:", err);
      return { code: 0, message: "success" }; // 淘宝要求总是返回成功
    }
  }

  /** 抖音消息推送回调 */
  @Post("douyin/message")
  @HttpCode(HttpStatus.OK)
  async douyinMessage(@Body() body: any) {
    try {
      const parsed = this.parseDouyinMessage(body);

      const conversation = await this.conversationService.upsertConversation({
        shopId: parsed.shopId,
        platform: "douyin",
        platformConversationId: parsed.platformConversationId,
        buyerNick: parsed.buyerNick,
        buyerPlatformId: parsed.buyerPlatformId,
        buyerAvatar: parsed.buyerAvatar,
      });

      if (conversation) {
        await this.conversationService.saveMessage({
          conversationId: conversation.id,
          direction: "inbound",
          senderType: "buyer",
          contentType: parsed.contentType,
          content: parsed.content,
          platformMessageId: parsed.platformMessageId,
        });

        await this.conversationService.incrementUnread(conversation.id);

        this.conversationGateway.notifyNewMessage(conversation.id, {
          id: parsed.platformMessageId,
          conversationId: conversation.id,
          direction: "inbound",
          senderType: "buyer",
          contentType: parsed.contentType,
          content: parsed.content,
          sentAt: new Date().toISOString(),
        });

        this.aiService
          .processIncomingMessage(conversation.id, parsed.content, parsed.shopId)
          .catch((err) =>
            console.error("[Webhook] AI processing error:", err),
          );
      }

      return { code: 0, message: "success" };
    } catch (err) {
      console.error("[Webhook] Douyin message error:", err);
      return { code: 0, message: "success" };
    }
  }

  // ---- 消息解析器（开发阶段模拟） ----

  private parseTaobaoMessage(body: any) {
    // 淘宝开放平台消息格式 → 统一格式
    // 详见: https://open.taobao.com/doc/v3
    return {
      shopId: body.seller_id ?? body.shop_id ?? "mock-shop-id",
      platformConversationId: body.tid ?? body.conversation_id ?? `tb-${Date.now()}`,
      buyerNick: body.buyer_nick ?? "买家",
      buyerPlatformId: body.buyer_id ?? `buyer-${Date.now()}`,
      buyerAvatar: body.buyer_avatar,
      platformMessageId: body.msg_id ?? `msg-${Date.now()}`,
      contentType: body.msg_type === "img" ? "image" : "text",
      content: body.content ?? body.text ?? "",
    };
  }

  private parseDouyinMessage(body: any) {
    // 抖音开放平台消息格式 → 统一格式
    return {
      shopId: body.shop_id ?? "mock-shop-id",
      platformConversationId: body.conversation_short_id ?? `dy-${Date.now()}`,
      buyerNick: body.from_user_name ?? "买家",
      buyerPlatformId: body.from_user_id ?? `buyer-${Date.now()}`,
      buyerAvatar: body.from_user_avatar,
      platformMessageId: body.msg_id ?? `msg-${Date.now()}`,
      contentType: body.msg_type === 2 ? "image" : "text",
      content: body.content ?? "",
    };
  }
}
