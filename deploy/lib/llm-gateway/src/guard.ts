// @ts-nocheck
// ============================================================
// LLM 输出安全护栏 (Output Guard)
// ============================================================

/** 护栏检查结果 */
export interface GuardResult {
  passed: boolean;
  reason?: string;
  blockedPattern?: string;
  riskLevel: "low" | "medium" | "high";
}

/** 护栏配置 */
export interface GuardConfig {
  /** 禁止的关键词/短语 */
  blockedPatterns: RegExp[];
  /** 最大回复长度（字符数） */
  maxResponseLength: number;
  /** 需要人工确认的高风险场景 */
  highRiskPatterns: RegExp[];
}

/** 默认护栏配置 */
export const DEFAULT_GUARD_CONFIG: GuardConfig = {
  blockedPatterns: [
    // 价格/赔付相关
    /我可以给你便宜[0-9]+元/,
    /赔偿你[0-9]+元/,
    /直接退你[0-9]+元/,
    /不用退货直接退款/,
    // 内部信息
    /我们的成本/,
    /进价/,
    /利润率/,
    // 引导离平台
    /加我微信/,
    /微信支付/,
    /支付宝转账/,
    /线下交易/,
    // 敏感承诺
    /保证.*绝对/,
    /肯定不会有问题/,
    /100%.*保证/,
  ],
  maxResponseLength: 500,
  highRiskPatterns: [
    /退款/,
    /投诉/,
    /差评/,
    /质量问题/,
    /假货/,
    /投诉.*平台/,
  ],
};

/**
 * 检查 LLM 输出是否安全
 */
export function checkOutput(
  text: string,
  config: GuardConfig = DEFAULT_GUARD_CONFIG,
): GuardResult {
  // 1. 检查禁止模式
  for (const pattern of config.blockedPatterns) {
    if (pattern.test(text)) {
      return {
        passed: false,
        reason: `输出包含禁止内容: ${pattern.source}`,
        blockedPattern: pattern.source,
        riskLevel: "high",
      };
    }
  }

  // 2. 检查长度
  if (text.length > config.maxResponseLength) {
    return {
      passed: false,
      reason: `回复过长: ${text.length} > ${config.maxResponseLength}`,
      riskLevel: "low",
    };
  }

  // 3. 检查高风险场景
  let riskLevel: GuardResult["riskLevel"] = "low";
  for (const pattern of config.highRiskPatterns) {
    if (pattern.test(text)) {
      riskLevel = "medium";
      break;
    }
  }

  return { passed: true, riskLevel };
}

/**
 * 对高风险输出添加人工确认标记
 */
export function wrapWithReviewNeeded(
  text: string,
  riskReason: string,
): string {
  return `[需要人工确认 - ${riskReason}]\n${text}`;
}
