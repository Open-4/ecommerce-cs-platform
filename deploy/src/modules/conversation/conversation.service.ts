// @ts-nocheck
import { Injectable, Inject } from "@nestjs/common";
import { eq, desc, and, count, sql } from "drizzle-orm";
import type { DbClient } from "../../database/connection";
import { schema } from "../../database/schema/index";
import type { ConversationStatus } from "@ecs/shared";
import { transition } from "@ecs/core";

@Injectable()
export class ConversationService {
  constructor(@Inject("DB") private readonly db: DbClient) {}

  /** 获取店铺的会话列表 */
  async listConversations(
    shopId: string,
    options?: {
      status?: string;
      page?: number;
      pageSize?: number;
      keyword?: string;
    },
  ) {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;

    // 构建 where 条件
    const whereConditions = [eq(schema.conversations.shopId, shopId)];

    if (options?.status) {
      whereConditions.push(
        eq(schema.conversations.status, options.status as ConversationStatus),
      );
    }

    if (options?.keyword) {
      whereConditions.push(
        eq(schema.conversations.buyerNick, options.keyword),
      );
    }

    // 总数
    const [countResult] = await this.db
      .select({ count: count() })
      .from(schema.conversations)
      .where(and(...whereConditions));

    const total = countResult?.count ?? 0;

    // 列表查询
    const conversations = await this.db
      .select()
      .from(schema.conversations)
      .where(and(...whereConditions))
      .orderBy(desc(schema.conversations.lastMessageAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    return { conversations, total, page, pageSize };
  }

  /** 获取会话详情（含消息列表） */
  async getConversation(conversationId: string) {
    const [conversation] = await this.db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, conversationId));

    if (!conversation) return null;

    const messageList = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(schema.messages.sentAt);

    return { ...conversation, messages: messageList };
  }

  /** 创建或更新会话 */
  async upsertConversation(data: {
    shopId: string;
    platform: string;
    platformConversationId: string;
    buyerNick: string;
    buyerPlatformId: string;
    buyerAvatar?: string;
  }) {
    const [existing] = await this.db
      .select()
      .from(schema.conversations)
      .where(
        and(
          eq(schema.conversations.platform, data.platform as never),
          eq(schema.conversations.platformConversationId, data.platformConversationId),
        ),
      );

    if (existing) {
      const [updated] = await this.db
        .update(schema.conversations)
        .set({
          buyerNick: data.buyerNick,
          buyerAvatar: data.buyerAvatar,
          lastMessageAt: new Date(),
        })
        .where(eq(schema.conversations.id, existing.id))
        .returning();

      return updated;
    }

    const [created] = await this.db
      .insert(schema.conversations)
      .values({
        shopId: data.shopId,
        platform: data.platform as never,
        platformConversationId: data.platformConversationId,
        buyerNick: data.buyerNick,
        buyerPlatformId: data.buyerPlatformId,
        buyerAvatar: data.buyerAvatar,
        status: "new",
        lastMessageAt: new Date(),
      })
      .returning();

    return created;
  }

  /** 保存消息 */
  async saveMessage(data: {
    conversationId: string;
    direction: "inbound" | "outbound";
    senderType: "buyer" | "ai" | "human" | "system";
    contentType: string;
    content: string;
    platformMessageId?: string;
    aiGenerated?: boolean;
    aiConfidence?: number;
  }) {
    const [message] = await this.db
      .insert(schema.messages)
      .values({
        conversationId: data.conversationId,
        direction: data.direction,
        senderType: data.senderType,
        contentType: data.contentType,
        content: data.content,
        platformMessageId: data.platformMessageId,
        aiGenerated: data.aiGenerated ?? false,
        aiConfidence: data.aiConfidence?.toString() ?? null,
      })
      .returning();

    // 更新会话最后消息时间
    await this.db
      .update(schema.conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(schema.conversations.id, data.conversationId));

    return message;
  }

  /** 更新会话状态 */
  async updateStatus(conversationId: string, newStatus: ConversationStatus) {
    const [conversation] = await this.db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, conversationId));

    if (!conversation) return null;

    const result = transition(
      conversation.status as ConversationStatus,
      `${newStatus}` as never,
    );

    if (!result.valid) return null;

    const [updated] = await this.db
      .update(schema.conversations)
      .set({ status: result.newStatus })
      .where(eq(schema.conversations.id, conversationId))
      .returning();

    return updated;
  }

  /** 标记未读消息为已读 */
  async markAsRead(conversationId: string) {
    await this.db
      .update(schema.conversations)
      .set({ unreadCount: 0 })
      .where(eq(schema.conversations.id, conversationId));
  }

  /** 增加未读计数 */
  async incrementUnread(conversationId: string) {
    const [conv] = await this.db
      .select({ unreadCount: schema.conversations.unreadCount })
      .from(schema.conversations)
      .where(eq(schema.conversations.id, conversationId));

    await this.db
      .update(schema.conversations)
      .set({ unreadCount: (conv?.unreadCount ?? 0) + 1 })
      .where(eq(schema.conversations.id, conversationId));
  }

  /** 分配会话给客服 */
  async assignTo(conversationId: string, userId: string) {
    await this.db
      .update(schema.conversations)
      .set({ assignedTo: userId })
      .where(eq(schema.conversations.id, conversationId));
  }
}
