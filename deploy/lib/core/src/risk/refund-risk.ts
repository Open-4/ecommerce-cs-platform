import { REFUND_RISK_WEIGHTS, weightedScore } from "@ecs/shared";

// ============================================================
// 退款风险评估引擎
// ============================================================

/** 风险评估输入 */
export interface RiskAssessmentInput {
  /** 买家历史退货率 (0-1) */
  buyerReturnRate: number;
  /** 品类退货率 (0-1) */
  categoryReturnRate: number;
  /** 订单金额（分） */
  orderAmount: number;
  /** 物流是否异常 */
  logisticAbnormal: boolean;
  /** 买家情绪 */
  buyerEmotion: "positive" | "neutral" | "negative" | "angry";
  /** 买家历史纠纷记录 */
  hasDisputeHistory: boolean;
  /** 退款原因 */
  refundReason: string;
  /** 沟通质量 (1-10) */
  conversationQuality: number;
}

/** 风险评估输出 */
export interface RiskAssessmentOutput {
  /** 风险总分 (0-100) */
  score: number;
  /** 各维度得分 */
  dimensions: Record<string, number>;
  /** 决策建议 */
  recommendation: "agree" | "reject" | "negotiate" | "partial";
  /** 置信度 */
  confidence: number;
  /** 关键风险因素 */
  keyFactors: string[];
}

/**
 * 评估退款风险
 */
export function assessRefundRisk(
  input: RiskAssessmentInput,
): RiskAssessmentOutput {
  const dimensions: Record<string, number> = {};

  // 1. 买家历史退货率 (0-100)
  dimensions.buyerReturnRate = normalizeScore(
    input.buyerReturnRate * 100,
    { low: 5, medium: 15, high: 30 },
  );

  // 2. 品类退货率 (0-100)
  dimensions.categoryReturnRate = normalizeScore(
    input.categoryReturnRate * 100,
    { low: 10, medium: 25, high: 50 },
  );

  // 3. 订单金额 - 高客单更值得挽留 (0-100，反向)
  const amountYuan = input.orderAmount / 100;
  dimensions.orderAmount = amountYuan > 500 ? 0 : amountYuan > 200 ? 20 : amountYuan > 100 ? 40 : 60;

  // 4. 物流异常 (0 或 100)
  dimensions.logisticAbnormal = input.logisticAbnormal ? 80 : 0;

  // 5. 买家情绪
  const emotionScores: Record<string, number> = {
    positive: 0,
    neutral: 20,
    negative: 60,
    angry: 90,
  };
  dimensions.buyerEmotion = emotionScores[input.buyerEmotion] ?? 20;

  // 6. 买家纠纷历史
  dimensions.hasDisputeHistory = input.hasDisputeHistory ? 70 : 0;

  // 7. 退款原因 (关键词匹配)
  dimensions.refundReason = assessRefundReason(input.refundReason);

  // 8. 沟通质量 (1-10 转 0-100，反向)
  dimensions.conversationQuality = Math.max(0, 100 - input.conversationQuality * 10);

  // 计算加权总分
  const weightsMap: Record<string, number> = { ...REFUND_RISK_WEIGHTS };
  const score = Math.round(weightedScore(dimensions, weightsMap) * 100);

  // 决策建议
  let recommendation: RiskAssessmentOutput["recommendation"];
  if (score >= 70) {
    recommendation = "agree";
  } else if (score >= 50) {
    recommendation = "partial";
  } else if (score >= 30) {
    recommendation = "negotiate";
  } else {
    recommendation = "reject";
  }

  // 关键风险因素（得分最高的3个维度）
  const keyFactors = Object.entries(dimensions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .filter(([, score]) => score > 30)
    .map(([key]) => dimensionLabel(key));

  return {
    score,
    dimensions,
    recommendation,
    confidence: calculateConfidence(dimensions),
    keyFactors,
  };
}

function normalizeScore(
  value: number,
  thresholds: { low: number; medium: number; high: number },
): number {
  if (value <= thresholds.low) return 10;
  if (value <= thresholds.medium) return 40;
  if (value <= thresholds.high) return 70;
  return 95;
}

function assessRefundReason(reason: string): number {
  const highRiskPatterns = [
    "质量问题", "假货", "破损", "漏发", "错发",
    "与描述不符", "过敏", "过期",
  ];
  const mediumRiskPatterns = [
    "不喜欢", "不想要", "买错了", "拍错了", "大小不合适",
  ];
  const lowRiskPatterns = [
    "多拍", "重复下单", "地址错误",
  ];

  if (highRiskPatterns.some((p) => reason.includes(p))) return 30;
  if (mediumRiskPatterns.some((p) => reason.includes(p))) return 60;
  if (lowRiskPatterns.some((p) => reason.includes(p))) return 80;
  return 50; // 默认中等
}

function dimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    buyerReturnRate: "买家退货率偏高",
    categoryReturnRate: "品类退货率偏高",
    orderAmount: "订单金额较低",
    logisticAbnormal: "物流状态异常",
    buyerEmotion: "买家情绪激烈",
    hasDisputeHistory: "买家有纠纷记录",
    refundReason: "退款原因存在争议",
    conversationQuality: "沟通质量不佳",
  };
  return labels[key] ?? key;
}

function calculateConfidence(
  dimensions: Record<string, number>,
): number {
  // 如果各维度分数差距大，说明信号清晰，置信度高
  const values = Object.values(dimensions);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);

  // 标准差越大，信号越清晰，置信度越高
  return Math.min(0.95, 0.5 + std / 200);
}
