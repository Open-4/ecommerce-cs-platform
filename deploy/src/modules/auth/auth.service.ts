import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { DbClient } from "../../database/connection.js";
import { schema } from "../../database/schema/index.js";
import { eq, sql } from "drizzle-orm";

const TRIAL_DAYS = 14;

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(@Inject("DB") private readonly db: DbClient) {
    this.jwtSecret = process.env.JWT_SECRET ?? "ecs-dev-secret-change-in-prod";
  }

  /** 商家注册（自动开始 14 天试用） */
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date();
    const trialEndAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 3600 * 1000);

    const [merchant] = await this.db
      .insert(schema.merchants)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
        plan: "free_trial",
        trialStartAt: now,
        trialEndAt,
        trialConversationsUsed: 0,
      })
      .returning();

    if (!merchant) {
      throw new Error("注册失败");
    }

    const token = jwt.sign({ sub: merchant.id }, this.jwtSecret, { expiresIn: "7d" });
    return {
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        plan: merchant.plan,
        trialEndAt: merchant.trialEndAt,
      },
      token,
    };
  }

  /** 商家登录 */
  async login(email: string, password: string) {
    const [merchant] = await this.db
      .select()
      .from(schema.merchants)
      .where(eq(schema.merchants.email, email));

    if (!merchant) {
      throw new UnauthorizedException("邮箱或密码错误");
    }

    const valid = await bcrypt.compare(password, merchant.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("邮箱或密码错误");
    }

    const token = jwt.sign({ sub: merchant.id }, this.jwtSecret, { expiresIn: "7d" });
    const { passwordHash: _, ...safeMerchant } = merchant;
    return {
      merchant: {
        ...safeMerchant,
        isTrial: safeMerchant.plan === "free_trial",
        isTrialExpired: safeMerchant.plan === "free_trial" &&
          safeMerchant.trialEndAt &&
          new Date(safeMerchant.trialEndAt) < new Date(),
      },
      token,
    };
  }

  /** 获取试用状态 */
  async getTrialStatus(merchantId: string) {
    const [merchant] = await this.db
      .select({
        plan: schema.merchants.plan,
        trialStartAt: schema.merchants.trialStartAt,
        trialEndAt: schema.merchants.trialEndAt,
        trialConversationsUsed: schema.merchants.trialConversationsUsed,
        totalAiConversations: schema.merchants.totalAiConversations,
      })
      .from(schema.merchants)
      .where(eq(schema.merchants.id, merchantId));

    if (!merchant) return null;

    const now = new Date();
    const trialEndAt = merchant.trialEndAt
      ? new Date(merchant.trialEndAt)
      : new Date();
    const daysRemaining = Math.max(0, Math.ceil(
      (trialEndAt.getTime() - now.getTime()) / (24 * 3600 * 1000),
    ));
    const isExpired = now > trialEndAt;
    const TRIAL_LIMIT = 100;

    return {
      plan: merchant.plan,
      isTrial: merchant.plan === "free_trial",
      isExpired: merchant.plan === "free_trial" && isExpired,
      trialStartAt: merchant.trialStartAt,
      trialEndAt,
      daysRemaining,
      conversationsUsed: merchant.trialConversationsUsed ?? 0,
      conversationsLimit: TRIAL_LIMIT,
      usagePercent: Math.min(100, Math.round(
        ((merchant.trialConversationsUsed ?? 0) / TRIAL_LIMIT) * 100,
      )),
    };
  }

  /** 验证 Token */
  async validateToken(token: string) {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as { sub: string };
      const [merchant] = await this.db
        .select()
        .from(schema.merchants)
        .where(eq(schema.merchants.id, payload.sub));

      if (!merchant) return null;
      const { passwordHash: _, ...safeMerchant } = merchant;
      return safeMerchant;
    } catch {
      return null;
    }
  }
}
