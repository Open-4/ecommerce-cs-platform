import { Injectable, Inject } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import type { DbClient } from "../../database/connection";
import { schema } from "../../database/schema/index";

// ============================================================
// 试用系统服务
// ============================================================

const TRIAL_DAYS = 14;
const TRIAL_MAX_CONVERSATIONS = 100; // 试用期内最多 100 次 AI 会话

export interface TrialStatus {
  isActive: boolean;
  plan: string;
  trialStartAt: Date;
  trialEndAt: Date;
  daysRemaining: number;
  conversationsUsed: number;
  conversationsLimit: number;
  isExpired: boolean;
  canUpgrade: boolean;
}

@Injectable()
export class TrialService {
  constructor(@Inject("DB") private readonly db: DbClient) {}

  /** 获取商家的试用状态 */
  async getTrialStatus(merchantId: string): Promise<TrialStatus | null> {
    const [merchant] = await this.db
      .select({
        plan: schema.merchants.plan,
        trialStartAt: schema.merchants.trialStartAt,
        trialEndAt: schema.merchants.trialEndAt,
        trialConversationsUsed: schema.merchants.trialConversationsUsed,
      })
      .from(schema.merchants)
      .where(eq(schema.merchants.id, merchantId));

    if (!merchant) return null;

    const now = new Date();
    const trialEndAt = merchant.trialEndAt
      ? new Date(merchant.trialEndAt)
      : new Date(
          new Date(merchant.trialStartAt).getTime() +
            TRIAL_DAYS * 24 * 3600 * 1000,
        );

    const daysRemaining = Math.max(
      0,
      Math.ceil((trialEndAt.getTime() - now.getTime()) / (24 * 3600 * 1000)),
    );

    const isExpired = now > trialEndAt;
    const conversationsUsed = merchant.trialConversationsUsed ?? 0;

    return {
      isActive: merchant.plan === "free_trial" && !isExpired,
      plan: merchant.plan ?? "free_trial",
      trialStartAt: new Date(merchant.trialStartAt),
      trialEndAt,
      daysRemaining,
      conversationsUsed,
      conversationsLimit: TRIAL_MAX_CONVERSATIONS,
      isExpired: merchant.plan === "free_trial" && isExpired,
      canUpgrade: true,
    };
  }

  /** 检查是否可以使用 AI 功能 */
  async canUseAi(merchantId: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const status = await this.getTrialStatus(merchantId);
    if (!status) return { allowed: false, reason: "商家不存在" };

    // 付费用户始终可用
    if (status.plan !== "free_trial") {
      return { allowed: true };
    }

    // 试用过期
    if (status.isExpired) {
      return {
        allowed: false,
        reason: `试用已于 ${status.trialEndAt.toLocaleDateString("zh-CN")} 到期，请升级套餐`,
      };
    }

    // 达到试用上限
    if (status.conversationsUsed >= status.conversationsLimit) {
      return {
        allowed: false,
        reason: `已达到试用上限（${status.conversationsLimit} 次），请升级套餐`,
      };
    }

    return { allowed: true };
  }

  /** 记录一次 AI 使用 */
  async recordAiUsage(merchantId: string): Promise<void> {
    await this.db
      .update(schema.merchants)
      .set({
        trialConversationsUsed: sql`${schema.merchants.trialConversationsUsed} + 1`,
        totalAiConversations: sql`${schema.merchants.totalAiConversations} + 1`,
      })
      .where(eq(schema.merchants.id, merchantId));
  }

  /** 初始化试用（注册时调用） */
  async startTrial(merchantId: string): Promise<void> {
    const now = new Date();
    const trialEndAt = new Date(
      now.getTime() + TRIAL_DAYS * 24 * 3600 * 1000,
    );

    await this.db
      .update(schema.merchants)
      .set({
        plan: "free_trial",
        trialStartAt: now,
        trialEndAt,
        trialConversationsUsed: 0,
      })
      .where(eq(schema.merchants.id, merchantId));
  }
}
