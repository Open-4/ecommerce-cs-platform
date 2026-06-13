// @ts-nocheck
import { Injectable, Inject } from "@nestjs/common";
import { eq, and } from "drizzle-orm";
import type { DbClient } from "../../database/connection";
import { schema } from "../../database/schema/index";

@Injectable()
export class MerchantService {
  constructor(@Inject("DB") private readonly db: DbClient) {}

  async getProfile(merchantId: string) {
    const [merchant] = await this.db
      .select()
      .from(schema.merchants)
      .where(eq(schema.merchants.id, merchantId));
    if (!merchant) return null;
    const { passwordHash: _, ...safe } = merchant;
    return safe;
  }

  async listShops(merchantId: string) {
    return this.db
      .select()
      .from(schema.shops)
      .where(eq(schema.shops.merchantId, merchantId));
  }

  async addShop(data: {
    merchantId: string;
    platform: string;
    shopName: string;
    appKey?: string;
    appSecret?: string;
    accessToken?: string;
  }) {
    const [shop] = await this.db
      .insert(schema.shops)
      .values({
        merchantId: data.merchantId,
        platform: data.platform as any,
        platformShopId: data.appKey ?? "manual",
        shopName: data.shopName,
        accessToken: data.accessToken ?? data.appSecret ?? "not_configured",
        authStatus: data.accessToken ? "authorized" : "not_authorized",
      })
      .returning();
    return shop;
  }

  async updateShop(shopId: string, merchantId: string, data: {
    appKey?: string;
    appSecret?: string;
    accessToken?: string;
    shopName?: string;
  }) {
    const updates: any = {};
    if (data.shopName) updates.shopName = data.shopName;
    if (data.accessToken) {
      updates.accessToken = data.accessToken;
      updates.authStatus = "authorized";
    }
    const [updated] = await this.db
      .update(schema.shops)
      .set(updates)
      .where(and(
        eq(schema.shops.id, shopId),
        eq(schema.shops.merchantId, merchantId),
      ))
      .returning();
    return updated;
  }

  async updateShopTokens(shopId: string, tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }) {
    await this.db
      .update(schema.shops)
      .set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        authStatus: "authorized",
      })
      .where(eq(schema.shops.id, shopId));
  }
}
