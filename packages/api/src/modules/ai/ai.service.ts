import { Injectable, Inject } from "@nestjs/common";
import { eq, sql, cosineDistance, desc } from "drizzle-orm";
import type { DbClient } from "../../database/connection.js";
import { schema } from "../../database/schema/index.js";
import { LLMGateway } from "@ecs/llm-gateway";
import {
  REPLY_GENERATE_PROMPT,
  REFUND_DECISION_PROMPT,
  INTENT_CLASSIFY_PROMPT,
  RECOMMEND_PROMPT,
} from "@ecs/llm-gateway";
import {
  assessRefundRisk,
  type RiskAssessmentInput,
} from "@ecs/core";
import { ConversationGateway } from "../conversation/conversation.gateway.js";

// ============================================================
// AI 处理服务 - 核心 pipeline
// ============================================================

@Injectable()
export class AiService {
  private llmGateway: LLMGateway | null = null;

  constructor(
    @Inject("DB") private readonly db: DbClient,
    private readonly conversationGateway: ConversationGateway,
  ) {
    // 初始化 LLM Gateway
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const claudeKey = process.env.CLAUDE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (deepseekKey || claudeKey || openaiKey) {
      this.llmGateway = new LLMGateway({
        primaryProvider: deepseekKey ? "deepseek" : claudeKey ? "claude" : "openai",
        deepseekApiKey: deepseekKey,
        claudeApiKey: claudeKey,
        openaiApiKey: openaiKey,
      });
    }
  }

  /**
   * 处理新消息 - 完整 AI pipeline
   */
  async processIncomingMessage(
    conversationId: string,
    message: string,
    shopId: string,
  ) {
    if (!this.llmGateway) {
      console.warn("[AI] LLM Gateway not configured, skipping AI processing");
      return null;
    }

    // 通知前端 AI 开始处理
    this.conversationGateway.notifyAiStatus(conversationId, "start");

    try {
      // Step 1: 意图识别
      const intent = await this.classifyIntent(message, conversationId);

      // Step 2: 知识检索
      const knowledgeResults = await this.searchKnowledge(
        message,
        shopId,
        intent.intent,
      );

      // Step 3: 检索相关订单/商品信息
      const orderInfo = await this.getOrderContext(conversationId);

      // Step 4: 生成回复
      const reply = await this.llmGateway.generateReply(
        this.buildSystemPrompt(intent.intent, shopId),
        this.buildUserPrompt(message, knowledgeResults, orderInfo),
      );

      // Step 5: 保存 AI 生成的回复作为建议
      if (reply.content) {
        // 发送 AI 建议到前端
        this.conversationGateway.notifyAiSuggestion(conversationId, {
          suggestion: reply.content,
          confidence: 0.85,
          needsHumanReview: reply.needsHumanReview,
        });
      }

      // 如果置信度高且风险低，可以自动发送
      if (!reply.needsHumanReview && reply.riskLevel === "low") {
        // TODO: 通过平台 Adapter 自动发送
        // 保存为 AI 消息
        const { ConversationService } = await import(
          "../conversation/conversation.service.js"
        );
        // 这里在真实实现中会通过 DI 注入
      }

      return reply;
    } finally {
      this.conversationGateway.notifyAiStatus(conversationId, "end");
    }
  }

  /**
   * 意图识别
   */
  private async classifyIntent(message: string, conversationId: string) {
    if (!this.llmGateway) throw new Error("LLM Gateway not configured");

    // 获取最近对话上下文
    const recentMessages = await this.db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.conversationId, conversationId))
      .orderBy(desc(schema.messages.sentAt))
      .limit(5);

    const context = recentMessages
      .reverse()
      .map((m) => `[${m.senderType}]: ${m.content}`)
      .join("\n");

    return this.llmGateway.classifyIntent(message, context);
  }

  /**
   * 知识检索（简易版 RAG）
   * 使用关键词匹配 + pgvector 语义搜索
   */
  private async searchKnowledge(
    query: string,
    shopId: string,
    intent: string,
  ): Promise<string> {
    try {
      // 先用精确关键词匹配
      const keywordResults = await this.db
        .select()
        .from(schema.knowledgeEntries)
        .where(
          sql`${schema.knowledgeEntries.shopId} = ${shopId}
              AND ${schema.knowledgeEntries.isActive} = true
              AND (
                ${schema.knowledgeEntries.question} ILIKE ${`%${query}%`}
                OR ${schema.knowledgeEntries.answer} ILIKE ${`%${query}%`}
              )`,
        )
        .limit(5);

      // 如果有向量 embedding，进行语义检索
      // 开发阶段先返回关键词匹配结果
      if (keywordResults.length > 0) {
        return keywordResults
          .map(
            (k, i) =>
              `[${i + 1}] 问题: ${k.question ?? "通用知识"}\n答案: ${k.answer}`,
          )
          .join("\n\n");
      }

      // 无结果时的兜底知识
      return this.getFallbackKnowledge(intent);
    } catch (err) {
      console.warn("[AI] Knowledge search failed:", err);
      return this.getFallbackKnowledge(intent);
    }
  }

  /**
   * 兜底知识 - 当知识库无结果时使用
   */
  private getFallbackKnowledge(intent: string): string {
    const fallbacks: Record<string, string> = {
      shipping_status:
        "物流信息请以订单详情页的物流跟踪为准。一般情况下，发货后3-5天送达。",
      refund_request:
        "退款申请会在1-3个工作日内处理。如果已发货需要先退货才能退款。",
      order_status:
        "您可以在订单详情查看当前状态。如果有问题，我可以帮您查询。",
      product_inquiry:
        "商品详细信息请查看商品详情页。如有具体问题，我会尽快为您查询。",
    };

    return (
      fallbacks[intent] ??
      "我会尽快为您查询相关信息，请稍等片刻。如有紧急问题可联系人工客服。"
    );
  }

  /**
   * 获取订单上下文
   */
  private async getOrderContext(
    conversationId: string,
  ): Promise<string> {
    const [conv] = await this.db
      .select()
      .from(schema.conversations)
      .where(eq(schema.conversations.id, conversationId));

    if (!conv) return "无订单信息";

    // 查询最近相关的退款决策
    const recentDecisions = await this.db
      .select()
      .from(schema.refundDecisions)
      .where(eq(schema.refundDecisions.conversationId, conversationId))
      .orderBy(desc(schema.refundDecisions.createdAt))
      .limit(1);

    if (recentDecisions.length > 0) {
      const d = recentDecisions[0]!;
      return `关联订单: ${d.orderId}\n风险评分: ${d.riskScore ?? "未知"}\nAI建议: ${d.aiRecommendation ?? "无"}`;
    }

    return "无关联订单";
  }

  /**
   * 构建 System Prompt
   */
  private buildSystemPrompt(intent: string, shopId: string): string {
    // 替换模板变量
    return REPLY_GENERATE_PROMPT.system
      .replace("{{brandTone}}", "专业、友好、耐心，像朋友一样帮助买家解决问题")
      .replace("{{buyerNick}}", "买家")
      .replace("{{intent}}", intent)
      .replace("{{orderInfo}}", "见上下文")
      .replace("{{productInfo}}", "见知识库检索结果");
  }

  /**
   * 构建 User Prompt
   */
  private buildUserPrompt(
    message: string,
    knowledgeResults: string,
    orderInfo: string,
  ): string {
    return `## 知识库检索结果
${knowledgeResults}

## 订单信息
${orderInfo}

## 买家消息
${message}

请生成回复：`;
  }

  /**
   * 处理退款决策
   */
  async processRefundDecision(
    shopId: string,
    conversationId: string,
    refundData: {
      orderAmount: number;
      refundAmount: number;
      refundReason: string;
      refundDescription: string;
      shippingStatus: string;
      daysAfterDelivery: number;
      buyerOrderCount: number;
      buyerReturnRate: number;
      hasDispute: boolean;
      category: string;
      categoryReturnRate: number;
      sentiment: string;
      conversationQuality: number;
    },
  ) {
    // 先用规则引擎打分
    const riskAssessment = assessRefundRisk({
      buyerReturnRate: refundData.buyerReturnRate,
      categoryReturnRate: refundData.categoryReturnRate,
      orderAmount: refundData.orderAmount,
      logisticAbnormal: refundData.shippingStatus.includes("异常"),
      buyerEmotion: mapSentiment(refundData.sentiment),
      hasDisputeHistory: refundData.hasDispute,
      refundReason: refundData.refundReason,
      conversationQuality: refundData.conversationQuality,
    });

    // 如果配置了 LLM，用 LLM 做更复杂的判断
    let aiRecommendation: string = riskAssessment.recommendation;
    let aiReasoning = riskAssessment.keyFactors.join("；");

    if (this.llmGateway) {
      try {
        const llmDecision = await this.llmGateway.generateRefundDecision({
          ...refundData,
          ruleEngineScore: riskAssessment.score,
          ruleEngineRecommendation: riskAssessment.recommendation,
        });

        aiRecommendation = llmDecision.recommendation;
        aiReasoning = llmDecision.reasoning;
      } catch (err) {
        console.warn("[AI] LLM refund decision failed, using rule engine:", err);
      }
    }

    // 保存决策记录
    await this.db.insert(schema.refundDecisions).values({
      shopId,
      conversationId,
      orderId: `order-${Date.now()}`, // TODO: 从真实数据获取
      riskScore: riskAssessment.score,
      aiRecommendation: `${aiRecommendation}: ${aiReasoning}`,
      dimensions: riskAssessment.dimensions,
    });

    return {
      riskScore: riskAssessment.score,
      recommendation: aiRecommendation,
      reasoning: aiReasoning,
      dimensions: riskAssessment.dimensions,
      ruleEngineRecommendation: riskAssessment.recommendation,
    };
  }
}

function mapSentiment(
  sentiment: string,
): "positive" | "neutral" | "negative" | "angry" {
  switch (sentiment) {
    case "positive":
      return "positive";
    case "negative":
      return "negative";
    case "angry":
      return "angry";
    default:
      return "neutral";
  }
}
