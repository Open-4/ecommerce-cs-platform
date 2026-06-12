// @ts-nocheck
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// ============================================================
// 枚举类型
// ============================================================

export const platformEnum = pgEnum("platform", [
  "taobao",
  "douyin",
  "jd",
  "pinduoduo",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
  "new",
  "ai_processing",
  "ai_replied",
  "need_human",
  "human_processing",
  "resolved",
  "closed",
]);

export const authStatusEnum = pgEnum("auth_status", [
  "not_authorized",
  "authorizing",
  "authorized",
  "expired",
  "revoked",
]);

export const messageDirectionEnum = pgEnum("message_direction", [
  "inbound",
  "outbound",
]);

export const senderTypeEnum = pgEnum("sender_type", [
  "buyer",
  "ai",
  "human",
  "system",
]);

export const knowledgeCategoryEnum = pgEnum("knowledge_category", [
  "faq",
  "product",
  "policy",
  "shipping",
  "size",
]);

export const refundDecisionEnum = pgEnum("refund_decision", [
  "agree",
  "reject",
  "negotiate",
  "partial",
]);

// ============================================================
// 表定义
// ============================================================

/** 商家 */
export const merchants = pgTable("merchants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  /** 套餐: free_trial | standard | pro | enterprise */
  plan: varchar("plan", { length: 50 }).default("free_trial").notNull(),
  /** 试用开始时间 */
  trialStartAt: timestamp("trial_start_at", { withTimezone: true }).defaultNow().notNull(),
  /** 试用结束时间（14天后） */
  trialEndAt: timestamp("trial_end_at", { withTimezone: true }),
  /** 试用期内已使用的 AI 会话数 */
  trialConversationsUsed: integer("trial_conversations_used").default(0),
  /** 总 AI 会话数（用于计费） */
  totalAiConversations: integer("total_ai_conversations").default(0),
  config: jsonb("config").$type<{
    autoReplyEnabled?: boolean;
    aiConfidenceThreshold?: number;
    brandTone?: string;
    refundStrategy?: Record<string, unknown>;
  }>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

/** 店铺 */
export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  merchantId: uuid("merchant_id")
    .references(() => merchants.id, { onDelete: "cascade" })
    .notNull(),
  platform: platformEnum("platform").notNull(),
  platformShopId: varchar("platform_shop_id", { length: 100 }).notNull(),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  shopLogo: varchar("shop_logo", { length: 500 }),
  authStatus: authStatusEnum("auth_status").default("not_authorized").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  merchantIdx: index("shops_merchant_idx").on(table.merchantId),
  platformIdx: index("shops_platform_idx").on(table.platform, table.platformShopId),
}));

/** 会话 */
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .references(() => shops.id, { onDelete: "cascade" })
    .notNull(),
  platform: platformEnum("platform").notNull(),
  platformConversationId: varchar("platform_conversation_id", { length: 255 }),
  buyerNick: varchar("buyer_nick", { length: 100 }),
  buyerPlatformId: varchar("buyer_platform_id", { length: 100 }),
  buyerAvatar: varchar("buyer_avatar", { length: 500 }),
  status: conversationStatusEnum("status").default("new").notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  assignedTo: uuid("assigned_to"),
  tags: jsonb("tags").$type<string[]>(),
  unreadCount: integer("unread_count").default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  shopIdx: index("conversations_shop_idx").on(table.shopId),
  statusIdx: index("conversations_status_idx").on(table.status),
  lastMsgIdx: index("conversations_last_msg_idx").on(table.lastMessageAt),
  platformCidIdx: index("conversations_platform_cid_idx").on(
    table.platform,
    table.platformConversationId,
  ),
}));

/** 消息 */
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onDelete: "cascade" })
    .notNull(),
  direction: messageDirectionEnum("direction").notNull(),
  senderType: senderTypeEnum("sender_type").notNull(),
  contentType: varchar("content_type", { length: 20 }).default("text").notNull(),
  content: text("content").notNull(),
  platformMessageId: varchar("platform_message_id", { length: 255 }),
  aiGenerated: boolean("ai_generated").default(false),
  aiConfidence: decimal("ai_confidence", { precision: 3, scale: 2 }),
  humanReviewed: boolean("human_reviewed").default(false),
  usedKnowledgeIds: jsonb("used_knowledge_ids").$type<string[]>(),
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  convIdx: index("messages_conv_idx").on(table.conversationId),
  sentAtIdx: index("messages_sent_at_idx").on(table.sentAt),
}));

/** 知识库 */
export const knowledgeEntries = pgTable("knowledge_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .references(() => shops.id, { onDelete: "cascade" })
    .notNull(),
  category: knowledgeCategoryEnum("category").notNull(),
  question: text("question"),
  answer: text("answer").notNull(),
  embedding: text("embedding"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  source: varchar("source", { length: 50 }).default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => ({
  shopIdx: index("knowledge_shop_idx").on(table.shopId),
  categoryIdx: index("knowledge_category_idx").on(table.category),
}));

/** 退款决策记录 */
export const refundDecisions = pgTable("refund_decisions", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id")
    .references(() => shops.id, { onDelete: "cascade" })
    .notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "set null",
  }),
  platformRefundId: varchar("platform_refund_id", { length: 100 }),
  orderId: varchar("order_id", { length: 100 }).notNull(),
  riskScore: integer("risk_score"),
  aiRecommendation: text("ai_recommendation"),
  humanDecision: refundDecisionEnum("human_decision"),
  result: varchar("result", { length: 50 }),
  dimensions: jsonb("dimensions").$type<Record<string, number>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  shopIdx: index("refund_shop_idx").on(table.shopId),
}));

/** AI 调用日志 */
export const aiCallLogs = pgTable("ai_call_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id, { onDelete: "set null" }),
  conversationId: uuid("conversation_id").references(() => conversations.id, {
    onDelete: "set null",
  }),
  provider: varchar("provider", { length: 50 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  task: varchar("task", { length: 50 }).notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  cost: decimal("cost", { precision: 10, scale: 6 }),
  latencyMs: integer("latency_ms"),
  success: boolean("success").default(true),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  shopIdx: index("ai_logs_shop_idx").on(table.shopId),
  createdIdx: index("ai_logs_created_idx").on(table.createdAt),
}));

// ============================================================
// Schema 命名空间导出
// ============================================================
export const schema = {
  merchants,
  shops,
  conversations,
  messages,
  knowledgeEntries,
  refundDecisions,
  aiCallLogs,
};
