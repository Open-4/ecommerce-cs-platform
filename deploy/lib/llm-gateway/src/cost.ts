import type { LLMUsage } from "./providers/base";

// ============================================================
// Token 用量 & 成本追踪
// ============================================================

/** 各模型定价（USD per 1M tokens） */
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // DeepSeek (USD per 1M tokens)
  "deepseek-chat": { input: 0.14, output: 0.28 },
  "deepseek-reasoner": { input: 0.55, output: 2.19 },
  // Claude
  "claude-haiku-4-5": { input: 0.80, output: 4.00 },
  "claude-sonnet-4-6": { input: 3.00, output: 15.00 },
  "claude-opus-4-8": { input: 15.00, output: 75.00 },
  // OpenAI
  "gpt-4o": { input: 2.50, output: 10.00 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
};

/** 成本记录 */
export interface CostRecord {
  timestamp: Date;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

/** 成本追踪器 */
export class CostTracker {
  private records: CostRecord[] = [];

  /** 计算一次调用的成本 */
  calculateCost(model: string, usage: LLMUsage): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      // 未知模型按 Sonnet 价格估算
      return (usage.inputTokens / 1_000_000) * 3.0 +
        (usage.outputTokens / 1_000_000) * 15.0;
    }

    return (usage.inputTokens / 1_000_000) * pricing.input +
      (usage.outputTokens / 1_000_000) * pricing.output;
  }

  /** 记录一次调用 */
  record(provider: string, model: string, usage: LLMUsage): void {
    const cost = this.calculateCost(model, usage);
    this.records.push({
      timestamp: new Date(),
      provider,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost,
    });
  }

  /** 获取总成本 */
  getTotalCost(): number {
    return this.records.reduce((sum, r) => sum + r.cost, 0);
  }

  /** 按模型汇总 */
  getSummaryByModel(): Record<
    string,
    { calls: number; totalCost: number; totalTokens: number }
  > {
    const summary: Record<
      string,
      { calls: number; totalCost: number; totalTokens: number }
    > = {};

    for (const r of this.records) {
      if (!summary[r.model]) {
        summary[r.model] = { calls: 0, totalCost: 0, totalTokens: 0 };
      }
      summary[r.model]!.calls++;
      summary[r.model]!.totalCost += r.cost;
      summary[r.model]!.totalTokens += r.inputTokens + r.outputTokens;
    }

    return summary;
  }

  /** 获取近期记录 */
  getRecentRecords(hours = 24): CostRecord[] {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    return this.records.filter((r) => r.timestamp >= since);
  }

  /** 重置追踪 */
  reset(): void {
    this.records = [];
  }
}
