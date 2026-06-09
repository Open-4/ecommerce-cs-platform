import type { ILLMProvider, LLMRequest, LLMResponse, LLMMessage } from "./providers/base.js";
import { ClaudeProvider } from "./providers/claude.js";
import { OpenAIProvider } from "./providers/openai.js";
import { DeepSeekProvider } from "./providers/deepseek.js";
import type { GuardConfig } from "./guard.js";
import { checkOutput, DEFAULT_GUARD_CONFIG, wrapWithReviewNeeded } from "./guard.js";
import { CostTracker } from "./cost.js";
import type { PromptTemplate } from "./prompts/index.js";

// ============================================================
// LLM 网关 - 统一入口
// ============================================================

/** 网关配置 */
export interface LLMGatewayConfig {
  /** 主提供商 */
  primaryProvider: "claude" | "openai" | "deepseek";
  /** DeepSeek API Key */
  deepseekApiKey?: string;
  /** Claude API Key */
  claudeApiKey?: string;
  /** OpenAI API Key */
  openaiApiKey?: string;
  /** 安全护栏配置 */
  guardConfig?: GuardConfig;
  /** 默认模型覆盖 */
  defaultModels?: {
    intent?: string;
    reply?: string;
    decision?: string;
    summary?: string;
  };
}

/** 带护栏的结果 */
export interface GuardedResponse {
  content: string;
  needsHumanReview: boolean;
  riskLevel: "low" | "medium" | "high";
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}

/** LLM 网关 */
export class LLMGateway {
  private providers: Map<string, ILLMProvider> = new Map();
  private primary: ILLMProvider;
  private guardConfig: GuardConfig;
  private costTracker: CostTracker;
  private modelOverrides: Record<string, string>;

  constructor(config: LLMGatewayConfig) {
    this.guardConfig = config.guardConfig ?? DEFAULT_GUARD_CONFIG;
    this.costTracker = new CostTracker();

    // 初始化提供商
    if (config.deepseekApiKey) {
      this.providers.set(
        "deepseek",
        new DeepSeekProvider({ apiKey: config.deepseekApiKey }),
      );
    }
    if (config.claudeApiKey) {
      this.providers.set(
        "claude",
        new ClaudeProvider({ apiKey: config.claudeApiKey }),
      );
    }
    if (config.openaiApiKey) {
      this.providers.set(
        "openai",
        new OpenAIProvider({ apiKey: config.openaiApiKey }),
      );
    }

    const primary = this.providers.get(config.primaryProvider);
    if (!primary) {
      throw new Error(
        `Primary provider '${config.primaryProvider}' not configured`,
      );
    }
    this.primary = primary;

    this.modelOverrides = {
      intent: config.defaultModels?.intent ?? "deepseek-chat",
      reply: config.defaultModels?.reply ?? "deepseek-chat",
      decision: config.defaultModels?.decision ?? "deepseek-chat",
      summary: config.defaultModels?.summary ?? "deepseek-chat",
    };
  }

  /** 获取成本追踪器 */
  getCostTracker(): CostTracker {
    return this.costTracker;
  }

  /** 意图识别 */
  async classifyIntent(
    message: string,
    context: string,
  ): Promise<{
    intent: string;
    confidence: number;
    subIntent?: string;
    urgency: string;
    sentiment: string;
  }> {
    const result = await this.chat({
      messages: [
        {
          role: "user",
          content: `用户消息：${message}\n\n历史上下文：\n${context}`,
        },
      ],
      model: this.modelOverrides.intent,
      temperature: 0.1,
      maxTokens: 200,
      // 使用 JSON 结构化输出
      responseSchema: {
        type: "object",
        properties: {
          intent: { type: "string" },
          confidence: { type: "number" },
          subIntent: { type: "string" },
          urgency: { type: "string", enum: ["low", "medium", "high"] },
          sentiment: {
            type: "string",
            enum: ["positive", "neutral", "negative"],
          },
        },
        required: ["intent", "confidence", "sentiment"],
      },
    });

    try {
      return JSON.parse(result.content);
    } catch {
      return {
        intent: "other",
        confidence: 0.5,
        sentiment: "neutral",
        urgency: "medium",
      };
    }
  }

  /** 生成回复（带护栏） */
  async generateReply(
    systemPrompt: string,
    userMessage: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<GuardedResponse> {
    const response = await this.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: options?.model ?? this.modelOverrides.reply,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 500,
    });

    // 安全护栏检查
    const guardResult = checkOutput(response.content, this.guardConfig);
    let content = response.content;
    let needsHumanReview = false;

    if (!guardResult.passed) {
      // 如果没有通过护栏，回退到安全兜底回复
      content = "非常抱歉，我需要确认一下再回复您，请稍等片刻~";
      needsHumanReview = true;
    } else if (guardResult.riskLevel === "medium" || guardResult.riskLevel === "high") {
      needsHumanReview = true;
    }

    return {
      content,
      needsHumanReview,
      riskLevel: guardResult.riskLevel,
      model: response.model,
      usage: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        cost: this.costTracker.calculateCost(response.model, response.usage),
      },
    };
  }

  /** 生成退款决策建议 */
  async generateRefundDecision(
    refundData: Record<string, unknown>,
  ): Promise<{
    recommendation: string;
    confidence: number;
    reasoning: string;
    suggestedReply: string;
    riskScore: number;
  }> {
    const result = await this.chat({
      messages: [
        {
          role: "user",
          content: JSON.stringify(refundData, null, 2),
        },
      ],
      model: this.modelOverrides.decision,
      temperature: 0.2,
      maxTokens: 500,
      responseSchema: {
        type: "object",
        properties: {
          recommendation: {
            type: "string",
            enum: ["agree", "reject", "negotiate", "partial"],
          },
          confidence: { type: "number" },
          reasoning: { type: "string" },
          suggestedReply: { type: "string" },
          riskScore: { type: "number", minimum: 0, maximum: 100 },
        },
        required: ["recommendation", "reasoning", "riskScore"],
      },
    });

    try {
      return JSON.parse(result.content);
    } catch {
      return {
        recommendation: "negotiate",
        confidence: 0.5,
        reasoning: "AI 解析失败，建议人工审核",
        suggestedReply: "您的退款申请我们正在核实，请稍等~",
        riskScore: 50,
      };
    }
  }

  /** 底层聊天接口（带成本追踪） */
  private async chat(request: LLMRequest): Promise<LLMResponse> {
    // 尝试主提供商
    try {
      const response = await this.primary.chat(request);
      this.costTracker.record(
        this.primary.name,
        response.model,
        response.usage,
      );
      return response;
    } catch (err) {
      // 尝试备用提供商
      const fallback = this.getFallbackProvider();
      if (fallback) {
        const response = await fallback.chat(request);
        this.costTracker.record(
          fallback.name,
          response.model,
          response.usage,
        );
        return response;
      }
      throw err;
    }
  }

  private getFallbackProvider(): ILLMProvider | null {
    for (const [name, provider] of this.providers) {
      if (name !== this.primary.name) return provider;
    }
    return null;
  }
}

// 重新导出类型
export type { ILLMProvider, LLMRequest, LLMResponse, LLMMessage, LLMUsage } from "./providers/base.js";
export type { GuardConfig, GuardResult } from "./guard.js";
export { checkOutput, DEFAULT_GUARD_CONFIG, wrapWithReviewNeeded } from "./guard.js";
export type { PromptTemplate } from "./prompts/index.js";
export * from "./prompts/index.js";
export { CostTracker } from "./cost.js";
export type { CostRecord } from "./cost.js";
