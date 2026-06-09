// ============================================================
// 通用工具函数
// ============================================================

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T = unknown>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * 截断文本（保留开头和结尾）
 */
export function truncateText(text: string, maxLength: number, suffix = "..."): string {
  if (text.length <= maxLength) return text;
  const keepLength = Math.max(0, maxLength - suffix.length);
  return text.slice(0, keepLength) + suffix;
}

/**
 * 生成唯一 ID（简化版 UUID v4）
 */
export function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Token Bucket 限流器
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = refillRate;
  }

  /** 尝试获取 token，成功返回 true */
  tryConsume(count = 1): boolean {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  /** 等待直到获取到 token */
  async waitForToken(count = 1): Promise<void> {
    while (!this.tryConsume(count)) {
      const waitTime = (count - this.tokens) / this.refillRate * 1000;
      await delay(Math.max(10, Math.ceil(waitTime)));
      this.refill();
    }
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

/**
 * 金额转换：元 → 分
 */
export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100);
}

/**
 * 金额转换：分 → 元
 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2);
}

/**
 * 脱敏手机号
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
}

/**
 * 脱敏姓名
 */
export function maskName(name: string): string {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0]! + "*";
  return name[0]! + "*".repeat(name.length - 2) + name[name.length - 1];
}

/**
 * 检查是否在工作时间
 */
export function isWorkingHours(
  start: string,
  end: string,
  timezone = "Asia/Shanghai",
): boolean {
  const now = new Date();
  const localeTime = now.toLocaleString("zh-CN", { timeZone: timezone });
  const timeStr = localeTime.split(" ")[1]!; // "HH:mm:ss"
  return timeStr >= start + ":00" && timeStr <= end + ":00";
}

/**
 * 批量分片
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * 计算加权总分
 */
export function weightedScore(
  scores: Record<string, number>,
  weights: Record<string, number>,
): number {
  let total = 0;
  let totalWeight = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key];
    if (score !== undefined) {
      total += score * weight;
      totalWeight += weight;
    }
  }
  return totalWeight > 0 ? total / totalWeight : 0;
}
