import { Injectable, Inject } from "@nestjs/common";
import { eq } from "drizzle-orm";
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
    platformShopId: string;
    shopName: string;
  }) {
    const [shop] = await this.db
      .insert(schema.shops)
      .values({
        merchantId: data.merchantId,
        platform: data.platform as never,
        platformShopId: data.platformShopId,
        shopName: data.shopName,
      })
      .returning();

    return shop;
  }

  async updateShopTokens(
    shopId: string,
    tokens: {
      accessToken: string;
      refreshToken?: string;
      expiresAt?: Date;
    },
  ) {
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
